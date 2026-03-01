import mimetypes
from rest_framework.generics import RetrieveUpdateAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from .models import EmployerProfile, ConsultancyProfile, CandidateProfile, User, EmailOTP, Education, Experience
from .serializers import EmployerProfileSerializer, ConsultancyProfileSerializer, CandidateProfileSerializer, EmployerProfileDocumentUploadSerializer, CandidateProfileDocumentUploadSerializer, ConsultancyProfileDocumentUploadSerializer, EducationSerializer, ExperienceSerializer, UserUpdateSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .utils import generate_otp, send_otp_via_email
from threading import Thread
from rest_framework import status
from rest_framework.views import APIView
from core.gcs_upload import upload_file_to_gcs



# Employer Profile Update View
class EmployerProfileUpdateView(RetrieveUpdateAPIView):
    queryset = EmployerProfile.objects.all()
    serializer_class = EmployerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.employer_profile


# Consultancy Profile Update View
class ConsultancyProfileUpdateView(RetrieveUpdateAPIView):
    queryset = ConsultancyProfile.objects.all()
    serializer_class = ConsultancyProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.consultancy_profile


# Candidate Profile Update View
class CandidateProfileUpdateView(RetrieveUpdateAPIView):
    queryset = CandidateProfile.objects.all()
    serializer_class = CandidateProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.candidate_profile

# education update view
class EducationListView(ListCreateAPIView):
    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class EducationDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)

# experience update view
class ExperienceListView(ListCreateAPIView):
    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExperienceDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)


# Get User Data and Profile Data
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user = request.user
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "user_type": user.user_type
    }

    try:
        if user.user_type == 'employer':
            profile = user.employer_profile
            profile_serializer = EmployerProfileSerializer(profile)
            education_serializer = EducationSerializer(Education.objects.filter(user=user), many=True)
            experience_serializer = ExperienceSerializer(Experience.objects.filter(user=user), many=True)
        elif user.user_type == 'consultancy':
            profile = user.consultancy_profile
            profile_serializer = ConsultancyProfileSerializer(profile)
            education_serializer = EducationSerializer(Education.objects.filter(user=user), many=True)
            experience_serializer = ExperienceSerializer(Experience.objects.filter(user=user), many=True)
        elif user.user_type == 'candidate':
            profile = user.candidate_profile
            profile_serializer = CandidateProfileSerializer(profile)
            education_serializer = EducationSerializer(Education.objects.filter(user=user), many=True)
            experience_serializer = ExperienceSerializer(Experience.objects.filter(user=user), many=True)
        else:
            return Response({"error": "Invalid user type."}, status=400)

        return Response({
            "user": user_data,
            "profile": profile_serializer.data,
            "education": education_serializer.data,
            "experience": experience_serializer.data
        })

    except (EmployerProfile.DoesNotExist, ConsultancyProfile.DoesNotExist, CandidateProfile.DoesNotExist):
        return Response({"user": user_data, "profile": None, "message": "Profile not found."}, status=404)


# yourapp/views.py

from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from accounts.utils import send_password_reset_email

User = get_user_model()
token_generator = PasswordResetTokenGenerator()

@api_view(['POST'])
def send_reset_password_email(request):
    email = request.data.get("email")
    try:
        user = User.objects.get(email=email)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        send_password_reset_email(user, uid, token)
        return Response({"message": "Password reset link sent!"})
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=404)

@api_view(['POST'])
def reset_password(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)

        if not token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token."}, status=400)

        password = request.data.get("password")
        if not password:
            return Response({"error": "Password is required."}, status=400)

        user.set_password(password)
        user.save()
        return Response({"message": "Password reset successful!"})

    except (User.DoesNotExist, ValueError, TypeError):
        return Response({"error": "Invalid token or user."}, status=400)




# views.py
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class GoogleLoginAPIView(APIView):
    def post(self, request):
        access_token = request.data.get("token")

        if not access_token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get user info from Google
        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        response = requests.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"})

        if response.status_code != 200:
            return Response({"error": "Failed to fetch user info from Google"}, status=400)

        user_data = response.json()
        email = user_data.get("email")
        name = user_data.get("name")

        if not email:
            return Response({"error": "Email not found in Google response"}, status=400)


        try:
            user = User.objects.get(email=email)
            # Issue JWT
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user_type": user.user_type
            })
        except User.DoesNotExist:
            user_data["error"] = "User not found"
            # print("google login user data: ",user_data);
            return Response(user_data, status=404)



#email otp send view
class EmailOTPSendView(APIView):
    def post(self, request):
        email = request.data.get('email')
        

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=400)

        otp = generate_otp()
        EmailOTP.objects.create(email=email, otp=otp)
        email_thread = Thread(
            target=send_otp_via_email, args=(email, otp)
            )
        email_thread.start()


        return Response({'message': 'OTP sent to email'}, status=200)

