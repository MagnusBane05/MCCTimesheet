from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'material-entries', views.MaterialEntryViewSet, basename='material-entry')
router.register(r'material-types', views.MaterialTypeViewSet, basename='material-type')
router.register(r'material-type-categories', views.MaterialTypeCategoryViewSet, basename='material-type-category')

urlpatterns = [
    path('', include(router.urls))
]
