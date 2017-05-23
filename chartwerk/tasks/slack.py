"""Celery task for sending Slack notifications."""
import logging
import os
import time

from slacker import Slacker

from celery import shared_task
from chartwerk.models import Template
from django.contrib.staticfiles.templatetags.staticfiles import static

logger = logging.getLogger(__name__)

DOMAIN = os.environ.get('CHARTWERK_DOMAIN')

slack = False
if 'CHARTWERK_SLACK_TOKEN' in os.environ:
    slack = Slacker(os.environ.get('CHARTWERK_SLACK_TOKEN'))


def get_template_icon(template_title):
    """Get template's icon."""
    template = Template.objects.filter(title=template_title).first()
    if template.icon:
        return template.icon.url
    return ''


def get_slack_user(email):
    """Get a Slack user by email."""
    users = slack.users.list().body['members']
    user = 'a stranger'
    for u in users:
        if u.get('profile', {}).get('email', '') == email:
            user = '<@{}|{}>'.format(
                u.get('id'),
                u.get('name', 'stranger')
            )
    return user


@shared_task
def notify_slack(instance):
    """Send slack notification."""
    try:
        if slack:
            chart_url = os.path.join(DOMAIN, 'chart', instance.slug)
            attachmentData = [{
                'fallback': '{} created a new chart, "{}" at {}/'.format(
                    get_slack_user(instance.author),
                    instance.title,
                    chart_url
                ),
                'color': '#C91507',
                'pretext': 'New chart by {}'.format(
                    get_slack_user(instance.author)
                ),
                'title': instance.title,
                'title_link': '{}/'.format(chart_url),
                'text': instance.data['template']['title'],
                'thumb_url': get_template_icon(
                    instance.data['template']['title']
                ),
                'footer': 'chartwerk',
                'footer_icon': os.path.join(
                    DOMAIN,
                    static('chartwerk/img/chartwerk_30.png')[1:]
                ),
                'ts': int(time.time())
            }]
            slack.chat.post_message(
                os.environ.get('CHARTWERK_SLACK_CHANNEL', '#chartwerk'),
                '',
                as_user=True,
                attachments=attachmentData
            )
    except Exception:
        logging.exception("Slack notification error")
