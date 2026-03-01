from rest_framework import serializers
from .models import HelpSupport

class HelpSupportSerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpSupport
        fields = '__all__'
        read_only_fields = ['user','created_at','updated_at','status']



