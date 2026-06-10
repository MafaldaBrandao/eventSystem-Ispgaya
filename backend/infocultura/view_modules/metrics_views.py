from __future__ import annotations

from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..api.serializers_metrics import MetricViewCreateSerializer
from ..service_modules.metrics import record_metric_view


class TrackMetricView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = MetricViewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = dict(serializer.validated_data)
        payload['viewed_at'] = timezone.now()

        record_metric_view(payload=payload)
        return Response(status=204)
