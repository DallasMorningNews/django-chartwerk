from django.core.management import call_command
from django.db import migrations

FIXTURE = 'free_templates'


def load_fixture(apps, schema_editor):
    call_command('loaddata', FIXTURE, app_label='chartwerk')


def unload_fixture(apps, schema_editor):
    Template = apps.get_model('chartwerk', 'Template')
    Template.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [('chartwerk', '0001_initial')]

    operations = [
        migrations.RunPython(load_fixture, reverse_code=unload_fixture),
    ]
