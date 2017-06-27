from django.apps import AppConfig


class ChartwerkConfig(AppConfig):
    name = 'chartwerk'
    verbose_name = 'chartwerk'

    def ready(self):
        from chartwerk import signals  # noqa
