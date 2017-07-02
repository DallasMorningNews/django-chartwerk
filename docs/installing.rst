==========
Installing
==========

Assumptions
-----------

1. django-chartwerk is written to save charts to Amazon Web Service's Simple Storage Service (S3). We assume that's your plan, too.

2. django-chartwerk uses Django's `JSONField <https://docs.djangoproject.com/en/1.11/ref/contrib/postgres/fields/#jsonfield>`_ field, therefore, the app requires a PostgreSQL database.

.. note::

  If you're not already using PostgreSQL in a project you'd like to add django-chartwerk to, you can separate django-chartwerk's database from your default database by using a custom router, as `outlined in the Django documentation <https://docs.djangoproject.com/en/1.11/topics/db/multi-db/#automatic-database-routing>`_.





Quickstart
----------

1. Install django-chartwerk using pip.

::

  $ pip install django-chartwerk


2. Add Chartwerk's dependencies and the minimum configuration variables.

.. code-block:: python

  # project/settings.py

  INSTALLED_APPS = [
      # ...
      'django.contrib.humanize',
      'rest_framework',
      'chartwerk',
  ]

  CHARTWERK_DOMAIN = 'https://yourapp.com'
  CHARTWERK_EMBED_SCRIPT = 'https://yourapp.com/static/wherever/js/embed_v1.js'
  CHARTWERK_AWS_BUCKET = 'chartwerk'
  CHARTWERK_AWS_ACCESS_KEY_ID = 'YOUR_ACCESS_KEY'
  CHARTWERK_AWS_SECRET_ACCESS_KEY = 'YOUR_SECRET_KEY'

.. note::

  Just trying out Chartwerk locally? Set the above CHARTWERK_ variables to gibberish. They're only needed when you start publishing charts but will throw errors if they aren't set.

3. Add Chartwerk to your project's `urls.py`.

.. code-block:: python

  # project/urls.py

  urlpatterns = [
    # ...
    url(r'^chartwerk/', include('chartwerk.urls')),
  ]

4. Chartwerk uses `Celery <http://docs.celeryproject.org/en/latest/getting-started/introduction.html>`_ to process some tasks asynchronously. Read `"First steps with Django" <http://docs.celeryproject.org/en/latest/django/first-steps-with-django.html>`_ to see how to setup a Celery app in your project. Here is a configuration you can also use to start:

.. code-block:: python

  # project/celery.py
  import os

  from celery import Celery
  from django.conf import settings

  os.environ.setdefault('DJANGO_SETTINGS_MODULE', '<your project>.settings')

  app = Celery('chartwerk')
  app.config_from_object('django.conf:settings', namespace='CELERY')
  app.conf.update(
    task_serializer='json'
  )
  # Use synchronous tasks in local dev
  if settings.DEBUG:
    app.conf.update(task_always_eager=True)
  app.autodiscover_tasks(lambda: settings.INSTALLED_APPS, related_name='celery')


  # project/__init__.py
  from .celery import app as celery_app

  __all__ = ['celery_app']

5. Run migrations and start the dev server!

::

  $ python manage.py migrate chartwerk
  $ python manage.py runserver
