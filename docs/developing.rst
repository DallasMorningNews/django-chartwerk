==========
Developing
==========

staticapp
---------

Front-end assets are compiled from the :code:`staticapp` directory of django-chartwerk. This uses gulp, browserify and node-sass to compile/transpile assets to Django's standard :code:`static` directory.

To begin developing assets, move into the :code:`staticapp` directory and be sure to install dependencies using npm or yarn:

::

  $ npm install
  $ yarn

Then run the build process using gulp:

::

  $ gulp



Updating chartwerk-editor
---------------------------------

Chartwerk-editor includes a script to move compiled assets from the app into the :code:`static` directory of django-chartwerk. First, upgrade chartwerk-editor from the :code:`staticapp` directory.

::

  $ npm update chartwerk-editor

Then run the script from chartwerk-editor's bin directory.

::

  $ node node_modules/chartwerk-editor/bin/unbundle_django.js

.. warning::

  This will overwrite chartwerk-editor templates and static files in django-chartwerk, replacing any customizations you may have made with the latest from chartwerk-editor.


Planned featuers
----------------

Django-chartwerk includes some models which anticipate future features.

The :code:`TemplateProperty` and :code:`FinderQuestion` models will be used in a future release to create an interactive wizard for picking a chart type in django-chartwerk.
