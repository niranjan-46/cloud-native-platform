from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'payments', views.PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    path("create-order/", views.create_order, name="create_order"),
    path("verify-payment/", views.verify_payment, name="verify_payment"),
    path("webhook/", views.webhook, name="webhook"),
    path("get-payment-details/<int:job_id>/", views.get_payment_details, name="get_payment_details"),
]
