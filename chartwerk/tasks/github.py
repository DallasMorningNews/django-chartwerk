"""Celery task to commit templates to GitHub."""
from __future__ import absolute_import

import json
import logging

from celery import shared_task
from chartwerk.conf import settings as app_settings
from chartwerk.models import Template
from github import Github, GithubException, UnknownObjectException

logger = logging.getLogger(__name__)


def get_github_credentials():
    """Get the credentials kwargs we're going to pass to Github().

    Prefers a personal token over a username/password.
    """
    if app_settings.GITHUB_TOKEN:
        return dict(login_or_token=app_settings.GITHUB_TOKEN)
    else:
        return dict(
            login_or_token=app_settings.GITHUB_USER,
            password=app_settings.GITHUB_PASSWORD
        )


def get_repository():
    """Get the GitHub repo specified in settings or the default.

    If the repo doesn't exist, try to create it.
    """
    try:
        g = Github(**get_github_credentials())

        if app_settings.GITHUB_ORG:
            user = g.get_organization(app_settings.GITHUB_ORG)
        else:
            user = g.get_user()

        try:
            return user.get_repo(app_settings.GITHUB_REPO)
        except UnknownObjectException:
            logging.info("Creating repository {}".format(
                app_settings.GITHUB_REPO
            ))
            return user.create_repo(app_settings.GITHUB_REPO)
    except GithubException:
        logging.exception("Unable to configure Github connection.")


def commit_script(path, script):
    """Commit script string to GitHub repo."""
    repository = get_repository()

    try:
        sha = repository.get_contents(path).sha
        repository.update_file(
            path=path,
            message='Template update',
            content=script,
            sha=sha
        )
    except GithubException:
        repository.create_file(
            path=path,
            message='Template initial commit',
            content=script
        )
        logging.info("Initial commit of new file {}".format(path))


@shared_task
def commit_template(pk):
    """Commit template scripts to GitHub."""
    if not app_settings.GITHUB_REPO:
        return

    template = Template.objects.get(pk=pk)

    commit_script(
        '/{}/draw.js'.format(template.slug),
        template.data['scripts']['draw']
    )
    commit_script(
        '/{}/helper.js'.format(template.slug),
        template.data['scripts']['helper']
    )
    commit_script(
        '/{}/chart.html'.format(template.slug),
        template.data['scripts']['html']
    )
    commit_script(
        '/{}/styles.css'.format(template.slug),
        template.data['scripts']['styles']
    )
    commit_script(
        '/{}/template.json'.format(template.slug),
        json.dumps(template.data, sort_keys=True, indent=4)
    )
