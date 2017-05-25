import os
import random
import string
from datetime import datetime

from django.contrib.postgres.fields import JSONField
from django.db import models
from django.utils.text import slugify
from uuslug import uuslug


class Chartwerk(models.Model):
    slug = models.SlugField(
        max_length=250,
        unique=True,
        blank=True,
        null=True
    )
    title = models.CharField(max_length=240)
    data = JSONField()
    created = models.DateTimeField(auto_now_add=True, editable=False)
    updated = models.DateTimeField(auto_now=True, editable=False)
    # User who last committed chart
    author = models.CharField(
        max_length=250,
        blank=True,
        null=True,
    )
    # User who first committed chart
    creator = models.CharField(
        max_length=250,
        blank=True,
        null=True,
    )

    class Meta:
        abstract = True


class Chart(Chartwerk):
    embed_data = JSONField(blank=True, null=True)

    def save(self, *args, **kwargs):
        char_set = string.ascii_uppercase + \
            string.ascii_lowercase + \
            string.digits
        uuid = ''.join(random.choice(char_set) for _ in range(8))
        self.slug = uuslug(
            uuid,
            instance=self,
            max_length=8,
            separator=''
        )
        super(Chart, self).save(*args, **kwargs)

    def __str__(self): # noqa
        return "{} - {} by {}".format(self.slug, self.title, self.author)


class Template(Chartwerk):

    def icon_upload_path(instance, filename):
        fileName, fileExtension = os.path.splitext(filename)
        return os.path.join(
            'templates/icons',
            '{}-{}{}'.format(
                slugify(instance.title),
                datetime.now().strftime('%Y%m%d'),
                fileExtension
            )
        )

    def chart_count(self):
        return Chart.objects.filter(data__template__title=self.title).count()

    icon = models.ImageField(upload_to=icon_upload_path, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        self.slug = uuslug(self.title, instance=self)
        super(Template, self).save(*args, **kwargs)

    def __str__(self): # noqa
        return self.slug


class TemplateProperty(models.Model):
    slug = models.CharField(max_length=250, unique=True)
    property = models.CharField(max_length=250, unique=True)
    template = models.ManyToManyField(
        Template,
        related_name="template_properties"
    )
    finder = models.ManyToManyField(
        'FinderQuestion',
        blank=True,
        related_name="template_properties"
    )

    def save(self, *args, **kwargs):
        self.slug = uuslug(self.property, instance=self)
        super(TemplateProperty, self).save(*args, **kwargs)

    def __str__(self): # noqa
        return self.property

    class Meta:
        verbose_name_plural = "Template properties"


class FinderQuestion(models.Model):
    question = models.CharField(max_length=250)
    order = models.PositiveSmallIntegerField(unique=True)

    def __str__(self): # noqa
        return self.question
