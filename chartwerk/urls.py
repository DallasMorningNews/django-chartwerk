from chartwerk.views import (Browse, ChartDetail, ChartEmbedViewSet,
                             ChartViewSet, FinderQuestionViewSet, Home, MyWerk,
                             Start, TemplateDetail, TemplatePropertyViewSet,
                             TemplateViewSet, oEmbed)
from django.conf.urls import include, url
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'charts', ChartViewSet)
router.register(r'templates', TemplateViewSet)
router.register(r'embeds', ChartEmbedViewSet)
router.register(r'finder-question', FinderQuestionViewSet)
router.register(r'template-property', TemplatePropertyViewSet)


urlpatterns = [
    url(r'^$', Home.as_view(), name='chartwerk_home'),
    url(r'^start/$', Start.as_view(), name='chartwerk_start'),
    url(r'^browse/$', Browse.as_view(), name='chartwerk_browse'),
    url(r'^myWerk/$', MyWerk.as_view(), name='chartwerk_mywerk'),
    url(r'^chart/(?P<slug>[-\w]+)/$', ChartDetail.as_view(),
        name='chartwerk_chart'),
    url(r'^template/(?P<slug>[-\w]+)/$', TemplateDetail.as_view(),
        name='chartwerk_template'),
    url(r'^api/', include(router.urls)),
    url(r'^api/oembed/$', oEmbed),
]
