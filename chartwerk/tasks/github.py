"""Celery task to commit templates to GitHub."""
from __future__ import absolute_import
import json
import logging

from celery import shared_task
from django.conf import settings
from github import Github, GithubException, UnknownObjectException

from chartwerk.models import Template


logger = logging.getLogger(__name__)


def get_github_credentials():
    """Get the credentials kwargs we're going to pass to Github().
    
    Prefers a personal token over a username/password.
    """
    try:
        return dict(login_or_token=settings.CHARTWERK_GITHUB_TOKEN)
    except AttributeError:
        try:
            return dict(
                login_or_token=settings.CHARTWERK_GITHUB_USER,
                password=settings.CHARTWERK_GITHUB_PASSWORD
            )
        except AttributeError:
            pass


def get_repository():
    """Get the GitHub repo specified in settings or the default.
    
    If the repo doesn't exist, try to create it.
    """
    try:
        repo_name = getattr(
            settings,
            'CHARTWERK_GITHUB_REPO',
            'chartwerk_chart-templates'
        )
    except AttributeError:
        return None

    try:
        g = Github(**get_github_credentials())

        if hasattr(settings, 'CHARTWERK_GITHUB_ORG'):
            user = g.get_organization(settings.CHARTWERK_GITHUB_ORG)
        else:
            user = g.get_user()

        try:
            return user.get_repo(repo_name)
        except UnknownObjectException:
            logging.info("Creating repository {}".format(repo_name))
            return user.create_repo(repo_name)
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
    repository = get_repository()

    if repository is None:
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
