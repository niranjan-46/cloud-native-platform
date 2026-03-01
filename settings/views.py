from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import request, status
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate
from django.contrib.auth import logout
from .models import EmailPreference
from .serializers import EmailPreferenceSerializer
from rest_framework.viewsets import ModelViewSet
from accounts.models import User
from rest_framework.permissions import IsAuthenticated



@permission_classes([IsAuthenticated])
@api_view(['POST'])
def change_password(request):
    if request.method == 'POST':
        current_password = request.data.get('currentPassword')
        new_password = request.data.get('newPassword')
        confirm_password = request.data.get('confirmPassword')

        # Validate required fields
        if not all([current_password, new_password, confirm_password]):
            return Response(
                {'error': 'All fields are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify current password
        user = request.user
        if not authenticate(username=user.email, password=current_password):
            return Response(
                {'error': 'Current password is incorrect.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if new passwords match
        if new_password != confirm_password:
            return Response(
                {'error': 'New passwords do not match.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate password strength
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'error': list(e.messages)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'message': 'Password changed successfully.'}, 
            status=status.HTTP_200_OK
        )
    
    return Response(
        {'error': 'Invalid request method.'}, 
        status=status.HTTP_405_METHOD_NOT_ALLOWED
    )

@permission_classes([IsAuthenticated])
@api_view(['POST'])
def delete_account(request):
    if request.method == 'POST':
        password = request.data.get('password')
        
        # Validate password is provided
        if not password:
            return Response(
                {'error': 'Password is required for account deletion.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Verify password
        user = request.user
        if not authenticate(username=user.email, password=password):
            return Response(
                {'error': 'Password is incorrect.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Delete the user
        user.delete()
        
        # Logout the user
        logout(request)
        
        return Response(
            {'message': 'Account deleted successfully.'}, 
            status=status.HTTP_200_OK
        )
    
    return Response(
        {'error': 'Invalid request method.'}, 
        status=status.HTTP_405_METHOD_NOT_ALLOWED
    )
        


class EmailPreferenceView(ModelViewSet):
    serializer_class = EmailPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return EmailPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        return EmailPreference.objects.get(user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)