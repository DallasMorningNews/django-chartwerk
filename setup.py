# Imports from standard libraries.  # NOQA
import os

from setuptools import find_packages, setup

REPO_URL = 'https://github.com/DallasMorningNews/django-chartwerk/'

PYPI_VERSION = '0.5.1'

with open(os.path.join(os.path.dirname(__file__), 'README.rst')) as readme:
    README = readme.read()

os.chdir(os.path.normpath(os.path.join(os.path.abspath(__file__), os.pardir)))


setup(
    name='django-chartwerk',
    version=PYPI_VERSION,
    packages=find_packages(),
    include_package_data=True,
    license='AGPLv3',
    description=(
        'A Django application to manage, create and share Chartwerk charts.'
    ),
    long_description=README,
    url=REPO_URL,
    download_url='{repo_url}archive/{version}.tar.gz'.format(**{
        'repo_url': REPO_URL,
        'version': PYPI_VERSION,
    }),
    author='Jon McClure / The Dallas Morning News',
    author_email='newsapps@dallasnews.com',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Framework :: Django :: 1.9',
        'Framework :: Django :: 1.10',
        'Framework :: Django :: 1.11',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: GNU Affero General Public License v3',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
    ],
    install_requires=[
        'boto3>=1.4.0',
        'celery>=4.0.0',
        'Django>=1.9',
        'django-uuslug>=1.1.8',
        'djangorestframework>=2.4',
        'Pillow',
        'psycopg2>=2.5.4',
        'PyGithub>=1.29',
        'slacker>=0.9',
    ],
)
