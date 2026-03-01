from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import User
from accounts.models import EmployerProfile, ConsultancyProfile, CandidateProfile
from django.core.exceptions import ValidationError

User = get_user_model()

class JobPost(models.Model):
    JOB_TYPE_CHOICES = [
        ('full-time', 'Full-Time'),
        ('part-time', 'Part-Time'),
        ('freelance', 'Freelance'),
        ('internship', 'Internship'),
        ('contract', 'Contract'),
        ('temporary', 'Temporary'),
    ]

    EXPERIENCE_LEVEL_CHOICES = [
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('director', 'Director'),
        ('executive', 'Executive'),
        ('lead', 'Lead'),
        ('manager', 'Manager'),
        ('intern', 'Intern'),
    ]

    WORK_MODE_CHOICES = [
        ('remote', 'Remote'),
        ('onsite', 'On-site'),
        ('hybrid', 'Hybrid'),
    ]

    title = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200)
    company_website = models.URLField(blank=True, null=True)
    company_email = models.EmailField(blank=True, null=True)
    company_logo = models.URLField(blank=True, null=True)

    location = models.CharField(max_length=255)
    work_mode = models.CharField(max_length=10, choices=WORK_MODE_CHOICES, default='onsite')

    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES)
    industry = models.CharField(max_length=100, blank=True, null=True)

    min_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    max_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=10, default='INR')  # or USD, EUR, etc.
    salary_type = models.CharField(
        max_length=20,
        choices=[('monthly', 'Monthly'), ('yearly', 'Yearly'), ('hourly', 'Hourly')],
        default='monthly'
    )
    
    bid_budget = models.PositiveIntegerField(default=1)
    bid_candidates = models.PositiveIntegerField(default=1)

    description = models.TextField()
    requirements = models.TextField(blank=True, null=True)
    responsibilities = models.TextField(blank=True, null=True)
    skills_required = models.TextField(help_text="Comma-separated skills", blank=True, null=True)

    deadline = models.DateField(blank=True, null=True)
    vacancies = models.PositiveIntegerField(default=1)

    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_posts')
    is_published = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} at {self.company_name}"

class Bid(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    agreement_id = models.CharField(max_length=20, unique=True, editable=False, null=True, blank=True)
    agreement_pdf_url = models.URLField(blank=True, null=True)
    job = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name='bids')
    consultancy = models.ForeignKey(ConsultancyProfile, on_delete=models.CASCADE, related_name='bids')
    proposal = models.TextField()
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['job', 'consultancy', 'proposal'],
                name='unique_bid_proposal'
            )
        ]
    
    def generate_agreement_id(self):
        import random
        import string
        
        # Get the last bid's ID or start from 1
        last_bid = Bid.objects.order_by('-id').first()
        last_id = last_bid.id if last_bid else 0
        
        # Generate a random string of 4 characters (2 letters, 2 numbers)
        letters = ''.join(random.choices(string.ascii_uppercase, k=2))
        numbers = ''.join(random.choices(string.digits, k=2))
        random_part = f"{letters}{numbers}"
        
        # Combine with the ID to ensure uniqueness and minimum 10 digits
        return f"BID{last_id + 1:06d}{random_part}"
    
    def clean(self):
        # Check if consultancy already has 3 bids for this job
        existing_bids = Bid.objects.filter(
            job=self.job, 
            consultancy=self.consultancy
        ).exclude(pk=self.pk)  # Exclude current instance if updating
        
        if existing_bids.count() >= 3:
            raise ValidationError("A consultancy can only submit 3 bids per job")
        
        # Check if this proposal is already submitted by this consultancy
        if Bid.objects.filter(
            job=self.job,
            consultancy=self.consultancy,
            proposal=self.proposal
        ).exclude(pk=self.pk).exists():
            raise ValidationError("You have already submitted this proposal for this job")
    
    def save(self, *args, **kwargs):
        if not self.agreement_id:
            self.agreement_id = self.generate_agreement_id()
        self.full_clean()  # Runs clean() validation
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.consultancy.name if hasattr(self.consultancy, 'name') else 'Unknown'} - {self.job.title}"


class CandidateSubmission(models.Model):
    bid = models.ForeignKey(Bid, on_delete=models.CASCADE, related_name='candidate_submissions')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.bid.consultancy.name if hasattr(self.bid.consultancy, 'name') else 'Unknown'} - {self.bid.job.title}"

class Resume(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('shortlisted', 'Shortlisted'),
        ('assessment', 'Assessment'),
        ('phone_screen', 'Phone Screen'),
        ('interview', 'Interview Scheduled'),
        ('technical_interview', 'Technical Interview'),
        ('l1_interview', 'L1 Interview'),
        ('l2_interview', 'L2 Interview'),
        ('l3_interview', 'L3 Interview'),
        ('hr_interview', 'HR Interview'),
        ('reference_check', 'Reference Check'),
        ('background_check', 'Background Check'),
        ('offer_pending', 'Offer Pending'),
        ('offer_extended', 'Offer Extended'),
        ('offer_accepted', 'Offer Accepted'),
        ('offer_declined', 'Offer Declined'),
        ('onboarding', 'Onboarding'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
        ('on_hold', 'On Hold'),
    ]
    
    candidate_submission = models.ForeignKey(
        CandidateSubmission, 
        on_delete=models.CASCADE,
        related_name='resumes'
    )
    name = models.CharField(max_length=200, default='')
    resume = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True, null=True, help_text="Reason for rejection if status is rejected")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.resume

class DirectApplication(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('under_review', 'Under Review'),
        ('shortlisted', 'Shortlisted'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interview_completed', 'Interview Completed'),
        ('offer_made', 'Offer Made'),
        ('offer_accepted', 'Offer Accepted'),
        ('offer_declined', 'Offer Declined'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn by Candidate'),
        ('on_hold', 'On Hold'),
        ('hired', 'Hired'),
        ('pending', 'Pending'),
    ]
    
    job = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE, related_name='applications')
    resume = models.URLField(blank=True, null=True)
    cover_letter = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    rejection_reason = models.TextField(blank=True, null=True, help_text="Reason for rejection if status is rejected")
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('job', 'candidate')
    
    def __str__(self):
        return f"{self.candidate.user.name} - {self.job.title}"

class SavedJob(models.Model):
    job = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name='saved_jobs')
    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE, related_name='saved_jobs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job', 'candidate')

    def __str__(self):
        return f"{self.candidate.user.name} - {self.job.title}"
