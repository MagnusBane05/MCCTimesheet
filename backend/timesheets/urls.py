from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'time-entries', views.TimeEntryViewSet, basename='time-entry')

urlpatterns = [
    path('', include(router.urls)),
]
