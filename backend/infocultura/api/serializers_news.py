from django.utils import timezone
from rest_framework import serializers

from ..models import Club, News, NewsStatus
from ..services import list_editorial_history, notify_news_workflow_status, record_editorial_action
from .serializers_shared import ClubScopedWriteMixin
from .serializers_workflow import (
    NEWS_WORKFLOW_STATUS_ORDER,
    get_role_allowed_workflow_statuses,
    normalize_workflow_status,
)


class NewsStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsStatus
        fields = ['id', 'name', 'description']


class NewsSerializer(serializers.ModelSerializer):
    news_status_id = serializers.IntegerField(read_only=True)
    news_status_name = serializers.CharField(source='news_status.name', read_only=True)
    club_id = serializers.IntegerField(read_only=True, allow_null=True)
    club_name = serializers.CharField(source='club.name', read_only=True, allow_null=True)

    class Meta:
        model = News
        fields = [
            'id',
            'title',
            'summary',
            'image',
            'content',
            'is_active',
            'published_at',
            'created_at',
            'updated_at',
            'news_status_id',
            'news_status_name',
            'club_id',
            'club_name',
        ]


class EditorialHistorySerializer(serializers.Serializer):
    content_type = serializers.CharField()
    object_id = serializers.IntegerField()
    from_status = serializers.CharField(allow_null=True)
    to_status = serializers.CharField()
    actor_user_id = serializers.IntegerField(allow_null=True)
    actor_name = serializers.CharField()
    created_at = serializers.DateTimeField(allow_null=True)


class AdminNewsReadSerializer(NewsSerializer):
    editorial_history = serializers.SerializerMethodField()

    class Meta(NewsSerializer.Meta):
        fields = NewsSerializer.Meta.fields + ['editorial_history']

    def get_editorial_history(self, obj):
        history = list_editorial_history(content_type='news', object_id=obj.id)
        return EditorialHistorySerializer(history, many=True).data


class AdminNewsWriteSerializer(ClubScopedWriteMixin, serializers.ModelSerializer):
    news_status = serializers.SlugRelatedField(
        slug_field='name',
        queryset=NewsStatus.objects.all(),
    )
    club_id = serializers.PrimaryKeyRelatedField(
        source='club',
        queryset=Club.objects.all(),
        required=False,
    )

    class Meta:
        model = News
        fields = [
            'id',
            'title',
            'summary',
            'image',
            'content',
            'published_at',
            'news_status',
            'club_id',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        request = self.context['request']
        user = request.user
        role_name = getattr(getattr(user, 'role', None), 'name', None)
        self.resolve_club_scope(attrs)

        news_status = attrs.get('news_status') or getattr(self.instance, 'news_status', None)
        next_status = normalize_workflow_status(getattr(news_status, 'name', None))
        current_status = normalize_workflow_status(
            getattr(getattr(self.instance, 'news_status', None), 'name', None)
        )
        allowed_statuses = get_role_allowed_workflow_statuses(
            role_name=role_name,
            base_statuses=NEWS_WORKFLOW_STATUS_ORDER,
            current_status=current_status,
        )
        published_at = attrs.get('published_at')
        is_future_publication = (
            next_status == 'published'
            and published_at is not None
            and published_at > timezone.now()
        )

        if next_status and next_status not in allowed_statuses and not is_future_publication:
            raise serializers.ValidationError(
                {'news_status': 'Nao tens permissao para colocar esta noticia nesse estado.'}
            )

        current_published_at = getattr(self.instance, 'published_at', None) if self.instance else None
        if news_status and next_status == 'published' and not attrs.get('published_at'):
            attrs['published_at'] = current_published_at or timezone.now()
        elif next_status in {'draft', 'review'}:
            attrs['published_at'] = None

        return attrs

    def create(self, validated_data):
        now = timezone.now()
        validated_data.setdefault('created_at', now)
        validated_data['updated_at'] = now
        request_user = self.context['request'].user
        news = News.objects.create(**validated_data)
        next_status = getattr(news.news_status, 'name', None) or 'draft'
        record_editorial_action(
            content_type='news',
            object_id=news.id,
            from_status=None,
            to_status=next_status,
            actor_user=request_user,
            club_id=news.club_id,
        )
        notify_news_workflow_status(news=news, previous_status=None, next_status=next_status)
        return news

    def update(self, instance, validated_data):
        request_user = self.context['request'].user
        previous_status = getattr(instance.news_status, 'name', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.updated_at = timezone.now()
        instance.save()
        next_status = getattr(instance.news_status, 'name', None)
        if normalize_workflow_status(previous_status) != normalize_workflow_status(next_status):
            record_editorial_action(
                content_type='news',
                object_id=instance.id,
                from_status=previous_status,
                to_status=next_status or 'draft',
                actor_user=request_user,
                club_id=instance.club_id,
            )
            notify_news_workflow_status(
                news=instance,
                previous_status=previous_status,
                next_status=next_status,
            )
        return instance

    def to_representation(self, instance):
        return NewsSerializer(instance).data
