# ![chartwerk](docs/logo.png)


A Django-based application to manage, create and share Chartwerk charts, built with [Django REST framework](http://www.django-rest-framework.org/).

For the React/Redux-based chart editor, see [chartwerk-editor](https://github.com/DallasMorningNews/chartwerk-editor).



## Assumptions

1. django-chartwerk uses Django's [JSONField](https://docs.djangoproject.com/en/1.11/ref/contrib/postgres/fields/#jsonfield) field. Therefore, PostgreSQL is required. You can, however, separate django-chartwerk's database from others in your project easily by using a custom router, such as [the one outlined in the Django documentation](https://docs.djangoproject.com/en/1.11/topics/db/multi-db/#automatic-database-routing).

2. django-chartwerk is written to bake charts to Amazon Web Service's Simple Storage Service (S3). We assume that's your plan, too.


## Installation

1. Install `django-chartwerk`.

    ```bash
    $ pip install django-chartwerk
    ```

2. Add AWS credentials to environment variables.

    ```bash
    # .env
    export AWS_ACCESS_KEY_ID=xxxyyyzzz
    export AWS_SECRET_ACCESS_KEY=aaabbbcccddd
    ```

3. Add chartwerk's dependencies and the minimum configuration variables.

    ```python
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
    ```

    _Just trying out Chartwerk locally? Set the above CHARTWERK\_ variables to gibberish. They're only really needed when you start publishing charts but will throw errors if they aren't set._

4. Add chartwerk to your project's `urls.py`.

    ```python
    # project/urls.py

    urlpatterns = [
        # ...
        url(r'^chartwerk/', include('chartwerk.urls')),
    ]
    ```

5. Chartwerk uses [Celery](http://docs.celeryproject.org/en/latest/getting-started/introduction.html) to process some tasks asynchronously. Read [First steps with Django](http://docs.celeryproject.org/en/latest/django/first-steps-with-django.html) to see how to setup a Celery app in your project. Here is a configuration you can also use to start:

    ```python
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
    ```

    ```python
    # project/__init__.py
    from .celery import app as celery_app

    __all__ = ['celery_app']
    ```

6. Make sure you have django-chartwerk connected to a PostgreSQL database.

7. Run migrations, start the dev server and enjoy!

    ```bash
    $ python manage.py migrate
    $ python manage.py runserver
    ```

## Configuration variables

Chartwerk allows you to set a number of configuration options.

### App settings

- `CHARTWERK_AUTH_DECORATOR`: String module path to a decorator that should be applied to Chartwerk views to authenticate users. Defaults to `"django.contrib.auth.decorators.login_required"`, but can also be `"django.contrib.admin.views.decorators.staff_member_required"`, for example. (This decorator is not applied to views in DEBUG mode.)

- `CHARTWERK_COLOR_SCHEMES`: Set this variable in your project settings to declare a default set of color schemes your users can select for chart elements. The schemes must be organized by type as a dictionary with keys `categorical`, `sequential` and `diverging`. Name each color scheme and then provide a list of hexadecimal color codes. For example:

    ```python
    # settings.py
    CHARTWERK_COLOR_SCHEMES = {
        'categorical': {
            'default': [
                '#AAAAAA',
                '#BBB'
                # etc.
            ],
        }
        'sequential': {
            'reds': [
                '#FF0000',
                '#8B0000',
                # etc.
            ],
            'blues': [
                '#0000FF,
                '#000080',
                # etc.
            ]
        },
        'diverging': {
            'redBlue': [
                '#FF0000',
                '#0000FF',
                # etc.
            ]
        }
    }
    ```

### AWS Publishing

- `CHARTWERK_AWS_ACCESS_KEY_ID`: AWS access key ID.

- `CHARTWERK_AWS_SECRET_ACCESS_KEY`: AWS secret access key.

- `CHARTWERK_AWS_BUCKET`: AWS S3 bucket name to publish charts to. **Required.**

- `CHARTWERK_AWS_PATH`: Path within your S3 bucket to append to object keys before publishing. Defaults to `"charts"`

- `CHARTWERK_CACHE_HEADER`: Cache header to add to chart files when published to S3. Defaults to `"max-age=300"`.

- `CHARTWERK_DOMAIN`: The domain of the app running Chartwerk. For example, your app may be hosted at `"http://myapp.mydomain.com"`. **Required.**

- `CHARTWERK_EMBED_SCRIPT`: Absolute URL to your custom script for embedding Chartwerk charts in your CMS. **Required.**

- `CHARTWERK_JQUERY`: URL to jQuery version you want to include in baked-out charts. Defaults to `"https://code.jquery.com/jquery-3.2.1.slim.min.js"`.

### Github

django-chartwerk can commit your chart templates to a GitHub repository for safe keeping.

- `CHARTWERK_GITHUB_ORG`: To keep templates in a repo under a GitHub organization, set this variable to the GitHub org name.

- `CHARTWERK_GITHUB_REPO`: The name of the repo to save chart templates to. Defaults to `"chartwerk_chart-templates"`.

- `CHARTWERK_GITHUB_USER`, `CHARTWERK_GITHUB_PASSWORD`: GitHub username and password.

- `CHARTWERK_GITHUB_TOKEN`: GitHub personal access token with writes to edit private repositories. Can only be set in lieu of `CHARTWERK_GITHUB_USER` and `CHARTWERK_GITHUB_PASSWORD`.

### Slack

Chartwerk can send notifications to a Slack channel whenever a new chart is created.

- `CHARTWERK_SLACK_CHANNEL`: Name of the Slack channel to post notifications to. Defaults to `"#chartwerk"`.

- `CHARTWERK_SLACK_TOKEN`: A Slack API token.

### oEmbed

Chartwerk can act as an [oEmbed provider](http://oembed.com/), returning embeddable charts using an oEmbed endpoint at `api/oembed`

- `CHARTWERK_OEMBED`: Set to `True` to have the oEmbed endpoint returned in the API's context object

- `CHARTWERK_OEMBED_EXTRA_PATTERNS`: If you'd like the oEmbed endpoint to support any additional URL patterns, provide them here. This can be useful if, for example, you alter your root URL configuration and all of the chart URLs change. Each pattern should be provided as a regular expression, with named capture groups that can be used to lookup charts. For example:

    ```python
    # settings.py
    CHARTWERK_OEMBED_EXTRA_PATTERNS = (
        r'^old-chartwerk/chart/(?P<slug>[-\w]+)/$',
    )
    ```
