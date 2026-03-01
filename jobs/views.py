from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from .models import JobPost, Bid, DirectApplication, SavedJob, CandidateSubmission, Resume
from accounts.models import User, CandidateProfile, Education, Experience, ConsultancyProfile
from accounts.serializers import CandidateProfileSerializer, EducationSerializer, ExperienceSerializer, ConsultancyProfileSerializer
from .serializers import JobPostSerializer, BidSerializer, DirectApplicationSerializer, SavedJobSerializer, UpdateBidSerializer, CandidateSubmissionSerializer, ResumeSerializer
from .permissions import IsEmployerOrReadOnly, IsCandidateOrReadOnly, IsConsultancyOrReadOnly
from django.db import models
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError
from .utils import generate_agreement_pdf
from threading import Thread
from jobs.utils import send_employer_reject_bid_email, send_consultancy_reject_bid_email
from django.core.files.uploadedfile import UploadedFile
import mimetypes
from core.gcs_upload import upload_file_to_gcs
from rest_framework.parsers import MultiPartParser, FormParser
from subscriptions.models import UserSubscription

class JobPostFilter(filters.FilterSet):
    min_salary = filters.NumberFilter(field_name="min_salary", lookup_expr='gte')
    max_salary = filters.NumberFilter(field_name="max_salary", lookup_expr='lte')
    
    class Meta:
        model = JobPost
        fields = {
            'job_type': ['exact'],
            'experience_level': ['exact'],
            'work_mode': ['exact'],
            'location': ['icontains'],
            'industry': ['icontains'],
            'skills_required': ['icontains'],
        }

