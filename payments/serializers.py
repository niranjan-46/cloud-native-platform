from rest_framework import serializers
from .models import Payment
from jobs.models import Bid, JobPost

class BidSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = '__all__' 
        read_only_fields = fields
        
class JobPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        fields = '__all__' 
        read_only_fields = fields

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'currency', 'status', 'created_at', 'order_id', 'payment_id']
        read_only_fields = fields 