# views.py
class VerifyEmailOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        try:
            record = EmailOTP.objects.filter(email=email).latest('created_at')
            if record.otp == otp and not record.is_expired():
                # user = User.objects.get(email=email)
                # user.is_email_verified = True
                # user.save()
                record.delete()  # Clean up
                return Response({'message': 'Email verified successfully'}, status=200)
            else:
                return Response({'error': 'Invalid or expired OTP'}, status=400)
        except EmailOTP.DoesNotExist:
            return Response({'error': 'OTP not found'}, status=404)


# Employer Profile Document Upload View
class UploadDocumentsView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            user = User.objects.get(id=request.user.id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if user.user_type == 'employer':
            profile, _ = EmployerProfile.objects.get_or_create(user=user)
        elif user.user_type == 'consultancy':
            profile, _ = ConsultancyProfile.objects.get_or_create(user=user)
        elif user.user_type == 'candidate':
            profile, _ = CandidateProfile.objects.get_or_create(user=user)


        
        data = {}
        if user.user_type == 'employer' or user.user_type == 'consultancy':
            for field in ['msme_or_incorporation_certificate', 'gstin_certificate', 'pan_card', 'poc_document']:
                file = request.FILES.get(field)
                if file:
                    upload_result = upload_file_to_gcs(file, folder=field)
                    data[field] = upload_result.get('secure_url')
        elif user.user_type == 'candidate':
            for field in ['resume']:
                file = request.FILES.get(field)
                if file:
                    upload_result = upload_file_to_gcs(file, folder=field)
                    data[field] = upload_result.get('secure_url')

        if user.user_type == 'employer':
            serializer = EmployerProfileDocumentUploadSerializer(profile, data=data, partial=True)
        elif user.user_type == 'consultancy':
            serializer = ConsultancyProfileDocumentUploadSerializer(profile, data=data, partial=True)
        elif user.user_type == 'candidate':
            serializer = CandidateProfileDocumentUploadSerializer(profile, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#application status update view
class ApplicationStatusView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            user = User.objects.get(id=request.user.id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if user.user_type == 'employer':
            profile = user.employer_profile
            profile_serializer = EmployerProfileSerializer(profile)
        elif user.user_type == 'consultancy':
            profile = user.consultancy_profile
            profile_serializer = ConsultancyProfileSerializer(profile)
        elif user.user_type == 'candidate':
            profile = user.candidate_profile
            profile_serializer = CandidateProfileSerializer(profile)
        return Response({'email': user.email, 'user_type': user.user_type, 'application_status': profile_serializer.data['application_status']}, status=200)

#dashboard data view
#update profile_image view
class UpdateProfileImageView(APIView):
    permission_classes = [IsAuthenticated]
    
    ALLOWED_IMAGE_TYPES = {
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    }
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

    def post(self, request):
        try:
            user = User.objects.get(id=request.user.id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get the appropriate profile based on user type
        if user.user_type == 'employer':
            profile = EmployerProfile.objects.get(user=user)
        elif user.user_type == 'consultancy':
            profile = ConsultancyProfile.objects.get(user=user)
        elif user.user_type == 'candidate':
            profile = CandidateProfile.objects.get(user=user)
        else:
            return Response({'error': 'Invalid user type'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle profile image upload
        file = request.FILES.get('profile_image')
        if not file:
            return Response({'error': 'Profile image is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size
        if file.size > self.MAX_FILE_SIZE:
            return Response({
                'error': f'File size must be less than 10MB. Current size: {file.size / (1024 * 1024):.2f}MB'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        content_type = file.content_type
        if content_type not in self.ALLOWED_IMAGE_TYPES:
            return Response({
                'error': f'Invalid file type. Allowed types: {", ".join(self.ALLOWED_IMAGE_TYPES)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Upload to GCS bucket
        try:
            upload_result = upload_file_to_gcs(file, folder=f"profile_images/{user.user_type}")
            data = {'profile_image': upload_result.get('secure_url')}
        except Exception as e:
            return Response({'error': f'Failed to upload image: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Update profile with new image URL
        if user.user_type == 'employer':
            serializer = EmployerProfileSerializer(profile, data=data, partial=True)
        elif user.user_type == 'consultancy':
            serializer = ConsultancyProfileSerializer(profile, data=data, partial=True)
        elif user.user_type == 'candidate':
            serializer = CandidateProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#user update view like name, phone
class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            user = request.user
            serializer = UserUpdateSerializer(user, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'status': 'success',
                    'message': 'User information updated successfully',
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response({
                'status': 'error',
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
