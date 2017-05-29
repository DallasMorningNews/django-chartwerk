import os

import dj_database_url
from django.apps import AppConfig
from django.conf import settings


class ChartwerkConfig(AppConfig):
    name = 'chartwerk'
    verbose_name = 'chartwerk'

    def ready(self):
        from chartwerk import signals  # noqa


#####################
# REQUIRED SETTINGS #
#####################

class ChartwerkConfigError(Exception):
    """Raised when required config is not present."""

    pass


try:
    settings.CHARTWERK_DOMAIN = os.getenv(
        'CHARTWERK_DOMAIN', settings.CHARTWERK_DOMAIN)
except:
    raise ChartwerkConfigError('You haven\'t set the CHARTWERK_DOMAIN \
variable. Set it either in your project settings or as an \
environment variable.')

try:
    settings.CHARTWERK_EMBED_SCRIPT = os.getenv(
        'CHARTWERK_EMBED_SCRIPT', settings.CHARTWERK_EMBED_SCRIPT)
except:
    raise ChartwerkConfigError('You haven\'t set the CHARTWERK_EMBED_SCRIPT \
variable. Set it either in your project settings or as \
an environment variable.')

try:
    settings.CHARTWERK_AWS_BUCKET = os.getenv(
        'CHARTWERK_AWS_BUCKET', settings.CHARTWERK_AWS_BUCKET)
except:
    raise ChartwerkConfigError('You haven\'t set the CHARTWERK_AWS_BUCKET \
variable. Set it either in your project settings or as \
an environment variable.')

if not bool(os.getenv('AWS_ACCESS_KEY_ID', False)):
    raise ChartwerkConfigError('You haven\'t set the AWS_ACCESS_KEY_ID \
variable. Set it as an environment variable.')

if not bool(os.getenv('AWS_SECRET_ACCESS_KEY', False)):
    raise ChartwerkConfigError('You haven\'t set the AWS_SECRET_ACCESS_KEY \
variable. Set it as an environment variable.')

########################
# SETTINGS W/ DEFAULTS #
########################

settings.CHARTWERK_OEMBED = os.getenv(
    'CHARTWERK_OEMBED', getattr(settings, 'CHARTWERK_OEMBED', False))

settings.CHARTWERK_AWS_PATH = os.getenv(
    'CHARTWERK_AWS_PATH', getattr(settings, 'CHARTWERK_AWS_PATH', 'charts'))

settings.CHARTWERK_CACHE_HEADER = os.getenv(
    'CHARTWERK_CACHE_HEADER',
    getattr(settings, 'CHARTWERK_CACHE_HEADER', 'max-age=300'))

settings.CHARTWERK_JQUERY = os.getenv(
    'CHARTWERK_JQUERY',
    getattr(
        settings,
        'CHARTWERK_JQUERY',
        'https://code.jquery.com/jquery-3.2.1.slim.min.js'
    ))

settings.CHARTWERK_AUTH_DECORATOR = os.getenv(
    'CHARTWERK_AUTH_DECORATOR',
    getattr(
        settings,
        'CHARTWERK_AUTH_DECORATOR',
        'django.contrib.auth.decorators.login_required'
    ))

settings.CHARTWERK_COLOR_SCHEMES = getattr(
    settings,
    'CHARTWERK_COLOR_SCHEMES',
    {}
)

#####################
# OPTIONAL SETTINGS #
#####################

if bool(os.getenv('CHARTWERK_GITHUB_PASSWORD', False)):
    if not bool(os.getenv('CHARTWERK_GITHUB_USER', False)):
        raise ChartwerkConfigError('You set the CHARTWERK_GITHUB_PASSWORD \
variable, but you haven\'t set the CHARTWERK_GITHUB_USER variable. \
Set it as an environment variable.')


if bool(os.getenv('CHARTWERK_GITHUB_USER', False)):
    if not bool(os.getenv('CHARTWERK_GITHUB_PASSWORD', False)):
        raise ChartwerkConfigError('You set the CHARTWERK_GITHUB_USER \
variable, but you haven\'t set the CHARTWERK_GITHUB_PASSWORD \
variable. Set it as an environment variable.')

    settings.CHARTWERK_GITHUB_REPO = os.getenv(
        'CHARTWERK_GITHUB_REPO',
        getattr(
            settings,
            'CHARTWERK_GITHUB_REPO',
            'chartwerk_chart-templates'
        ))

    settings.CHARTWERK_GITHUB_ORG = os.getenv(
        'CHARTWERK_GITHUB_ORG',
        getattr(
            settings,
            'CHARTWERK_GITHUB_ORG',
            None
        ))


settings.CHARTWERK_SLACK_CHANNEL = os.getenv(
    'CHARTWERK_SLACK_CHANNEL',
    getattr(
        settings,
        'CHARTWERK_SLACK_CHANNEL',
        '#chartwerk'
    ))

if settings.CHARTWERK_SLACK_CHANNEL:
    if bool(os.getenv('CHARTWERK_SLACK_TOKEN', False)):
        raise ChartwerkConfigError('You set the CHARTWERK_SLACK_CHANNEL \
variable, but you haven\'t set the CHARTWERK_SLACK_TOKEN variable. \
Set it as an environment variable.')

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
