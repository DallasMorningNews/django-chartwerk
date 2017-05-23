import json
import os
from urllib.parse import urlparse

from chartwerk.models import Chart, FinderQuestion, Template, TemplateProperty
from chartwerk.serializers import (ChartEmbedSerializer, ChartSerializer,
                                   FinderQuestionSerializer,
                                   TemplatePropertySerializer,
                                   TemplateSerializer)
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.urls import resolve
from django.utils.decorators import method_decorator
from django.views.generic import DetailView, ListView, TemplateView
from rest_framework import viewsets


def secure(view):
    return (
        view if settings.DEBUG
        else method_decorator(login_required, name='dispatch')(view)
    )


def build_context(context, request, chart_id='', template_id=''):
    """Build context object to pass to the chartwerk editor."""
    def urlize(url):
        return 'http://{}{}'.format(request.get_host(), url)
    context['user'] = request.user.username or 'Anonymous'
    context['chart_id'] = chart_id
    context['template_id'] = template_id
    context['chart_api'] = urlize('/api/charts/')
    context['template_api'] = urlize('/api/templates/')
    context['template_tags_api'] = urlize('/api/template-property/')
    context['oembed'] = urlize('/api/oembed/') \
        if os.environ.get('CHARTWERK_OEMBED', False) else ''
    context['embed_src'] = os.environ.get('CHARTWERK_EMBED_SCRIPT', '')
    return context


@secure
class Home(TemplateView):
    template_name = 'chartwerk/home.html'


@secure
class Browse(ListView):
    context_object_name = 'charts'
    template_name = 'chartwerk/browse.html'
    queryset = Chart.objects.all().order_by('-pk')


@secure
class Start(ListView):
    context_object_name = 'templates'
    template_name = 'chartwerk/start.html'
    queryset = Template.objects.all().order_by('-pk')


@secure
class MyWerk(ListView):
    context_object_name = 'charts'
    template_name = 'chartwerk/myWerk.html'
    queryset = Chart.objects.all().order_by('-pk')

    def get_queryset(self):
        user = self.request.user.username or 'Anonymous'
        return Chart.objects.filter(creator=user)

    def get_context_data(self, **kwargs):
        context = super(MyWerk, self).get_context_data(**kwargs)
        context['user'] = self.request.user or 'Anonymous'
        return context


@secure
class ChartDetail(DetailView):
    model = Chart
    template_name = 'chartwerk/django-chartwerk-editor.html'

    def get_context_data(self, **kwargs):
        context = super(ChartDetail, self).get_context_data(**kwargs)

        return build_context(
            context,
            self.request,
            chart_id=self.object.slug
        )


@secure
class TemplateDetail(DetailView):
    model = Template
    template_name = 'chartwerk/django-chartwerk-editor.html'

    def get_context_data(self, **kwargs):
        context = super(TemplateDetail, self).get_context_data(**kwargs)

        return build_context(
            context,
            self.request,
            template_id=self.object.slug
        )


class JSONResponseMixin(object):
    def render_to_json_response(self, context, **response_kwargs):
        return JsonResponse(self.get_data(context), **response_kwargs)

    def get_data(self, context):
        return context


class ChartViewSet(viewsets.ModelViewSet):
    queryset = Chart.objects.all()
    serializer_class = ChartSerializer
    lookup_field = 'slug'


class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    lookup_field = 'slug'


class TemplatePropertyViewSet(viewsets.ModelViewSet):
    pagination_class = None
    queryset = TemplateProperty.objects.all()
    serializer_class = TemplatePropertySerializer


class FinderQuestionViewSet(viewsets.ModelViewSet):
    queryset = FinderQuestion.objects.all()
    serializer_class = FinderQuestionSerializer


class ChartEmbedViewSet(viewsets.ModelViewSet):
    queryset = Chart.objects.all()
    serializer_class = ChartEmbedSerializer
    lookup_field = 'slug'


def oEmbed(request):
    """Return an oEmbed json response."""
    def simple_string(split_string):
        """Return a string stripped of extra whitespace."""
        return ' '.join(split_string.split())

    url = request.GET.get('url')
    size = request.GET.get('size', 'double')
    path = urlparse(url).path
    slug = resolve(path).kwargs['slug']
    chart = get_object_or_404(Chart, slug=slug)
    oembed = {
        "version": "1.0",
        "url": url,
        "title": chart.title,
        "provider_url": os.environ.get("CHARTWERK_DOMAIN"),
        "provider_name": "Chartwerk",
        "author_name": chart.creator,
        "chart_id": chart.slug,
        "type": "rich",
        "size": size,
        "width": chart.embed_data['double']['width'] or "",
        "height": chart.embed_data['double']['height'] or "",
        "single_width": chart.embed_data['single']['width'] or "",
        "single_height": chart.embed_data['single']['height'] or "",
        "html": simple_string("""<div
            class="chartwerk"
            data-id="{}"
            data-embed="{}"
            data-size="{}"
        ></div>
        <script src='{}'></script>
        """).format(
            chart.slug,
            json.dumps(chart.embed_data).replace('"', '&quot;'),
            size,
            os.environ.get('CHARTWERK_EMBED_SCRIPT'),
        )
    }
    return JsonResponse(oembed)
