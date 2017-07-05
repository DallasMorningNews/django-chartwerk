===========
Configuring
===========

Chartwerk allows you to set a number of configuration options. Some add additional features to the app.



App settings
------------

.. code-block:: python
  :caption: Default settings

  CHARTWERK_AUTH_DECORATOR = "django.contrib.auth.decorators.login_required"
  CHARTWERK_API_PERMISSION_CLASS = "rest_framework.permissions.IsAuthenticatedOrReadOnly"
  CHARTWERK_COLOR_SCHEMES = {} # Uses default color scheme in chartwerk-editor

:code:`CHARTWERK_AUTH_DECORATOR`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

String module path to a decorator that should be applied to Chartwerk views to authenticate users.

.. warning::

  This decorator is not applied to views if DEBUG is :code:`True` in your settings.

:code:`CHARTWERK_API_PERMISSION_CLASS`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

String module path to a valid Django REST permission class that should be applied to Django REST Framework's browsable API viewsets.

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
  CHARTWERK_CACHE_HEADER = "max-age=300"
  CHARTWERK_DOMAIN = None  # Required
  CHARTWERK_EMBED_SCRIPT = None  # Required
  CHARTWERK_JQUERY = "https://code.jquery.com/jquery-3.2.1.slim.min.js"

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

:code:`CHARTWERK_EMBED_SCRIPT` **(Required)**
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Absolute URL to a custom script for embedding Chartwerk charts in your CMS.

This script is used on the parent page – i.e., the page in your CMS you're embedding a chart into – to select the appropriately sized child page to embed.

While we require you to specify your own embed script, we also include one that will handle most implementations. You can reference it from the static files directory of this app at :code:`chartwerk/js/embed_v1.js`.

.. note::

  While you can reference this script from the app, we recommend that you host the file in your AWS bucket. Every embed will call this script, meaning your app would need to handle the traffic of all your charts.


For reference, this is the code:


.. code-block:: javascript

  (function(){
      var werks = document.querySelectorAll(".chartwerk");
      for (var i = 0; i < werks.length; i++) {
          var werk = werks[i],
              id = werk.dataset.id,
              dimensions = JSON.parse(werk.dataset.embed),
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
                      iframe.setAttribute("src", "http://yoursite.com/chartwerk/"+id+".html");
                      iframe.setAttribute("height", dimensions.double.height);
                      iframe.setAttribute("width", "100%");
                  } else {
                      iframe.setAttribute("src", "http://yoursite.com/chartwerk/"+id+"_single.html");
                      iframe.setAttribute("height", dimensions.single.height);
                      iframe.setAttribute("width", dimensions.single.width);
                  }
              // single-wide
              } else {
                  iframe.setAttribute("src", "http://yoursite.com/chartwerk/"+id+"_single.html");
                  iframe.setAttribute("height", dimensions.single.height);
                  iframe.setAttribute("width", dimensions.single.width);
              }
              werk.appendChild(iframe);
          }
      }
  })();

:code:`CHARTWERK_AWS_PATH`
^^^^^^^^^^^^^^^^^^^^^^^^^^

Path within your S3 bucket to append to your charts when publishing. For example, setting to :code:`chartwerk/charts` would result in charts published to :code:`chartwerk/charts/<chart_id>.html` in your bucket.

:code:`CHARTWERK_CACHE_HEADER`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Cache header to add to chart files when published to S3.

:code:`CHARTWERK_JQUERY`
^^^^^^^^^^^^^^^^^^^^^^^^

Baked charts require jQuery in the `client bundle script <https://the-dallas-morning-news.gitbooks.io/chartwerk-editor/content/docs/embedding.html#child-embed-script>`_. By default, this is set to jQuery's `slim version <https://code.jquery.com/>`_, but you can set this to whatever version you want.




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
