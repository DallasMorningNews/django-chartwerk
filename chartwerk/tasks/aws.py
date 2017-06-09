"""Celery task to bake charts to aws."""
from __future__ import absolute_import

import logging
import os

from boto3.session import Session
from celery import shared_task
from chartwerk.conf import settings as app_settings
from chartwerk.models import Chart
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.template.loader import render_to_string
from django.utils.six.moves.urllib.request import urlopen

logger = logging.getLogger(__name__)


def get_chartwerk_bucket():
    session = Session(
        region_name='us-east-1',
        aws_access_key_id=app_settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=app_settings.AWS_SECRET_ACCESS_KEY
    )
    s3 = session.resource('s3')
    return s3.Bucket(app_settings.AWS_BUCKET)


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
            'jquery': app_settings.JQUERY,
            'scripts': render_local_static(
                'chartwerk/js/client.bundle.js'),
            'styles': render_local_static('chartwerk/css/client.css'),
            'reset': render_local_static('chartwerk/css/reset.css')
        }
        werk.dependencies = build_dependencies(
            scripts=werk.data['scripts']['dependencies']['scripts'],
            styles=werk.data['scripts']['dependencies']['styles']
        )
        werk.scripts = werk.data['scripts']
        werk = cleaner(werk)
        # DOUBLE-WIDE
        werk.data['ui']['size'] = 'double'
        key = os.path.join(
            app_settings.AWS_PATH,
            "{}.html".format(werk.slug)
        )
        bucket.Object(key).put(
            Body=render_to_string(
                'chartwerk/base_chart.html', {'werk': werk}),
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
                'chartwerk/base_chart.html', {'werk': werk}),
            ContentType='text/html',
            CacheControl=app_settings.CACHE_HEADER,
            ACL='public-read',
        )
    except Exception:
        logging.exception("AWS write error")
