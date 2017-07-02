=============
What's in it?
=============

Chartwerk actually consists of two applications:

1. A backend app that maintains RESTFUL endpoints for charts and chart templates, serves navigational pages for users to select the type of chart they'd like to build and handles logic for user accounts and for "baking" charts to S3 or another flat storage service.

2. A front-end app to create and manipulate charts and chart templates before saving them to the backend.

Django-chartwerk represents the former. You can find the latter at `chartwerk-editor <https://github.com/DallasMorningNews/chartwerk-editor>`_ (`demo <http://dallasmorningnews.github.io/chartwerk-editor/>`_).

.. note::

  Chartwerk-editor is **the heart of Chartwerk**. It is the app users interact with to create charts and chart templates.

  Django-chartwerk represents a deployment package for the editor. (It actually *includes* the latest version of the editor within itself.)

  Most of the information you'll need to understand how to use Chartwerk, to interact with Chartwerk's internal API, to build chart templates as well as the logic behind Chartwerk's workflow is in chartwerk-editor's documentation. Read the docs `here <https://the-dallas-morning-news.gitbooks.io/chartwerk-editor/content/docs/introduction.html>`_.

  Use these docs to deploy Chartwerk within a pluggable Django app.

Free chart templates
--------------------

Django-chartwerk includes a number of chart templates to get you started using Chartwerk. They are loaded automatically through fixtures when you first migrate the application. You get:

- Bar chart
- Column chart
- Multi-line chart
- Unit chart
- US state choropleth map
- Data table

You'll see many of the concepts described in the `chartwerk-editor docs <https://the-dallas-morning-news.gitbooks.io/chartwerk-editor/content/docs/template-basics.html>`_ in practice in these templates. Use them as a starting point to build your own or customize them to suit your needs.
