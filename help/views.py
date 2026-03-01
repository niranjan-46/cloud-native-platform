from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import HelpSupport
from .serializers import HelpSupportSerializer
from rest_framework.permissions import IsAuthenticated
from core.gcs_upload import upload_file_to_gcs



class HelpSupportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            subject = request.data.get('subject')
            message = request.data.get('message')
            screenshot_list = {}
            
            # Handle file uploads
            for i in range(1, 6):  # Handle up to 5 screenshots
                file_key = f'screenshot{i}'
                if file_key in request.FILES:
                    file = request.FILES[file_key]
                    result = upload_file_to_gcs(file, folder="help-support")
                    screenshot_list[file_key] = result.get('secure_url')
            
            serializer = HelpSupportSerializer(data={
                'subject': subject,
                'message': message,
                **screenshot_list
            })
            
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        try:
            help_support = HelpSupport.objects.filter(user=request.user)
            serializer = HelpSupportSerializer(help_support, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except HelpSupport.DoesNotExist:
            return Response(
                {'error': 'No help support tickets found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
