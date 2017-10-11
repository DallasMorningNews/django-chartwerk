import json

from django import template
from django.contrib.auth.models import User


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
