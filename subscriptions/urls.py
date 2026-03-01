from django.urls import path
from .views import (
    SubscriptionPlanListRetrieveView,
    UserSubscriptionRetrieveUpdateView,
    UserSubscriptionCreateView,
    create_subscription_order,
    verify_subscription_payment,
    subscription_webhook
)

urlpatterns = [
    path('plans/', SubscriptionPlanListRetrieveView.as_view(), name='subscription-plan-list'),
    path('subscribe/', UserSubscriptionRetrieveUpdateView.as_view(), name='user-subscription-retrieve-update'),
    path('subscribe/create/', UserSubscriptionCreateView.as_view(), name='user-subscription-create'),
    path('subscribe/create-payment/', create_subscription_order, name='subscription-create-payment'),
    path('subscribe/verify-payment/', verify_subscription_payment, name='subscription-verify-payment'),
    path('subscribe/webhook/', subscription_webhook, name='subscription-webhook'),
]