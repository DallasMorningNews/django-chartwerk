# Imports from standard libraries.  # NOQA
import os
from setuptools import find_packages
from setuptools import setup


REPO_URL = 'https://github.com/DallasMorningNews/django-chartwerk/'

PYPI_VERSION = '0.0.4'

with open(os.path.join(os.path.dirname(__file__), 'README.md')) as readme:
    README = readme.read()

os.chdir(os.path.normpath(os.path.join(os.path.abspath(__file__), os.pardir)))


setup(
    name='django-chartwerk',
    version=PYPI_VERSION,
    packages=find_packages(),
    include_package_data=True,
    license='ISC',
    description=' '.join([
        'A Django-based application to',
        'manage, create and share Chartwerk charts.'
    ]),
    long_description=README,
    url=REPO_URL,
    download_url='{repo_url}archive/{version}.tar.gz'.format(**{
        'repo_url': REPO_URL,
        'version': PYPI_VERSION,
    }),
    author='Jon McClure and The Dallas Morning News',
    author_email='jon.r.mcclure@gmail.com, newsapps@dallasnews.com',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Framework :: Django :: 1.11',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
    ],
    install_requires=[
        'boto3>=1.4.0',
        'celery>=4.0.0',
        'dj-database-url>=0.3.0',
        'Django>=1.9',
        'django-filter>=1.0.4',
        'django-uuslug>=1.1.8',
        'djangorestframework>=2.4.4',
        'Pillow>=4.1.1',
        'psycopg2>=2.6.1',
        'PyGithub>=1.29',
        'slacker>=0.9.25',
    ],
)
