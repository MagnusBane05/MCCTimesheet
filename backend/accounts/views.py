from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes  # type: ignore[attr-defined]
from rest_framework.permissions import AllowAny, IsAuthenticated  # type: ignore[attr-defined]
from rest_framework.response import Response  # type: ignore[attr-defined]
from rest_framework.status import HTTP_204_NO_CONTENT, HTTP_400_BAD_REQUEST  # type: ignore[attr-defined]

from .serializers import UserSerializer


def _auth_error(detail: str) -> Response:  # type: ignore[no-untyped-def]
    # Matches core.exceptions.api_exception_handler's {detail, errors} shape
    # directly, rather than relying on DRF's ValidationError (which wraps a
    # plain string detail into a bare list, not {'detail': ...}).
    return Response({'detail': detail, 'errors': None}, status=HTTP_400_BAD_REQUEST)


@api_view(['GET'])  # type: ignore[misc]
@permission_classes([AllowAny])  # type: ignore[misc]
@ensure_csrf_cookie
def csrf(request):  # type: ignore[no-untyped-def]
    """
    An AJAX-only SPA never triggers Django's normal CSRF-cookie-setting
    paths, so the frontend must hit this once (on load, before login) to
    get the `csrftoken` cookie apiClient.ts then echoes back as X-CSRFToken.
    """
    return Response({'detail': 'CSRF cookie set.'})


@api_view(['POST'])  # type: ignore[misc]
@permission_classes([AllowAny])  # type: ignore[misc]
def login_view(request):  # type: ignore[no-untyped-def]
    username = request.data.get('username', '')  # type: ignore[attr-defined]
    password = request.data.get('password', '')  # type: ignore[attr-defined]
    if not username or not password:
        return _auth_error('Username and password are required.')

    # authenticate() already refuses inactive users (ModelBackend checks is_active).
    user = authenticate(request, username=username, password=password)
    if user is None:
        return _auth_error('Incorrect username or password.')

    django_login(request, user)
    return Response(UserSerializer(user).data)


# DRF's APIView.as_view() marks every view csrf_exempt by default (relying on
# SessionAuthentication to re-enable CSRF, which only kicks in once a session
# already exists). Login is exactly the anonymous-request case that misses,
# so un-exempt it explicitly and let the already-active CsrfViewMiddleware
# enforce it normally ("login CSRF" is a real, distinct attack from the usual
# authenticated-session CSRF threat model).
login_view.csrf_exempt = False  # type: ignore[attr-defined]


@api_view(['POST'])  # type: ignore[misc]
@permission_classes([AllowAny])  # type: ignore[misc]
def logout_view(request):  # type: ignore[no-untyped-def]
    django_logout(request)
    return Response(status=HTTP_204_NO_CONTENT)


@api_view(['GET'])  # type: ignore[misc]
@permission_classes([IsAuthenticated])  # type: ignore[misc]
def me_view(request):  # type: ignore[no-untyped-def]
    return Response(UserSerializer(request.user).data)  # type: ignore[attr-defined]

