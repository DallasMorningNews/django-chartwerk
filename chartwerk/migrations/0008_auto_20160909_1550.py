# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2016-09-09 20:50
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chartwerk', '0007_template_description'),
    ]

    operations = [
        migrations.RenameField(
            model_name='chart',
            old_name='created_by',
            new_name='author',
        ),
        migrations.RenameField(
            model_name='template',
            old_name='created_by',
            new_name='author',
        ),
    ]
