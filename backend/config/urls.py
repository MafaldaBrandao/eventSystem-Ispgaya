from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static
from rest_framework.response import Response
from rest_framework.decorators import api_view


@api_view(['GET'])
def healthcheck(_request):
    return Response({'ok': True, 'service': 'infocultura-django-backend'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', healthcheck),
    path('api/', include('infocultura.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
