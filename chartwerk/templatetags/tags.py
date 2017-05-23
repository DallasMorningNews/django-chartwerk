import json
import os

from chartwerk.models import Template
from django import template
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.staticfiles.templatetags.staticfiles import static

DOMAIN = settings.CHARTWERK_DOMAIN

register = template.Library()


@register.filter
def jsonify(value):
    return json.dumps(value)


@register.filter
def user_by_email(email):
    if email is None:
        return 'DEBUGGER'
    user = User.objects.filter(email=email).first()
    if user:
        if user.first_name != '' and user.last_name != '':
            return '{} {}'.format(
                user.first_name,
                user.last_name
            )
    else:
        return email


@register.filter
def get_icon(title):
    default = os.path.join(
        DOMAIN,
        static('chartwerk/img/chartwerk_100.png')[1:]
    )
    if title is None:
        return default
    template = Template.objects.filter(title=title).first()
    if template and template.icon:
        return Template.objects.filter(title=title).first().icon.url
    else:
        return default
