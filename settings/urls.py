from django.urls import path
from .views import change_password, delete_account, EmailPreferenceView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'email-preference', EmailPreferenceView, basename='email-preference')

urlpatterns = [
    path('change-password/', change_password, name='change_password'),
    path('delete-account/', delete_account, name='delete_account'),
] + router.urls

