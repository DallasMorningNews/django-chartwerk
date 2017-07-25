import json
import os
import random
import string
from datetime import datetime

from chartwerk.conf import settings as app_settings
from django import template
from django.contrib.postgres.fields import JSONField
from django.db import models
from django.urls import reverse
from django.utils.text import slugify
from uuslug import uuslug


def template_icon_upload_path(instance, filename):
    fileName, fileExtension = os.path.splitext(filename)
    return os.path.join(
        'templates/icons',
        '{}-{}{}'.format(
            slugify(instance.title),
            datetime.now().strftime('%Y%m%d'),
            fileExtension
        )
    )


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
        if not self.slug:
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

    def __str__(self):
        return "{} - {} by {}".format(self.slug, self.title, self.author)

    def get_absolute_url(self):
        return reverse('chartwerk_chart', kwargs=dict(slug=self.slug))

    def get_embed_code(self, size='double'):
        """Return the embed code for the chart."""
        def simple_string(split_string):
            """Return a string stripped of extra whitespace."""
            return ' '.join(split_string.split())

        template_object = template.Template(app_settings.EMBED_TEMPLATE)
        template_context_object = app_settings.EMBED_TEMPLATE_CONTEXT(self)
        template_context_object.update({
            'size': size,
            'id': self.slug,
            'dimensions': json.dumps(self.embed_data).replace('"', '&quot;'),
        })
        return simple_string(
            template_object.render(template.Context(
                template_context_object
            ))
        )

    def oembed(self, size='double'):
        return {
            "version": "1.0",
            "url": os.path.join(
                app_settings.DOMAIN,
                self.get_absolute_url()[1:],
            ),
            "title": self.title,
            "provider_url": os.path.join(
                app_settings.DOMAIN,
                reverse('chartwerk_home')[1:]
            ),
            "provider_name": "Chartwerk",
            "author_name": self.creator,
            "chart_id": self.slug,
            "type": "rich",
            "size": size,
            "width": self.embed_data['double']['width'] or "",
            "height": self.embed_data['double']['height'] or "",
            "single_width": self.embed_data['single']['width'] or "",
            "single_height": self.embed_data['single']['height'] or "",
            "html": self.get_embed_code(size),
        }


class Template(Chartwerk):
    def chart_count(self):
        return Chart.objects.filter(data__template__title=self.title).count()

    icon = models.ImageField(
        upload_to=template_icon_upload_path, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        self.slug = uuslug(self.title, instance=self)
        super(Template, self).save(*args, **kwargs)

    def __str__(self):
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

    def __str__(self):
        return self.property

    class Meta:
        verbose_name_plural = "Template properties"


class FinderQuestion(models.Model):
    question = models.CharField(max_length=250)
    order = models.PositiveSmallIntegerField(unique=True)

    def __str__(self):
        return self.question
