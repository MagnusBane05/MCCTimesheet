"""
Top-level `/api/` router. Individual apps get their own included urls.py as
each REST resource is implemented (see integration phases B-F); this file
just aggregates them behind the shared `/api/` prefix.
"""
from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok'})


urlpatterns = [
    path('health/', health, name='api-health'),
    path('auth/', include('accounts.urls')),
]
