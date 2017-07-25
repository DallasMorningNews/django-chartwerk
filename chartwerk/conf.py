"""
This module manages app configuration.

Some settings are required and raise errors if not set.
Other settings have defaults. Optional settigns default to None.
"""

import json
import os

from django.conf import settings as project_settings


class ChartwerkConfigError(Exception):
    """Raised when required config is not present."""

    pass


class Settings:
    pass


#####################
# REQUIRED SETTINGS #
#####################


Settings.DOMAIN = getattr(project_settings, 'CHARTWERK_DOMAIN', None)

if not Settings.DOMAIN:
    raise ChartwerkConfigError('You haven\'t set the CHARTWERK_DOMAIN \
variable. Set it in your project settings.')

Settings.AWS_BUCKET = getattr(project_settings, 'CHARTWERK_AWS_BUCKET', None)

if not Settings.AWS_BUCKET:
    raise ChartwerkConfigError('You haven\'t set the CHARTWERK_AWS_BUCKET \
variable. Set it either in your project settings.')

Settings.AWS_ACCESS_KEY_ID = getattr(
    project_settings, 'CHARTWERK_AWS_ACCESS_KEY_ID', None)

if not Settings.AWS_ACCESS_KEY_ID:
    raise ChartwerkConfigError('You haven\'t set the CHARTWERK_AWS_ACCESS_KEY_ID \
variable. Set it in your project settings.')

Settings.AWS_SECRET_ACCESS_KEY = getattr(
    project_settings, 'CHARTWERK_AWS_SECRET_ACCESS_KEY', None)

if not Settings.AWS_SECRET_ACCESS_KEY:
    raise ChartwerkConfigError('You haven\'t set the CHARTWERK_AWS_SECRET_ACCESS_KEY \
variable. Set it in your project settings.')


########################
# SETTINGS W/ DEFAULTS #
########################

DEFAULT_TEMPLATE_PATH = os.path.join(
    os.path.dirname(__file__),
    'templates/chartwerk/embed.html'
)
with open(DEFAULT_TEMPLATE_PATH, 'r') as template_file:
    DEFAULT_TEMPLATE = template_file.read()

Settings.EMBED_TEMPLATE = getattr(
    project_settings,
    'CHARTWERK_EMBED_TEMPLATE',
    DEFAULT_TEMPLATE
)

EMBED_TEMPLATE_CONTEXT = getattr(
    project_settings, 'CHARTWERK_EMBED_TEMPLATE_CONTEXT',
    lambda chart: {
        'chart_path': 'http://www.somesite.com/path/to/charts/',
    }
)
if not callable(EMBED_TEMPLATE_CONTEXT):
    raise ChartwerkConfigError('CHARTWERK_EMBED_TEMPLATE_CONTEXT must be a \
function that accepts one parameter, the chart object.')

Settings.EMBED_TEMPLATE_CONTEXT = EMBED_TEMPLATE_CONTEXT

Settings.OEMBED = getattr(project_settings, 'CHARTWERK_OEMBED', False)

Settings.OEMBED_EXTRA_PATTERNS = getattr(
    project_settings, 'CHARTWERK_OEMBED_EXTRA_PATTERNS', [])

Settings.AWS_PATH = getattr(project_settings, 'CHARTWERK_AWS_PATH', 'charts')

Settings.CACHE_HEADER = getattr(
    project_settings, 'CHARTWERK_CACHE_HEADER', 'max-age=300')

Settings.JQUERY = getattr(
        project_settings,
        'CHARTWERK_JQUERY',
        'https://code.jquery.com/jquery-3.2.1.slim.min.js'
    )

Settings.AUTH_DECORATOR = getattr(
        project_settings,
        'CHARTWERK_AUTH_DECORATOR',
        'django.contrib.auth.decorators.login_required'
    )

Settings.API_AUTHENTICATION_CLASSES = getattr(
        project_settings,
        'CHARTWERK_API_AUTHENTICATION_CLASSES',
        ('rest_framework.authentication.SessionAuthentication',)
    )

Settings.API_PERMISSION_CLASSES = getattr(
        project_settings,
        'CHARTWERK_API_PERMISSION_CLASSES',
        ('rest_framework.permissions.IsAuthenticatedOrReadOnly',)
    )

Settings.COLOR_SCHEMES = getattr(
    project_settings,
    'CHARTWERK_COLOR_SCHEMES',
    {}
)

#####################
# OPTIONAL SETTINGS #
#####################

Settings.GITHUB_REPO = None

Settings.GITHUB_TOKEN = getattr(
    project_settings, 'CHARTWERK_GITHUB_TOKEN', None)

Settings.GITHUB_USER = getattr(
    project_settings, 'CHARTWERK_GITHUB_USER', None)

Settings.GITHUB_ORG = getattr(
    project_settings, 'CHARTWERK_GITHUB_ORG', None)

Settings.GITHUB_PASSWORD = getattr(
    project_settings, 'CHARTWERK_GITHUB_PASSWORD', None)

# If setting USER or PASSWORD, should set USER and PASSWORD
if not Settings.GITHUB_TOKEN:
    if Settings.GITHUB_PASSWORD and not Settings.GITHUB_USER:
        raise ChartwerkConfigError('You set the CHARTWERK_GITHUB_PASSWORD \
variable, but you haven\'t set the CHARTWERK_GITHUB_USER variable. \
Set it in your project settings or set CHARTWERK_GITHUB_TOKEN.')

    if Settings.GITHUB_USER and not Settings.GITHUB_PASSWORD:
        raise ChartwerkConfigError('You set the CHARTWERK_GITHUB_USER \
variable, but you haven\'t set the CHARTWERK_GITHUB_PASSWORD variable. \
Set it in your project settings or set CHARTWERK_GITHUB_TOKEN.')

if Settings.GITHUB_TOKEN or Settings.GITHUB_USER:

    Settings.GITHUB_REPO = getattr(
            project_settings,
            'CHARTWERK_GITHUB_REPO',
            'chartwerk_chart-templates'
        )


Settings.SLACK_CHANNEL = getattr(
    project_settings, 'CHARTWERK_SLACK_CHANNEL', '#chartwerk')

Settings.SLACK_TOKEN = getattr(
    project_settings, 'CHARTWERK_SLACK_TOKEN', None)

settings = Settings
