import json

from django import template
from django.contrib.auth.models import User


register = template.Library()


@register.filter
def jsonify(value):
    return json.dumps(value)
