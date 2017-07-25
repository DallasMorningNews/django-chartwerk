from chartwerk.models import Chart, FinderQuestion, Template, TemplateProperty
from rest_framework import serializers


class ChartSerializer(serializers.HyperlinkedModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name='chart-detail',
        lookup_field='slug'
    )

    class Meta:
        model = Chart
        fields = '__all__'


class ReverseTemplatePropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateProperty
        fields = ('slug',)
        extra_kwargs = {
            'id': {'read_only': False},
            'slug': {'validators': []},
        }


class TemplateSerializer(serializers.HyperlinkedModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name='template-detail',
        lookup_field='slug'
    )
    template_properties = ReverseTemplatePropertySerializer(many=True)

    class Meta:
        model = Template
        fields = '__all__'

    def create(self, validated_data):
        properties_data = validated_data.pop('template_properties')
        template = Template.objects.create(**validated_data)
        for property_ in properties_data:
            try:
                obj = TemplateProperty.objects.get(slug=property_.get('slug'))
            except TemplateProperty.DoesNotExist:
                continue

            obj.template.add(template)
        return template

    def update(self, instance, validated_data):
        properties_data = validated_data.pop('template_properties')
        # UPDATE instance
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        # SYNC template tags
        tags_list = []
        # ADD new template tags
        for property_ in properties_data:
            slug = property_.get('slug')

            try:
                obj = TemplateProperty.objects.get(slug=slug)
            except TemplateProperty.DoesNotExist:
                continue

            obj.template.add(instance)
            tags_list.append(slug)
        # REMOVE any template tags not in the new set
        drop_props = instance.template_properties.exclude(slug__in=tags_list)
        for prop in drop_props:
            prop.template.remove(instance)
        return instance


class FinderQuestionSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = FinderQuestion
        fields = '__all__'


class TemplatePropertySerializer(serializers.HyperlinkedModelSerializer):
    finder = serializers.HyperlinkedRelatedField(
        many=True,
        read_only=True,
        view_name='finderquestion-detail'
    )
    template = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='slug'
    )

    class Meta:
        model = TemplateProperty
        fields = '__all__'


class ReverseTemplatePropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Chart
        fields = ('slug',)
        extra_kwargs = {
            'id': {'read_only': False},
            'slug': {'validators': []},
        }


class ChartEmbedSerializer(serializers.ModelSerializer):
    embed_code = serializers.SerializerMethodField()

    class Meta:
        model = Chart
        fields = ('slug', 'embed_code')

    def get_embed_code(self, obj):
        return obj.get_embed_code(self.context.get('size'))
