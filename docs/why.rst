==============
Why Chartwerk?
==============

Like many other chart builders, Chartwerk provides an interface for non-coders to easily create interactive and static charts. However, you may find, like we did, that most chart makers are set-and-forget systems that aren't well designed to grow with the needs of your team.

Chartwerk was designed to be a more collaborative tool between coders and non-coders. It lets developers easily build and modify charts on the fly directly alongside users by exposing a robust internal API that translates tabular data into discrete dataviz properties.

Because chart templates in Chartwerk are arbitrary functions written to consume Chartwerk's API, developers have complete control of the logic used to draw charts and the freedom to use any third-party libraries they like.

In the newsroom, Chartwerk helps us develop dataviz quickly in response to the needs of beat reporters and scale our development time multiplied by every chart our reporters build from the templates we create.

That said, Chartwerk may not be the best choice among all other chart builders for your team if you don't have at least one developer to help build up your chart template set.

What's in it?
-------------

Chartwerk actually consists of two applications:

1. A backend app that maintains RESTFUL endpoints for charts and chart templates, serves navigational pages for users to select the type of chart they'd like to build and handles logic for user accounts and for "baking" charts to S3 or another flat storage service.

2. A front-end app to create and manipulate charts and chart templates before saving them to the backend.

Django-chartwerk represents the former. You can find the latter at `chartwerk-editor <https://github.com/DallasMorningNews/chartwerk-editor>`_.

.. note::

  Chartwerk-editor is **the heart of Chartwerk**. It is the app users interact with to create charts and chart templates.

  Django-chartwerk represents a deployment package for the editor. (It actually *includes* the editor within itself.)

  Most of the information you'll need to understand how to use Chartwerk, to interact with Chartwerk's internal API, to build chart templates as well as the logic behind Chartwerk's workflow is in chartwerk-editor's documentation. Read it `here <https://the-dallas-morning-news.gitbooks.io/chartwerk-editor/content/docs/introduction.html>`_.

  Use these docs to deploy Chartwerk within a pluggable Django app.
