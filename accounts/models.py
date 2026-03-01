from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.conf import settings
import random
from django.utils import timezone
from datetime import timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserManager(BaseUserManager):
    def create_user(self, email, name, phone, user_type, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, phone=phone, user_type=user_type, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, phone, user_type='admin', password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, phone, user_type, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPES = (
        ('employer', 'Employer'),
        ('consultancy', 'Consultancy'),
        ('candidate', 'Candidate'),
    )

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    user_type = models.CharField(max_length=20, choices=USER_TYPES)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=True)
    is_phone_verified = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)

    # Registration tracking
    registration_step = models.PositiveSmallIntegerField(default=3)
    completed_steps = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'phone', 'user_type']

    def update_registration_steps(self):
        """Update registration steps based on user type and completed data"""
        if self.user_type == 'employer':
            self._update_employer_steps()
        elif self.user_type == 'consultancy':
            self._update_consultancy_steps()
        elif self.user_type == 'candidate':
            self._update_candidate_steps()
        
        self.save()

    def _update_employer_steps(self):
        """Update steps for employer type"""
        try:
            profile = self.employer_profile
            steps = 3  # Start with base step

            # Step 1: Basic company info
            if all([profile.company_name]):
                steps += 1

            # Step 2: Company address
            if profile.company_address:
                steps += 1

            # Step 3: Documents
            if all([
                profile.msme_or_incorporation_certificate,
                profile.gstin_certificate,
                profile.pan_card,
                profile.poc_document
            ]):
                steps += 1

            self.registration_step = steps
            self.completed_steps = steps >= 6  # All steps completed
        except EmployerProfile.DoesNotExist:
            pass

    def _update_consultancy_steps(self):
        """Update steps for consultancy type"""
        try:
            profile = self.consultancy_profile
            steps = 3  # Start with base step

            # Step 1: Basic consultancy info
            if all([profile.consultancy_name]):
                steps += 1

            # Step 2: Office address
            if profile.office_address:
                steps += 1

            # Step 3: Documents
            if all([
                profile.msme_or_incorporation_certificate,
                profile.gstin_certificate,
                profile.pan_card,
                profile.poc_document
            ]):
                steps += 1

            self.registration_step = steps
            self.completed_steps = steps >= 6  # All steps completed
        except ConsultancyProfile.DoesNotExist:
            pass

    def _update_candidate_steps(self):
        """Update steps for candidate type"""
        try:
            profile = self.candidate_profile
            steps = 3  # Start with base step

            # Step 1: Basic profile info
            if all([profile.gender, profile.city, profile.preferenced_city]):
                steps += 1

            # Step 2: Education
            education = self.educations.first()
            if education and all([
                education.education_type,
                education.school_name,
                education.degree,
                education.start_date,
                education.field_of_study
            ]):
                steps += 1

            # Step 3: Experience
            experience = self.experiences.first()
            if experience and all([
                experience.company_name,
                experience.designation,
                experience.job_type,
                experience.location
            ]):
                steps += 1

            # Step 4: Resume
            if profile.resume:
                steps += 1

            self.registration_step = steps
            self.completed_steps = steps >= 5  # All steps completed
        except CandidateProfile.DoesNotExist:
            pass

    def __str__(self):
        return self.email or self.name



