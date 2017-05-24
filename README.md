# django-chartwerk


## Configuration options

Chartwerk allows you to set a number of configuration options. The preferred method of setting config is through environment variables, though most config options can also be set in your project settings using the same variable name. For those options that can be set in `settings.py`, environment variables still override your variables in your project settings.

#### `CHARTWERK_DOMAIN`

The domain of the app running Chartwerk. For example, your app may be hosted at `http://myapp.mydomain.com`. **Required.**


#### `CHARTWERK_EMBED_SCRIPT`

URL to your custom script for embedding Chartwerk charts in your CMS. **Required.**

#### `CHARTWERK_AUTH_DECORATOR`

String module path to a decorator that should be applied to Chartwerk views to authentication users. Defaults to `django.contrib.auth.decorators.login_required`, but can also be `django.contrib.admin.views.decorators.staff_member_required`, for example.


#### `CHARTWERK_OEMBED`

If your CMS is configured to use oEmbed, set this setting to `True` which will return oEmbed code to users in the editor. Default is `False`.

#### `CHARTWERK_DB`

If you aren't using PostgreSQL in your main project, you can separate the database for this app from your other apps. Add the CHARTWERK_DB environment variable, a la [DATABASE_URL](https://github.com/kennethreitz/dj-database-url). You can also add the database explicitly to the DATABASES dict in project settings as `chartwerk`.

#### `CHARTWERK_JQUERY`

URL to jQuery version you want to include in baked-out charts. Defaults to `https://code.jquery.com/jquery-3.2.1.slim.min.js`.


#### `AWS_ACCESS_KEY_ID`

AWS access key ID. See [Environment Variables config for Boto3](http://boto3.readthedocs.io/en/latest/guide/configuration.html#environment-variables). **Required as environment variable**


#### `AWS_SECRET_ACCESS_KEY`

AWS secret access key. See [Environment Variables config for Boto3](http://boto3.readthedocs.io/en/latest/guide/configuration.html#environment-variables). **Required as environment variable.**

#### `CHARTWERK_AWS_BUCKET`

AWS S3 bucket name to publish charts to. **Required.**

#### `CHARTWERK_AWS_PATH`

Path within your S3 bucket to append to object keys before publishing. Defaults to `charts`

#### `CHARTWERK_CACHE_HEADER`

Cache header to add to chart files when published to S3. Defaults to `max-age=300`.


#### `CHARTWERK_GITHUB_USER`

Chartwerk can commit your chart templates to a GitHub repository for safe keeping. To do so, add a GitHub username. Can only be set as an environment variable.

#### `CHARTWERK_GITHUB_PASSWORD`

GitHub password. Can only be set as an environment variable.

#### `CHARTWERK_GITHUB_REPO`

The name of the repo to save chart templates to. Defaults to `chartwerk_chart-templates`.

####  `CHARTWERK_GITHUB_ORG`

To keep templates in a repo under a GitHub organization, set this variable to the GitHub org name.


#### `CHARTWERK_SLACK_TOKEN`

Chartwerk can send notifications to a Slack channel whenever a new chart is created. Add a Slack API token here.

#### `CHARTWERK_SLACK_CHANNEL`

Name of the Slack channel to post notifications to. Defaults to `#chartwerk`.
