import random
import string

from chartwerk.celery import aws, github, slack
from chartwerk.models import Chart, Template
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify


@receiver(post_save, sender=Chart)
def post_chart(sender, instance, **kwargs):
    if kwargs.get('created'):
        char_set = string.ascii_uppercase + \
            string.ascii_lowercase + \
            string.digits
        uuid = ''.join(random.choice(char_set) for _ in range(8))
        while Chart.objects.filter(slug=uuid).exists():
            uuid = ''.join(random.choice(char_set) for _ in range(8))
        instance.slug = uuid
        instance.creator = instance.author
        instance.save()
        slack.delay(instance.pk)
    aws.delay(instance.pk)


@receiver(post_save, sender=Template)
def post_template(sender, instance, **kwargs):
    if kwargs.get('created', False):
        slug = slugify(instance.title)
        suffix = 1
        while Template.objects.filter(slug=slug).exists():
            slug = '%s-%d' % (slug, suffix)
            suffix += 1
        instance.slug = slug
        instance.creator = instance.author
        instance.save()
    github.delay(instance.pk)
