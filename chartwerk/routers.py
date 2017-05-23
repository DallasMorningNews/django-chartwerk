from django.utils import six


class CoreRouterOptions(object):
    def __init__(self, options=None):
        self.app_label = getattr(options, 'app_label', None)
        self.db_label = getattr(options, 'db_label', self.app_label)


class CoreRouterMetaClass(type):
    def __new__(cls, name, base, attrs):
        new_class = super(
            CoreRouterMetaClass, cls).__new__(cls, name, base, attrs)

        try:
            CoreRouter  # We're defining some extension of BaseCoreRouter
        except NameError:
            return new_class  # We're defining a BaseCoreRouter

        opts = new_class._meta = CoreRouterOptions(
            getattr(new_class, 'Meta', None))

        if opts.app_label is None:
            raise ValueError('CoreRouter requires app_label to be set on its \
Meta class.')

        return new_class


class BaseCoreRouter(object):
    def db_for_read(self, model, **hints):
        if model._meta.app_label == self._meta.app_label:
            return self._meta.db_label
        else:
            return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == self._meta.app_label:
            return self._meta.db_label
        else:
            return None

    def allow_relation(self, obj1, obj2, **hints):
        if obj1._meta.app_label == self._meta.app_label or \
                obj2._meta.app_label == self._meta.app_label:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == self._meta.db_label:
            return app_label == self._meta.app_label
        elif app_label == self._meta.app_label:
            return False
        return None


class CoreRouter(six.with_metaclass(CoreRouterMetaClass, BaseCoreRouter)):
    pass


class ChartwerkRouter(CoreRouter):
    class Meta:
        app_label = 'chartwerk'
        db_label = 'chartwerk'
