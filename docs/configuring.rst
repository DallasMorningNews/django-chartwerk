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
  CHARTWERK_JQUERY = "https://code.jquery.com/jquery-3.2.1.slim.min.js"

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

:code:`CHARTWERK_JQUERY`
^^^^^^^^^^^^^^^^^^^^^^^^

Baked charts require jQuery in the `client bundle script <https://the-dallas-morning-news.gitbooks.io/chartwerk-editor/content/docs/embedding.html#child-embed-script>`_. By default, this is set to jQuery's `slim version <https://code.jquery.com/>`_, but you can set this to whatever version you want.




AWS
---

.. code-block:: python
  :caption: Default settings

  CHARTWERK_AWS_ACCESS_KEY_ID = None  # Required
  CHARTWERK_AWS_SECRET_ACCESS_KEY = None  # Required
  CHARTWERK_AWS_BUCKET = None  # Required
  CHARTWERK_AWS_PATH = "charts"
  CHARTWERK_CACHE_HEADER = "max-age=300"
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

:code:`CHARTWERK_AWS_PATH`
^^^^^^^^^^^^^^^^^^^^^^^^^^

Path within your S3 bucket to append to your charts when publishing. For example, setting to :code:`chartwerk/charts` would result in charts published to :code:`chartwerk/charts/<chart_id>.html` in your bucket.

:code:`CHARTWERK_CACHE_HEADER`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Cache header to add to chart files when published to S3.


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


Embed code
----------

These settings configure the embed code used for charts. It is either returned to your users directly in the Editor or sent as part of the oEmbed response object, if oEmbed is configured.

The embed code is responsible for injecting an iframe into a page, setting its source to either the single or double-wide chart and usually hard coding height, width, margins and float styles.

The settings consist of a template string and a context object to render the template with.

.. note::

  These aren't required settings, but the defaults will be generally useless without changing the reference to the AWS bucket where you host your saved charts. At minimum, you should change :code:`CHARTWERK_EMBED_TEMPLATE_CONTEXT` to return the correct context.

.. code-block:: python
  :caption: Default settings

  import json

  CHARTWERK_EMBED_TEMPLATE = """
  <div
    class="chartwerk"
    data-id="{{id}}"
    data-embed="{{embed_sizes}}"
    data-size="{{preferred_size}}"
  ></div>
  <script>
  !function(){for(var t=document.querySelectorAll(".chartwerk"),e=0;e<t.length;e++){var r=t[e],i=r.dataset.id,h=JSON.parse(r.dataset.embed),l=r.dataset.size,a=r.parentElement.clientWidth;if(r.querySelectorAll("iframe").length<1){var s=document.createElement("iframe");s.setAttribute("scrolling","no"),s.setAttribute("frameborder","0"),"double"===l&&a>h.double.width?(s.setAttribute("src","{{chart_path}}"+i+".html"),s.setAttribute("height",h.double.height),s.setAttribute("width","100%")):(s.setAttribute("src","{{chart_path}}"+i+"_single.html"),s.setAttribute("height",h.single.height),s.setAttribute("width",h.single.width)),r.appendChild(s)}}}();
  </script>
  """

  CHARTWERK_EMBED_TEMPLATE_CONTEXT = lambda chart: {
      'embed_sizes': json.dumps(chart.embed_data).replace('"', '&quot;'),
      'chart_path': 'http://www.somesite.com/path/to/charts/',
  }

:code:`CHARTWERK_EMBED_TEMPLATE`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

A string template which will be rendered with context as the embed code returned to your users. The template will be rendered using the syntax of the `template engine <https://docs.djangoproject.com/en/1.11/topics/templates/#support-for-template-engines>`_ you specify in your project settings.

:code:`CHARTWERK_EMBED_TEMPLATE_CONTEXT`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

A function which takes one parameter, a chart instance, and returns a dictionary to use as context when rendering your template string. Any extra context you set is added to two default context items:

- :code:`id` - the chart slug
- :code:`size` - the preferred chart size specified by the user

Tips for configuring your embed code
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

While these settings give you room to fully customize your embed code, in most cases, you can easily use Chartwerk's default embed template by simply setting the :code:`chart_path` template context to the path where your charts are saved.

.. code-block:: python

  import json

  CHARTWERK_EMBED_TEMPLATE_CONTEXT = lambda chart: {
      'embed_sizes': json.dumps(chart.embed_data).replace('"', '&quot;'),
      'chart_path': 'http://www.yourawsbucket.com/path/to/your/charts/',
  }

When writing your own template string, remember that Chartwerk adds two additional pieces of context, the slug of the chart and the preferred size of the embed specified by the user, which you should use in your template. The :code:`id` is the chart slug used to save the chart file to your S3 bucket, either :code:`<slug>.html` or :code:`<slug>_single.html`, for double and single-wide, respectively. The :code:`size` is either :code:`double` or :code:`single` and can be used to correctly reference your chart file.

You can add any additional properties from your chart as template context. The most important of these is likely the embed dimensions for each chart size. The default embed code and context renders this as a stringified, escaped JSON object, which the embed code can then parse.


Remember, that your embed template must include the scripts used to inject, configure and style the iframe on your page. For your reference, here is the script used in the default embed template:

.. code-block:: javascript

  (function(){
    var werks = document.querySelectorAll(".chartwerk");
    for (var i = 0; i < werks.length; i++) {
        var werk = werks[i],
            // Get ID
            id = werk.dataset.id,
            // Parse embed dimensions object
            dimensions = JSON.parse(werk.dataset.embed),
            // Get the preferred embed size
            size = werk.dataset.size,
            screen = werk.parentElement.clientWidth;
        // Check if iframe already embedded. (Handles for multiple embedded charts...)
        if (werk.querySelectorAll('iframe').length < 1) {
            var iframe = document.createElement("iframe");
            iframe.setAttribute("scrolling", "no");
            iframe.setAttribute("frameborder", "0");
            // double-wide
            if (size === 'double') {
                if (screen > dimensions.double.width) {
                    iframe.setAttribute("src", "{{chart_path}}"+id+".html");
                    iframe.setAttribute("height", dimensions.double.height);
                    iframe.setAttribute("width", "100%");
                } else {
                    iframe.setAttribute("src", "{{chart_path}}"+id+"_single.html");
                    iframe.setAttribute("height", dimensions.single.height);
                    iframe.setAttribute("width", dimensions.single.width);
                }
            // single-wide
            } else {
                iframe.setAttribute("src", "{{chart_path}}"+id+"_single.html");
                iframe.setAttribute("height", dimensions.single.height);
                iframe.setAttribute("width", dimensions.single.width);
            }
            werk.appendChild(iframe);
        }
    }
  })();

Of course, you can host the script separately from the embed template and simply reference it through a script tag.