class JobPostViewSet(viewsets.ModelViewSet):
    queryset = JobPost.objects.filter(is_published=True)
    serializer_class = JobPostSerializer
    filterset_class = JobPostFilter
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrReadOnly]
    
    def get_permissions(self):
        """
        Override to set different permissions based on the action
        """
        if self.action == 'apply':
            return [permissions.IsAuthenticated(), IsCandidateOrReadOnly()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        user = self.request.user
        subscription = UserSubscription.objects.filter(user=user, active=True).first()
        print(subscription.job_limit, 'job limit and create job before')
        if not subscription or subscription.job_limit <= 0:
            raise ValidationError({'detail': 'Your job posting usage is completed. Please upgrade your plan.'})
        instance = serializer.save(posted_by=user)
        subscription.job_limit -= 1
        subscription.save(update_fields=["job_limit"])
        print(subscription.job_limit, 'job limit and create job after')
        return instance
    
    def get_queryset(self):
        """
        Filter queryset based on user type
        """
        user = self.request.user
        if hasattr(user, 'employer_profile'):
            # Employers can see all published jobs plus their own unpublished ones
            return JobPost.objects.filter(
                models.Q(is_published=True) | 
                models.Q(posted_by=user)
            )
        # Candidates and consultancies can only see published jobs
        return JobPost.objects.filter(is_published=True)
    
    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        job = self.get_object()
        serializer = DirectApplicationSerializer(data={
            'job': job.id,
            'candidate': request.user.candidate_profile.id,
            'cover_letter': request.data.get('cover_letter', '')
        })
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BidViewSet(viewsets.ModelViewSet):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employer_profile'):
            return Bid.objects.filter(job__posted_by=user)
        elif hasattr(user, 'consultancy_profile'):
            return Bid.objects.filter(consultancy=user.consultancy_profile)
        return Bid.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Only allow consultancy profiles to create bids
        if not hasattr(request.user, 'consultancy_profile'):
            raise PermissionDenied("Only consultancies can submit bids")
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as e:
            error_message = str(e)
            if "A consultancy can only submit 3 bids per job" in error_message:
                return Response(
                    {"detail": "You have reached the maximum limit of 3 bids for this job. Please review your existing bids."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif "You have already submitted this proposal for this job" in error_message:
                return Response(
                    {"detail": "You have already submitted this exact proposal for this job. Please modify your proposal."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        consultancy = self.request.user.consultancy_profile
        user = consultancy.user
        subscription = UserSubscription.objects.filter(user=user, active=True).first()
        print(subscription.bid_limit, 'bid limit and create bid before')
        if not subscription or subscription.bid_limit <= 0:
            raise ValidationError({'detail': 'Your bid usage is completed. Please upgrade your plan.'})
        instance = serializer.save(consultancy=consultancy)
        subscription.bid_limit -= 1
        subscription.save(update_fields=["bid_limit"])
        return instance
    
    def update(self, request, *args, **kwargs):
        # Only allow employers to update bid status
        if 'status' in request.data and not hasattr(request.user, 'employer_profile'):
            raise PermissionDenied("Only employers can update bid status")
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        bid = self.get_object()
        if not hasattr(request.user, 'employer_profile'):
            return Response(
                {"detail": "Only employers can approve bids"},
                status=status.HTTP_403_FORBIDDEN
            )
        if request.user != bid.job.posted_by:
            return Response(
                {"detail": "Only the job poster can approve bids"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Generate agreement PDF and get URL
            agreement_url = generate_agreement_pdf(bid.id)
            
            # Refresh bid from database to get updated fields
            bid.refresh_from_db()
            
            
            # Update bid status and save
            bid.status = 'approved'
            bid.save()
            
            # Get updated serializer data
            serializer = self.get_serializer(bid)
            
            return Response({
                **serializer.data,
                'agreement_url': agreement_url
            })
        except Exception as e:
            return Response(
                {"detail": f"Error generating agreement: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        bid = self.get_object()
        if not hasattr(request.user, 'employer_profile'):
            return Response(
                {"detail": "Only employers can reject bids"},
                status=status.HTTP_403_FORBIDDEN
            )
        if request.user != bid.job.posted_by:
            return Response(
                {"detail": "Only the job poster can reject bids"},
                status=status.HTTP_403_FORBIDDEN
            )
        bid.status = 'rejected'
        bid.agreement_id = None
        bid.agreement_pdf_url = None
        bid.save()
        # send email to employer and consultancy
        Thread(target=send_employer_reject_bid_email, args=(bid.id,)).start()
        Thread(target=send_consultancy_reject_bid_email, args=(bid.id,)).start()
        return Response(BidSerializer(bid).data)

class DirectApplicationViewSet(viewsets.ModelViewSet):
    queryset = DirectApplication.objects.all()
    serializer_class = DirectApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employer_profile'):
            return DirectApplication.objects.filter(job__posted_by=user)
        elif hasattr(user, 'candidate_profile'):
            return DirectApplication.objects.filter(candidate=user.candidate_profile)
        return DirectApplication.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(candidate=self.request.user.candidate_profile)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        application = self.get_object()
        if request.user != application.job.posted_by:
            return Response(
                {"detail": "Only the job poster can update application status"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        rejection_reason = None
        if new_status == 'rejected':
            rejection_reason = request.data.get('rejection_reason') or None
        if new_status not in dict(DirectApplication.STATUS_CHOICES):
            return Response(
                {"detail": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = new_status
        application.rejection_reason = rejection_reason
        application.save()
        return Response(DirectApplicationSerializer(application).data)


class SavedJobViewSet(viewsets.ModelViewSet):
    queryset = SavedJob.objects.all()
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'candidate_profile'):
            return SavedJob.objects.filter(candidate=user.candidate_profile)
        return SavedJob.objects.none()

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'candidate_profile'):
            raise permissions.PermissionDenied("Only candidates can save jobs")
        
        # Check if job already exists in saved jobs
        job_id = serializer.validated_data['job'].id
        if SavedJob.objects.filter(
            job_id=job_id,
            candidate=self.request.user.candidate_profile
        ).exists():
            raise serializers.ValidationError("This job is already saved")
            
        serializer.save(candidate=self.request.user.candidate_profile)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.candidate != request.user.candidate_profile:
            raise permissions.PermissionDenied("You can only unsave jobs that you have saved")
        return super().destroy(request, *args, **kwargs)

#get Candidate Profile
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    request_user = request.user
    if request_user.user_type == "candidate" or request_user.user_type == "consultancy":
        return Response({"error": "You are not authorized to access this View"}, status=400)
    id = request.data.get("id")
    candidate_profile = CandidateProfile.objects.get(id=id)
    user = User.objects.get(id=candidate_profile.user.id)
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "user_type": user.user_type
    }

    try:
        if user.user_type == 'candidate':
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

    except (CandidateProfile.DoesNotExist):
        return Response({"user": user_data, "profile": None, "message": "Profile not found."}, status=404)


#update bid
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_bid(request, pk):
    try:
        bid = Bid.objects.get(id=pk)
        # Compare the IDs directly
        if bid.consultancy.id == request.user.consultancy_profile.id:
            if 'status' in request.data:
                return Response({"detail": "You are not authorized to update this bid status or consultancy or job or id"}, status=status.HTTP_403_FORBIDDEN)
            serializer = UpdateBidSerializer(bid, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        else:
            return Response({"detail": "You are not authorized to update this bid"}, status=status.HTTP_403_FORBIDDEN)
    except Bid.DoesNotExist:
        return Response({"detail": "Bid not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

#delete bid
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_bid(request, pk):
    try:
        bid = Bid.objects.get(id=pk)
        if bid.consultancy.id == request.user.consultancy_profile.id:
            bid.delete()
            return Response({"detail": "Bid deleted successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "You are not authorized to delete this bid"}, status=status.HTTP_403_FORBIDDEN)
    except Bid.DoesNotExist:
        return Response({"detail": "Bid not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    
    
#get consultancy profile only by employer
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_consultancy_profile(request, pk):
    


    if request.user.user_type != "employer":
        return Response({"detail": "You are not authorized to access this view"}, status=status.HTTP_403_FORBIDDEN)
    consultancy_profile = ConsultancyProfile.objects.get(id=pk)
    return Response(ConsultancyProfileSerializer(consultancy_profile).data)


#submit candidates
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_candidates(request):
    if not hasattr(request.user, 'consultancy_profile'):
        return Response(
            {"detail": "Only consultancies can submit candidates"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        bid_id = request.data.get("bid_id")
        if not bid_id:
            return Response(
                {"detail": "Bid ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        bid = Bid.objects.get(id=bid_id)
        
        # Verify that the bid belongs to the requesting consultancy
        if bid.consultancy != request.user.consultancy_profile:
            return Response(
                {"detail": "You can only submit candidates for your own bids"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get or create candidate submission
        candidate_submission, created = CandidateSubmission.objects.get_or_create(
            bid=bid
        )

        candidates = request.data.get("candidates", [])
        if not candidates:
            return Response(
                {"detail": "No candidates provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_resumes = []
        for candidate in candidates:
            if not candidate.get("name") or not candidate.get("resume"):
                continue

            # Create resume record
            resume = Resume.objects.create(
                candidate_submission=candidate_submission,
                name=candidate["name"],
                resume=candidate["resume"],
                status='pending'
            )
            created_resumes.append(resume)

        if not created_resumes:
            return Response(
                {"detail": "No valid candidates were provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Serialize the response
        serializer = CandidateSubmissionSerializer(candidate_submission)
        return Response({
            "detail": "Candidates submitted successfully",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)

    except Bid.DoesNotExist:
        return Response(
            {"detail": "Bid not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    if not hasattr(request.user, 'consultancy_profile'):
        return Response(
            {"detail": "Only consultancies can upload resumes"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        file = request.FILES.get('resume')
        if not file:
            return Response(
                {"detail": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        content_type, _ = mimetypes.guess_type(file.name)
        allowed_types = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png"
        ]

        if content_type not in allowed_types:
            return Response(
                {"detail": "Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size (10MB limit)
        if file.size > 10 * 1024 * 1024:  # 10MB in bytes
            return Response(
                {"detail": "File size exceeds 10MB limit"},
                status=status.HTTP_400_BAD_REQUEST
            )

        upload_result = upload_file_to_gcs(
            file,
            folder="resumes",
            allowed_formats=["pdf", "doc", "docx", "jpg", "jpeg", "png"],
        )

        return Response({
            "url": upload_result.get('secure_url'),
            "public_id": upload_result.get('public_id'),
            "format": upload_result.get('format')
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"detail": f"Error uploading file: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
        

#get candidate submissions BY CONSULTANCY
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_candidate_submissions(request, pk):
    if not hasattr(request.user, 'consultancy_profile'):
        return Response(
            {"detail": "Only consultancies can get candidate submissions"},
            status=status.HTTP_403_FORBIDDEN
        )
    bid = Bid.objects.get(id=pk)
    if not bid:
        return Response(
            {"detail": "Bid not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    if bid.consultancy != request.user.consultancy_profile:
        return Response(
            {"detail": "You are not authorized to get candidate submissions for this bid"},
            status=status.HTTP_403_FORBIDDEN
        )
    candidate_submissions = CandidateSubmission.objects.filter(bid=bid)
    return Response(CandidateSubmissionSerializer(candidate_submissions, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_candidate_submissions_by_employer(request, pk):
    if not hasattr(request.user, 'employer_profile'):
        return Response(
            {"detail": "Only employers can get candidate submissions"},
            status=status.HTTP_403_FORBIDDEN
        )
    bid = Bid.objects.get(id=pk)
    if not bid:
        return Response(
            {"detail": "Bid not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    if bid.job.posted_by != request.user:
        return Response(
            {"detail": "You are not authorized to get candidate submissions for this bid"},
            status=status.HTTP_403_FORBIDDEN
        )
    candidate_submissions = CandidateSubmission.objects.filter(bid=bid)
    return Response(CandidateSubmissionSerializer(candidate_submissions, many=True).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_candidate_submission(request, pk, resume_id):
    if not hasattr(request.user, 'employer_profile'):
        return Response(
            {"detail": "Only employers can update candidate submissions"},
            status=status.HTTP_403_FORBIDDEN
        )
    resume = Resume.objects.get(id=resume_id)
    if resume.candidate_submission.bid.job.posted_by != request.user:
        return Response(
            {"detail": "You are not authorized to update this candidate submission"},
            status=status.HTTP_403_FORBIDDEN
        )
    if 'status' in request.data:
        resume.status = request.data['status']
        resume.rejection_reason = request.data['rejection_reason'] or None
        resume.save()
        if request.data['status'] == 'hired':
            pass #send payment link via email
        return Response(ResumeSerializer(resume).data)
    else:
        return Response(
            {"detail": "Invalid status"},
            status=status.HTTP_400_BAD_REQUEST
        )
