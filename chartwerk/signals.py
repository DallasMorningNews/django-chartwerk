from chartwerk.celery import aws, github, slack
from chartwerk.models import Chart, Template
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=Chart)
def post_chart(sender, instance, **kwargs):
    if kwargs.get('created'):
        instance.creator = instance.author
        instance.save()
        slack.delay(instance.pk)
    aws.delay(instance.pk)


@receiver(post_save, sender=Template)
def post_template(sender, instance, **kwargs):
    if kwargs.get('created', False):
        instance.creator = instance.author
        instance.save()
    github.delay(instance.pk)
