from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription, UserSubscriptionPayments

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class UserSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSubscription
        fields = '__all__'

class UserSubscriptionPaymentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSubscriptionPayments
        fields = '__all__'