"""
Top-level `/api/` router. Individual apps will get their own included
urls.py as each REST resource is implemented (see integration phases
B-F); this file just aggregates them behind the shared `/api/` prefix.
"""
from django.urls import path
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf(request):
    """
    An AJAX-only SPA never triggers Django's normal CSRF-cookie-setting
    paths (e.g. rendering a template with {% csrf_token %}), so the frontend
    must hit this once (e.g. on load, before login) to get the `csrftoken`
    cookie that apiClient.ts then echoes back as X-CSRFToken.
    """
    return Response({'detail': 'CSRF cookie set.'})


urlpatterns = [
    path('health/', health, name='api-health'),
    path('auth/csrf/', csrf, name='api-auth-csrf'),
]
