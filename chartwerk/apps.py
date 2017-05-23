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
# DATABASE SETTINGS #
#####################
""" If you'd like to separate the database for this app, add the
CHARTWERK_DB environment variable to your .env file (a la DATABASE_URL)
or add the database explicitly to the DATABASES dict in project settings.py
file.
"""

if 'chartwerk' not in settings.DATABASES:
    if 'CHARTWERK_DB' in os.environ:
        settings.DATABASES['chartwerk'] = dj_database_url.parse(
            os.environ.get('CHARTWERK_DB')
        )
        settings.DATABASE_ROUTERS.append('chartwerk.routers.ChartwerkRouter')
else:
    settings.DATABASE_ROUTERS.append('chartwerk.routers.ChartwerkRouter')
