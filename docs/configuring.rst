===========
Configuring
===========

Chartwerk allows you to set a number of configuration options. Some add additional features to the app.



App settings
------------

.. code-block:: python
  :caption: Default settings

  CHARTWERK_AUTH_DECORATOR = "django.contrib.auth.decorators.login_required"
  CHARTWERK_API_AUTHENTICATION_CLASSES = ("rest_framework.authentication.SessionAuthentication",)
  CHARTWERK_API_PERMISSION_CLASSES = ("rest_framework.permissions.IsAuthenticatedOrReadOnly",)
  CHARTWERK_COLOR_SCHEMES = {} # Uses default color scheme in chartwerk-editor

:code:`CHARTWERK_AUTH_DECORATOR`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

String module path to a decorator that should be applied to Chartwerk views to authenticate users.

.. warning::

  This decorator is not applied to views if DEBUG is :code:`True` in your settings.

:code:`CHARTWERK_API_AUTHENTICATION_CLASSES`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Iterable of string module paths to valid Django REST `authentication <http://www.django-rest-framework.org/api-guide/authentication/>`_ classes that should be applied to Django REST Framework's browsable API viewsets.

:code:`CHARTWERK_API_PERMISSION_CLASSES`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Iterable of string module paths to valid Django REST `permission <http://www.django-rest-framework.org/api-guide/permissions/>`_ classes that should be applied to Django REST Framework's browsable API viewsets.

:code:`CHARTWERK_COLOR_SCHEMES`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Set this variable in your project settings to declare a default set of color schemes your users can select for chart elements. The schemes must be organized by type as a dictionary with keys :code:`categorical`, :code:`sequential` and :code:`diverging`. Name each color scheme and then provide a list of hexadecimal color codes. For example:

.. code-block:: python

  # settings.py

  CHARTWERK_COLOR_SCHEMES = {
    'categorical': {
        'default': [
            '#AAAAAA',
            '#BBB',
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
            '#0000FF',
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

.. warning::

  You should specify a :code:`default` color scheme under the :code:`categorical` key. You can name all other schemes whatever you want.



AWS
---

.. code-block:: python
  :caption: Default settings

  CHARTWERK_AWS_ACCESS_KEY_ID = None  # Required
  CHARTWERK_AWS_SECRET_ACCESS_KEY = None  # Required
  CHARTWERK_AWS_BUCKET = None  # Required
  CHARTWERK_AWS_PATH = "charts"
  CHARTWERK_AWS_REGION = "us-east-1"
  CHARTWERK_CACHE_HEADER = "max-age=300"
  CHARTWERK_CLOUDFRONT_DISTRIBUTION = None
  CHARTWERK_DOMAIN = None  # Required

:code:`CHARTWERK_AWS_ACCESS_KEY_ID` **(Required)**
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Amazon Web Services access key ID.

:code:`CHARTWERK_AWS_SECRET_ACCESS_KEY` **(Required)**
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

AWS secret access key.

:code:`CHARTWERK_AWS_BUCKET` **(Required)**
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

AWS S3 bucket name to publish charts to.


:code:`CHARTWERK_DOMAIN` **(Required)**
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The domain of the app running Chartwerk. For example, your app may be hosted at :code:`http://myapp.mydomain.com`.

:code:`CHARTWERK_AWS_REGION`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Region of your AWS bucket.

:code:`CHARTWERK_AWS_PATH`
^^^^^^^^^^^^^^^^^^^^^^^^^^

Path within your S3 bucket to append to your charts when publishing. For example, setting to :code:`chartwerk/charts` would result in charts published to :code:`chartwerk/charts/<chart_id>.html` in your bucket.

:code:`CHARTWERK_CACHE_HEADER`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Cache header to add to chart files when published to S3.

:code:`CHARTWERK_CLOUDFRONT_DISTRIBUTION`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If you're using Amazon CloudFront in front of your S3 bucket and would like to create an invalidation whenever charts are updated, add your distribution ID to this setting.


GitHub
------

Django-chartwerk can commit your chart templates to a GitHub repository for safe keeping.

.. code-block:: python
  :caption: Default settings

  CHARTWERK_GITHUB_ORG = None
  CHARTWERK_GITHUB_REPO = "chartwerk_chart-templates"
  CHARTWERK_GITHUB_USER = None
  CHARTWERK_GITHUB_PASSWORD = None
  CHARTWERK_GITHUB_TOKEN = None


:code:`CHARTWERK_GITHUB_ORG`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To keep templates in a repo under a GitHub organization, set this variable to the GitHub org name.

:code:`CHARTWERK_GITHUB_REPO`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The name of the repo to save chart templates to.

:code:`CHARTWERK_GITHUB_USER`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

GitHub username to access GitHub API.

.. note::

  We recommend you use a `personal access token <https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/>`_ instead of setting your username and password in these settings.

:code:`CHARTWERK_GITHUB_PASSWORD`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Password for your GitHub username.


:code:`CHARTWERK_GITHUB_TOKEN`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

GitHub personal access token with rights to edit private repositories.



Slack
-----

Chartwerk can send notifications to a Slack channel whenever a new chart is created.

.. code-block:: python
  :caption: Default settings

  CHARTWERK_SLACK_CHANNEL = "#chartwerk"
  CHARTWERK_SLACK_TOKEN = None


:code:`CHARTWERK_SLACK_CHANNEL`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Name of the Slack channel to post notifications to.

:code:`CHARTWERK_SLACK_TOKEN`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

A Slack `API token <https://api.slack.com/slack-apps>`_.



oEmbed
------

Chartwerk can act as an oEmbed provider, returning embeddable charts using an oEmbed endpoint at :code:`api/oembed`.

.. code-block:: python
  :caption: Default settings

  CHARTWERK_OEMBED = False
  CHARTWERK_OEMBED_EXTRA_PATTERNS = []


:code:`CHARTWERK_OEMBED`
^^^^^^^^^^^^^^^^^^^^^^^^

Set to :code:`True` to have the oEmbed endpoint returned in the API's context object.



:code:`CHARTWERK_OEMBED_EXTRA_PATTERNS`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If you'd like the oEmbed endpoint to support any additional URL patterns, provide them here. This can be useful if, for example, you alter your root URL configuration and all of the chart URLs change. Each pattern should be provided as a regular expression, with named capture groups that can be used to lookup charts. For example:

.. code-block:: python

  # settings.py

  CHARTWERK_OEMBED_EXTRA_PATTERNS = (
    r'^old-chartwerk/chart/(?P<slug>[-\w]+)/$',
  )


Configuring an oEmbed integration
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Configure your CMS's oEmbed integration to make GET requests to django-chartwerk's oEmbed endpoint at :code:`/api/oembed/`. An example might look like: :code:`https://myapp.com/chartwerk/api/oembed/`.

At minimum, you need to send an encoded URI for the chart you'd like to embed in a :code:`url` query parameter. In django-chartwerk, charts have two canonical URIs:

- :code:`/chart/<chart ID>/`
- :code:`/api/charts/<chart ID>/`

The embed code generator in chartwerk-editor will return the latter to the user when :code:`CHARTWERK_OEMBED = True`.

So an oEmbed request might look like:

:code:`https://myapp.com/chartwerk/api/oembed/?url=https%3A%2F%2Fmyapp.com%2Fchartwerk%2Fchart%2F<chart ID>%2F`

Remember, django-chartwerk will bake out two chart sizes, double and single-wide. Your integration is responsible for passing a user's *preferred* chart size in the oEmbed request as an additional query string parameter, :code:`size={single|double}`.

A response -- using the default embed code -- may look like this:

.. code::

  {
    "version": "1.0",
    "url": "https:\/\/myapp.com\/chartwerk\/chart\/<chart ID>\/",
    "title": "A map",
    "provider_url": "https:\/\/myapp.com\/chartwerk\/",
    "provider_name": "Chartwerk",
    "author_name": "user@email.com",
    "chart_id": "<chart ID>",
    "type": "rich",
    "size": "double",
    "width": 600,
    "height": 494,
    "single_width": 290,
    "single_height": 329,
    "html": "<div id=\"chartwerk_<chart ID>\" class=\"chartwerk\" data-id=\"<chart ID>\" data-dimensions=\"{&quot;double&quot;: {&quot;width&quot;: 600, &quot;height&quot;: 494}, &quot;single&quot;: {&quot;width&quot;: 290, &quot;height&quot;: 329}}\" data-size=\"double\" data-src=\"https:\/\/myS3bucket.com\/charts\/chartwerk\/\" ><\/div> <script src=\"https:\/\/myS3bucket.com\/charts\/chartwerk\/embed-script\/v1.js\"><\/script>"
  }

The :code:`html` property in the response object will be generated using :code:`CHARTWERK_EMBED_TEMPLATE`. Your integration should use it to inject your embed code into your page.


Embed code
----------

These settings configure the code used to embed your charts in a page. The code is either returned to your users directly in the Editor or sent as part of the oEmbed response object, if oEmbed is configured.

The embed code is responsible for injecting an iframe into a page, setting its source to either the single or double-wide chart and, usually, setting its height, width, margins and float styles. (The default embed code uses `Pym.js <http://blog.apps.npr.org/pym.js/>`_.)

By templatizing the embed code, django-chartwerk gives you the freedom to write exactly the code you need for your CMS. The settings consist of a template string, which you can write to include any arbitrary HTML, CSS, or JavaScript, and a context object that allows you to render your tempate with context from a chart instance.


.. note::

  These aren't required settings, but the defaults will be generally useless. At minimum, you should change the embed template context, :code:`CHARTWERK_EMBED_TEMPLATE_CONTEXT`.

.. code-block:: python
  :caption: Default settings

  CHARTWERK_EMBED_TEMPLATE = """
  <div
    id="chartwerk_{{id}}"
    class="chartwerk"
    data-id="{{id}}"
    data-dimensions="{{dimensions|safe}}"
    data-size="{{size}}"
    data-src="{{chart_path}}"
  ></div>
  <script src="{{embed_script}}"></script>
  """

  CHARTWERK_EMBED_TEMPLATE_CONTEXT = lambda chart: {
      'chart_path': 'http://www.somesite.com/path/to/charts/',
      'embed_script': '<CHARTWERK_DOMAIN>/chartwerk/js/main-embed.bundle.js',
  }

:code:`CHARTWERK_EMBED_TEMPLATE`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

A template string which will be rendered with context as the embed code returned to your users. The template will be rendered using the syntax of the `template engine <https://docs.djangoproject.com/en/1.11/topics/templates/#support-for-template-engines>`_ you specify in your project settings.

:code:`CHARTWERK_EMBED_TEMPLATE_CONTEXT`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

A function which takes one parameter, a chart instance, and returns a dictionary to use as context when rendering your template string. Any extra context you set is added to three default context items:

- :code:`id` - the chart slug
- :code:`size` - the preferred chart size specified by the user
- :code:`dimensions` - stringified, escaped JSON object specifying the pixel dimensions of both chart sizes

Tips for configuring your embed code
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

While these settings give you room to completely customize your embed code, in most cases, you can easily use Chartwerk's default embed template by simply setting the :code:`chart_path` and :code:`embed_script` template context variables.

.. code-block:: python

  CHARTWERK_EMBED_TEMPLATE_CONTEXT = lambda chart: {
      'chart_path': 'http://www.yourawsbucket.com/path/to/your/charts/',
      'embed_script': '<CHARTWERK_DOMAIN>/chartwerk/js/main-embed.bundle.js',
  }

.. note::

  The :code:`embed_script` path references the script used to inject an iframe on the parent page within your CMS. It is included with the static files in django-chartwerk, but we highly recommend you host it on S3 next to your charts.

When writing your own template string, remember that Chartwerk adds three additional pieces of context: the slug of the chart, the preferred size of the embed specified by the user and the dimensions of each chart size.

The :code:`id` is the chart slug used to save the chart file to your S3 bucket, either :code:`<slug>.html` or :code:`<slug>_single.html`, for double and single-wide, respectively.

The :code:`size` is either :code:`double` or :code:`single`.

The :code:`dimensions` are a stringified JSON object specifying the height and width of both chart dimensions. You can parse it into an object and use it to set the correct dimensions of your iframe.

.. code-block:: javascript

  // Assuming an templated element like:
  // <div data-dimensions="{{dimensions}}"></div>
  var dimensions = JSON.parse(<element>.dataset.embed);

  // dimensions will be an object like:
  {
    double: {
      width: 500,
      height: 300,
    },
    single: {
      width: 290,
      height: 240,
    },
  }

You can add any additional properties from your chart as template context.

Remember, that your embed template must include the scripts used to inject, configure and style the iframe on your page.

Custom templates
----------------

Customizing the Editor
^^^^^^^^^^^^^^^^^^^^^^

You can customize the Editor with styles to better reflect your CMS by `overriding <https://docs.djangoproject.com/en/1.11/howto/overriding-templates/>`_ the :code:`chartwerk/editor.html` template. Add the template to your project and extend from :code:`chartwerk/django-chartwerk-editor.html`.

.. code-block:: html+jinja

  <!-- chartwerk/editor.html -->
  {% extends "chartwerk/django-chartwerk-editor.html" %}

  {% block head_block %}
  <link rel="stylesheet" type="text/css" href="some_styles.css" />
  {% endblock %}

  {% block body_block %}
  <script src="some_script.js"></script>
  {% endblock %}

Customizing the child page
^^^^^^^^^^^^^^^^^^^^^^^^^^

If you need to customize charts' embaddable child page, you can `override the template <https://docs.djangoproject.com/en/1.11/howto/overriding-templates/>`_ used to bake charts to S3. Add a :code:`chartwerk/bake.html` template to your project that extends from :code:`chartwerk/bake_base.html` and add scripts or styles within the available blocks:

.. code-block:: html+jinja

  <!-- chartwerk/bake.html -->
  {% extends "chartwerk/bake_base.html" %}

  {% block head_block %}
  <link rel="stylesheet" type="text/css" href="some_styles.css" />
  {% endblock %}

  {% block body_block %}
  <script src="some_script.js"></script>
  {% endblock %}
