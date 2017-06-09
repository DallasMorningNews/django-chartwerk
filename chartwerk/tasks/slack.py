"""Celery task for sending Slack notifications."""
from __future__ import absolute_import

import logging
import os
import time

from slacker import Slacker

from celery import shared_task
from chartwerk.conf import settings as app_settings
from chartwerk.models import Chart, Template
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.urls import reverse

logger = logging.getLogger(__name__)


def get_template_icon(template_title):
    """Get template's icon."""
    template = Template.objects.filter(title=template_title).first()
    if template is not None and template.icon:
        return template.icon.url
    return ''


def get_slack_user(slack, email):
    """Get a Slack user by email."""
    users = slack.users.list().body['members']
    for u in users:
        if u.get('profile', {}).get('email', '') == email:
            return '<@{}|{}>'.format(
                u.get('id'),
                u.get('name', 'stranger')
            )
    return 'a stranger'


@shared_task
def notify_slack(pk):
    """Send slack notification."""
    if not app_settings.SLACK_TOKEN:
        return

    werk = Chart.objects.get(pk=pk)

    slack = Slacker(app_settings.SLACK_TOKEN)

    try:
        chart_url = os.path.join(
            app_settings.DOMAIN,
            reverse('chartwerk_chart', kwargs={'slug': werk.slug})[1:]
        )
        attachmentData = [{
            'fallback': '{} created a new chart, "{}" at {}'.format(
                get_slack_user(slack, werk.author),
                werk.title,
                chart_url
            ),
            'color': '#C91507',
            'pretext': 'New chart by {}'.format(
                get_slack_user(slack, werk.author)
            ),
            'title': werk.title,
            'title_link': chart_url,
            'text': werk.data['template']['title'],
            'thumb_url': get_template_icon(
                werk.data['template']['title']
            ),
            'footer': 'chartwerk',
            'footer_icon': os.path.join(
                app_settings.DOMAIN,
                static('chartwerk/img/chartwerk_30.png')[1:]
            ),
            'ts': int(time.time())
        }]

        bot_icon = os.path.join(
            app_settings.DOMAIN,
            static('chartwerk/img/chartwerk_60.png')[1:]
        )

        slack.chat.post_message(
            app_settings.SLACK_CHANNEL,
            '',
            attachments=attachmentData,
            as_user=False,
            icon_url=bot_icon,
            username='Chartwerk'
        )
    except Exception:
        logging.exception("Slack notification error")
