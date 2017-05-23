"""Celery task to commit template tasks to github."""
import json
import logging
import os

from celery import shared_task
from github import Github

logger = logging.getLogger(__name__)

repository = False
if 'CHARTWERK_GITHUB_USER' in os.environ and \
        'CHARTWERK_GITHUB_PASSWORD' in os.environ:
    try:
        repo_name = os.environ.get(
            'CHARTWERK_GITHUB_REPO',
            'chartwerk-chart-templates'
        )
        g = Github(
            os.environ.get('CHARTWERK_GITHUB_USER'),
            os.environ.get('CHARTWERK_GITHUB_PASSWORD')
        )
        user = g.get_user()
        if 'CHARTWERK_GITHUB_ORG' in os.environ:
            user = g.get_organization(os.environ.get('CHARTWERK_GITHUB_ORG'))
        try:
            repository = user.get_repo(repo_name)
        except:
            repository = user.create_repo(repo_name)
            logging.info("Creating repository {}".format(repo_name))
    except:
        logging.exception("Unable to configure Github connection.")


def commit_script(path, script):
    """Commit script string to github repo."""
    try:
        try:
            sha = repository.get_contents(path).sha
            repository.update_file(
                path=path,
                message='Template update',
                content=script,
                sha=sha
            )
        except:
            repository.create_file(
                path=path,
                message='Template initial commit',
                content=script
            )
            logging.info("Initial commit of new file {}".format(path))
    except Exception:
        logging.exception("Unable to commit to github repo")


@shared_task
def commit_template(instance):
    """Commit template scripts to github."""
    if repository:
        commit_script(
            '/{}/draw.js'.format(instance.slug),
            instance.data['scripts']['draw']
        )
        commit_script(
            '/{}/helper.js'.format(instance.slug),
            instance.data['scripts']['helper']
        )
        commit_script(
            '/{}/chart.html'.format(instance.slug),
            instance.data['scripts']['html']
        )
        commit_script(
            '/{}/styles.css'.format(instance.slug),
            instance.data['scripts']['styles']
        )
        commit_script(
            '/{}/template.json'.format(instance.slug),
            json.dumps(instance.data)
        )
