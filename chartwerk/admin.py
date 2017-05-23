from chartwerk.models import Chart, FinderQuestion, Template, TemplateProperty
from django.contrib import admin


class ChartAdmin(admin.ModelAdmin):
    readonly_fields = (
        'author',
        'created',
        'updated',
    )
    list_display = (
        'slug',
        'title',
        'creator',
    )


class TemplateAdmin(admin.ModelAdmin):
    readonly_fields = (
        'author',
        'created',
        'updated',
        'description',
    )
    list_display = (
        'slug',
        'title',
        'creator',
    )


admin.site.register(Chart, ChartAdmin)
admin.site.register(Template, TemplateAdmin)
admin.site.register(TemplateProperty)
admin.site.register(FinderQuestion)