class EmployerProfile(models.Model):
    APPLICATION_STATUS_CHOICES = (
        ('verifying', 'Verifying'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employer_profile')
    company_name = models.CharField(max_length=255, null=True, blank=True)
    designation = models.CharField(max_length=255, null=True, blank=True)
    industry = models.CharField(max_length=255, null=True, blank=True)
    company_size = models.CharField(max_length=100, null=True, blank=True)
    company_address = models.TextField(null=True, blank=True)
    website_url = models.URLField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    company_description = models.TextField(null=True, blank=True)
    core_business = models.TextField(null=True, blank=True)
    company_culture = models.TextField(null=True, blank=True)
    profile_image = models.URLField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Cloudinary Image Field
    msme_or_incorporation_certificate = models.URLField(null=True, blank=True)
    gstin_certificate = models.URLField(null=True, blank=True)
    pan_card = models.URLField(null=True, blank=True)
    poc_document = models.URLField(null=True, blank=True)

    #application status
    application_status = models.CharField(max_length=255, null=True, blank=True,default='verifying',choices=APPLICATION_STATUS_CHOICES)

    def _documents_submitted(self):
        docs = [
            self.msme_or_incorporation_certificate,
            self.gstin_certificate,
            self.pan_card,
            self.poc_document,
        ]
        return all(bool(doc and str(doc).strip()) for doc in docs)

    def _has_any_document(self):
        docs = [
            self.msme_or_incorporation_certificate,
            self.gstin_certificate,
            self.pan_card,
            self.poc_document,
        ]
        return any(bool(doc and str(doc).strip()) for doc in docs)

    def save(self, *args, **kwargs):
        # Auto-approve once all required docs are uploaded (no manual approval needed).
        if self._documents_submitted():
            self.application_status = 'approved'
        elif self._has_any_document():
            self.application_status = 'pending'
        else:
            self.application_status = 'verifying'

        if self.phone_number and self.phone_number != self.user.phone:
            self.user.phone = self.phone_number
            self.user.save(update_fields=['phone'])
        super().save(*args, **kwargs)

    def __str__(self):
        return self.company_name or self.user.name


class ConsultancyProfile(models.Model):
    APPLICATION_STATUS_CHOICES = (
        ('verifying', 'Verifying'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='consultancy_profile')
    consultancy_name = models.CharField(max_length=255, null=True, blank=True)
    specialization = models.CharField(max_length=255, null=True, blank=True)
    experience_years = models.PositiveIntegerField(null=True, blank=True)
    office_address = models.TextField(null=True, blank=True)
    website = models.URLField(blank=True, null=True)
    consultancy_size = models.CharField(max_length=100, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    profile_image = models.URLField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Cloudinary Image Field
    msme_or_incorporation_certificate = models.URLField(null=True, blank=True)
    gstin_certificate = models.URLField(null=True, blank=True)
    pan_card = models.URLField(null=True, blank=True)
    poc_document = models.URLField(null=True, blank=True)

    #application status
    application_status = models.CharField(max_length=255, null=True, blank=True,default='verifying',choices=APPLICATION_STATUS_CHOICES)

    def _documents_submitted(self):
        docs = [
            self.msme_or_incorporation_certificate,
            self.gstin_certificate,
            self.pan_card,
            self.poc_document,
        ]
        return all(bool(doc and str(doc).strip()) for doc in docs)

    def _has_any_document(self):
        docs = [
            self.msme_or_incorporation_certificate,
            self.gstin_certificate,
            self.pan_card,
            self.poc_document,
        ]
        return any(bool(doc and str(doc).strip()) for doc in docs)

    def save(self, *args, **kwargs):
        # Auto-approve once all required docs are uploaded (no manual approval needed).
        if self._documents_submitted():
            self.application_status = 'approved'
        elif self._has_any_document():
            self.application_status = 'pending'
        else:
            self.application_status = 'verifying'

        if self.phone_number and self.phone_number != self.user.phone:
            self.user.phone = self.phone_number
            self.user.save(update_fields=['phone'])
        super().save(*args, **kwargs)

    def __str__(self):
        return self.consultancy_name or self.user.name


class CandidateProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    skills = models.TextField(null=True, blank=True)
    portfolio_website = models.URLField(blank=True, null=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    preferenced_city = models.CharField(max_length=300, null=True, blank=True)

    profile_image = models.URLField(null=True, blank=True)
    bio = models.CharField(max_length=180, null=True, blank=True)
    about = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Cloudinary Image Field
    resume = models.URLField(null=True, blank=True)

    #application status
    application_status = models.CharField(max_length=255, null=True, blank=True, default='pending')

    def save(self, *args, **kwargs):
        # Update application status based on resume
        if self.resume and self.resume.strip():
            self.application_status = 'approved'
        else:
            self.application_status = 'pending'
            
        # Sync phone number with user if changed
        if self.phone_number and self.phone_number != self.user.phone:
            self.user.phone = self.phone_number
            self.user.save(update_fields=['phone'])
        super().save(*args, **kwargs)

    def __str__(self):
        return self.user.name or self.user.name
    
class Education(models.Model):
    EDUCATION_TYPES = (
        ('primary', 'Primary School'),
        ('secondary', 'Secondary School'),
        ('higher_secondary', 'Higher Secondary'),
        ('bachelors', 'Bachelors'),
        ('masters', 'Masters'),
        ('phd', 'PhD'),
        ('other', 'Other'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educations')
    education_type = models.CharField(max_length=20, choices=EDUCATION_TYPES, default='other')
    school_name = models.CharField(max_length=255, null=True, blank=True)
    degree = models.CharField(max_length=255, null=True, blank=True)
    field_of_study = models.CharField(max_length=255, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    grade = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.created_at:
            self.created_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.degree} at {self.school_name}"


class Experience(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    company_name = models.CharField(max_length=255, null=True, blank=True)
    designation = models.CharField(max_length=255, null=True, blank=True)
    job_type = models.CharField(max_length=255, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    currently_working = models.BooleanField(default=False)
    job_description = models.TextField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.created_at:
            self.created_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.designation} at {self.company_name}"



class EmailOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

@receiver(post_save, sender=User)
def sync_user_phone_to_profile(sender, instance, **kwargs):
    """Signal to sync User phone to profile phone_number"""
    if hasattr(instance, 'employer_profile'):
        profile = instance.employer_profile
        if profile.phone_number != instance.phone:
            profile.phone_number = instance.phone
            profile.save(update_fields=['phone_number'])
    
    if hasattr(instance, 'consultancy_profile'):
        profile = instance.consultancy_profile
        if profile.phone_number != instance.phone:
            profile.phone_number = instance.phone
            profile.save(update_fields=['phone_number'])
    
    if hasattr(instance, 'candidate_profile'):
        profile = instance.candidate_profile
        if profile.phone_number != instance.phone:
            profile.phone_number = instance.phone
            profile.save(update_fields=['phone_number'])
