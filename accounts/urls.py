from django.urls import path, include
from accounts.views import EmployerProfileUpdateView, ConsultancyProfileUpdateView, CandidateProfileUpdateView, get_user_profile, send_reset_password_email, reset_password, GoogleLoginAPIView, EmailOTPSendView, VerifyEmailOTPView, UploadDocumentsView, ApplicationStatusView, EducationListView, EducationDetailView, ExperienceListView, ExperienceDetailView, UpdateProfileImageView, UserUpdateView

urlpatterns = [
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),


    #social logins
    path('auth/google-login/', GoogleLoginAPIView.as_view(), name='google-login'),

    #user update urls
    path('update-user/', UserUpdateView.as_view(), name='update-user'),

    #profile urls
    path('employer/profile/', EmployerProfileUpdateView.as_view(), name='employer-profile-update'),
    path('consultancy/profile/', ConsultancyProfileUpdateView.as_view(), name='consultancy-profile-update'),
    path('candidate/profile/', CandidateProfileUpdateView.as_view(), name='candidate-profile-update'),
    path('get/profile/', get_user_profile, name='get-profile'),
    path('update-profile-image/', UpdateProfileImageView.as_view(), name='update-profile-image'),
    


    #password reset urls
    path('auth/request-reset-password/', send_reset_password_email),
    path('auth/reset-password/<uidb64>/<token>/', reset_password),

    #email otp urls
    path('send-otp/', EmailOTPSendView.as_view(), name='send_otp'),
    path('verify-otp/', VerifyEmailOTPView.as_view(), name='verify_otp'),

    #profile document upload urls for registration
    path('upload-documents/', UploadDocumentsView.as_view(), name='upload-documents'),

    #application status update urls
    path('get-application-status/', ApplicationStatusView.as_view(), name='get-application-status'),

    # Education URLs
    path('educations/', EducationListView.as_view(), name='education-list'),
    path('educations/<int:pk>/', EducationDetailView.as_view(), name='education-detail'),
    
    # Experience URLs
    path('experiences/', ExperienceListView.as_view(), name='experience-list'),
    path('experiences/<int:pk>/', ExperienceDetailView.as_view(), name='experience-detail'),

]
