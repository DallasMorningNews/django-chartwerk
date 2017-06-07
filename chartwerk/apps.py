import os

import dj_database_url
from django.apps import AppConfig
from django.conf import settings

from chartwerk.exceptions import ChartwerkConfigError


class ChartwerkConfig(AppConfig):
    name = 'chartwerk'
    verbose_name = 'chartwerk'

    def ready(self):
        from chartwerk import signals  # noqa


#####################
# REQUIRED SETTINGS #
#####################

missing_required_msg = (
    'You haven\'t set the required %s variable. '
    'Set it in your project settings.'
)

if not hasattr(settings, 'CHARTWERK_DOMAIN'):
    raise ChartwerkConfigError(missing_required_msg % 'CHARTWERK_DOMAIN')

if not hasattr(settings, 'CHARTWERK_EMBED_SCRIPT'):
    raise ChartwerkConfigError(missing_required_msg % 'CHARTWERK_EMBED_SCRIPT')

if not hasattr(settings, 'CHARTWERK_AWS_BUCKET'):
    raise ChartwerkConfigError(missing_required_msg % 'CHARTWERK_AWS_BUCKET')

if not hasattr(settings, 'AWS_ACCESS_KEY_ID'):
    raise ChartwerkConfigError(missing_required_msg % 'AWS_ACCESS_KEY_ID')

if not hasattr(settings, 'AWS_SECRET_ACCESS_KEY'):
    raise ChartwerkConfigError(missing_required_msg % 'AWS_SECRET_ACCESS_KEY')


#####################
# OPTIONAL SETTINGS #
#####################

required_together_msg = (
    'You\'ve set the %s variable, but you haven\'t set the %s variable. '
    'Set it in your project settings.'
)

if hasattr(settings, 'CHARTWERK_GITHUB_PASSWORD') and \
        not hasattr(settings, 'CHARTWERK_GITHUB_USER'):
    raise ChartwerkConfigError(required_together_msg % (
        'CHARTWERK_GITHUB_PASSWORD', 'CHARTWERK_GITHUB_USER',
    ))


if hasattr(settings, 'CHARTWERK_GITHUB_USER') and \
        not hasattr(settings, 'CHARTWERK_GITHUB_PASSWORD'):
    raise ChartwerkConfigError(required_together_msg % (
        'CHARTWERK_GITHUB_USER', 'CHARTWERK_GITHUB_PASSWORD',
    ))


if hasattr(settings, 'CHARTWERK_SLACK_CHANNEL') and \
        not hasattr(settings, 'CHARTWERK_SLACK_TOKEN'):
    raise ChartwerkConfigError(required_together_msg % (
        'CHARTWERK_SLACK_CHANNEL', 'CHARTWERK_SLACK_TOKEN',
    ))


#####################
# DATABASE SETTINGS #
#####################


"""
If you'd like to separate the database for this app, add the
CHARTWERK_DB environment variable to your .env file (a la DATABASE_URL)
or add the database explicitly to the DATABASES dict in project settings.
"""

if 'chartwerk' not in settings.DATABASES:
    if 'CHARTWERK_DB' in os.environ:
        settings.DATABASES['chartwerk'] = dj_database_url.parse(
            os.environ.get('CHARTWERK_DB')
        )
        settings.DATABASE_ROUTERS.append('chartwerk.routers.ChartwerkRouter')
else:
    settings.DATABASE_ROUTERS.append('chartwerk.routers.ChartwerkRouter')
