"""Celery task to bake charts to aws."""
from __future__ import absolute_import

import logging
import os
import subprocess
from datetime import datetime

import boto3
from boto3.session import Session
from celery import shared_task
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.template.loader import render_to_string
from django.utils.encoding import smart_bytes, smart_text
from django.utils.six.moves.urllib.request import urlopen

from chartwerk.conf import settings as app_settings
from chartwerk.models import Chart

logger = logging.getLogger(__name__)


def get_chartwerk_bucket():
    session = Session(
        region_name=app_settings.AWS_REGION,
        aws_access_key_id=app_settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=app_settings.AWS_SECRET_ACCESS_KEY
    )
    s3 = session.resource('s3')
    return s3.Bucket(app_settings.AWS_BUCKET)


def invalidate_cache(slug):
    if app_settings.CLOUDFRONT_DISTRIBUTION:
        cloudfront = boto3.client(
            'cloudfront',
            aws_access_key_id=app_settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=app_settings.AWS_SECRET_ACCESS_KEY
        )
        cloudfront.create_invalidation(
            DistributionId=app_settings.CLOUDFRONT_DISTRIBUTION,
            InvalidationBatch={
                'Paths': {
                    'Quantity': 2,
                    'Items': [
                        os.path.join(
                            '/',
                            app_settings.AWS_PATH,
                            '{}.html'.format(slug)
                        ),
                        os.path.join(
                            '/',
                            app_settings.AWS_PATH,
                            '{}_single.html'.format(slug)
                        ),
                    ]
                },
                'CallerReference': '{}'.format(datetime.now())
            }
        )


def render_local_static(static_file):
    """Render local static file to string to inject into template."""
    return urlopen(
        os.path.join(
            app_settings.DOMAIN,
            static(static_file)[1:]
        )
    ).read().decode('UTF-8')


def render_static_string(url):
    """Render static strings.

    Opens dependency files and renders them into a string for injection
    or returns the url string.
    """
    try:
        return {
            'script': urlopen(url).read().decode('UTF-8'),
            'inject': True
        }
    except:
        return {
            'url': url,
            'inject': False
        }


def build_dependencies(scripts, styles):
    """Build dependencies.

    Builds a dependencies dict that will prefer injecting CSS dependencies
    but can fall back to style tags.
    """
    dependencies = {
        'scripts': [
            {'url': script} for script in scripts
        ],
        'styles': [
            render_static_string(style) for style in styles
        ],
    }
    return dependencies


def cleaner(werk):
    """Clean chart data.

    Cleans off some unnecessary data from the payload, needed only when editing
    a chart.
    """
    werk.data['ui']['rawData'] = None
    werk.data['template']['description'] = None
    werk.data['scripts'] = None
    return werk


def compile_js(scripts):
    """Optionally compile JavaScript.

    Users can specify args to subprocess and pipe JS through any
    available CLI compiler.
    """
    def subprocess_js(script):
        process = subprocess.Popen(
            app_settings.JS_SUBPROCESS,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE
        )
        output, output_err = process.communicate(
            smart_bytes(script, encoding='utf-8')
        )

        if process.returncode != 0:
            logging.error("Error compiling JavaScript: %s", output_err)
            return script

        return smart_text(output)

    if app_settings.JS_SUBPROCESS is None:
        return scripts

    scripts['helper'] = subprocess_js(scripts['helper'])
    scripts['draw'] = subprocess_js(scripts['draw'])
    return scripts


@shared_task
def write_to_aws(pk):
    """Write to AWS S3 bucket.

    Creates dependency file context for injection, renders template as string
    and ships baked charts to AWS.
    """
    bucket = get_chartwerk_bucket()

    if not bucket:
        return

    werk = Chart.objects.get(pk=pk)

    try:
        werk.client = {
            'scripts': render_local_static('chartwerk/js/client.js'),
            'styles': render_local_static('chartwerk/css/client.css'),
        }
        werk.dependencies = build_dependencies(
            scripts=werk.data['scripts']['dependencies']['scripts'],
            styles=werk.data['scripts']['dependencies']['styles']
        )
        werk.scripts = compile_js(werk.data['scripts'])
        werk = cleaner(werk)
        # DOUBLE-WIDE
        werk.data['ui']['size'] = 'double'
        key = os.path.join(
            app_settings.AWS_PATH,
            "{}.html".format(werk.slug)
        )
        bucket.Object(key).put(
            Body=render_to_string(
                'chartwerk/bake.html', {'werk': werk}),
            ContentType='text/html',
            CacheControl=app_settings.CACHE_HEADER,
            ACL='public-read',
        )
        # SINGLE-WIDE
        werk.data['ui']['size'] = 'single'
        key = os.path.join(
            app_settings.AWS_PATH,
            "{}_single.html".format(werk.slug)
        )
        bucket.Object(key).put(
            Body=render_to_string(
                'chartwerk/bake.html', {'werk': werk}),
            ContentType='text/html',
            CacheControl=app_settings.CACHE_HEADER,
            ACL='public-read',
        )
        invalidate_cache(werk.slug)
    except Exception:
        logging.exception("AWS write error")
