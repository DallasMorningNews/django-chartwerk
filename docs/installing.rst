==========
Installing
==========

Assumptions
-----------

1. django-chartwerk is written to save charts to Amazon Web Service's Simple Storage Service (S3). We assume that's your plan, too.

2. django-chartwerk uses Django's `JSONField <https://docs.djangoproject.com/en/1.11/ref/contrib/postgres/fields/#jsonfield>`_ field, therefore, the app **requires** a PostgreSQL database.

.. note::

  If you're not already using PostgreSQL in a project you'd like to add django-chartwerk to, you can separate django-chartwerk's database from your default database by using a custom router, as `outlined in the Django documentation <https://docs.djangoproject.com/en/1.11/topics/db/multi-db/#automatic-database-routing>`_. See "`Using a database router`_" for an example.





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


Using a database router
-----------------------

If you'd like to separate django-chartwerk's PostgreSQL database from the database(s) used in the rest of your Django project, you can write and connect a router.

For example:

.. code-block:: python

  # project/routers.py
  class ChartwerkRouter(object):
    def db_for_read(self, model, **hints):
      if model._meta.app_label == 'chartwerk':
        return 'chartwerk'
      else:
        return 'default'

    def db_for_write(self, model, **hints):
      if model._meta.app_label == 'chartwerk':
        return 'chartwerk'
      else:
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
      if obj1._meta.app_label == 'chartwerk' or obj2._meta.app_label == 'chartwerk':
        return True
      return None

    def allow_migrate(self, db, model):
      if db == 'chartwerk':
        return model._meta.app_label == 'chartwerk'
      elif model._meta.app_label == 'chartwerk':
        return False
      return None

Add your router and database in settings.

.. code-block:: python

  # project/settings.py
  import dj_database_url

  # Add chartwerk DB to existing DB settings
  DATABASES['chartwerk'] = dj_database_url.parse('postgres://...')
  DATABASE_ROUTERS.append('project.routers.ChartwerkRouter')

When you separate django-chartwerk's database, you must specify the database explicitly when running migrations to create models.

.. code::

  $ python manage.py migrate chartwerk --database chartwerk

After running initial migrations, you'll also need to manually load fixtures to get django-chartwerk's free templates.

.. code::

  $ python manage.py loaddata free_templates --database chartwerk
