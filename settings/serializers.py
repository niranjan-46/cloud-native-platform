from rest_framework import serializers
from .models import EmailPreference

class EmailPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailPreference
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True}  # Same effect as read_only_fields
        }
        
    def create(self, validated_data):
        user = self.context['request'].user
        return EmailPreference.objects.create(user=user, **validated_data)