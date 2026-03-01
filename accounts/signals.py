from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, CandidateProfile, Education, Experience, EmployerProfile, ConsultancyProfile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.user_type == 'employer':
            EmployerProfile.objects.create(user=instance)
        elif instance.user_type == 'consultancy':
            ConsultancyProfile.objects.create(user=instance)
        elif instance.user_type == 'candidate':
            # Create the candidate profile first
            candidate_profile = CandidateProfile.objects.create(user=instance)
            
            # Create empty education record
            Education.objects.create(
                user=instance,
                school_name="",
                degree="",
                field_of_study=""
            )
            
            # Create empty experience record
            Experience.objects.create(
                user=instance,
                company_name="",
                designation=""
            )

@receiver(post_save, sender=EmployerProfile)
def update_employer_registration_steps(sender, instance, **kwargs):
    instance.user.update_registration_steps()

@receiver(post_save, sender=ConsultancyProfile)
def update_consultancy_registration_steps(sender, instance, **kwargs):
    instance.user.update_registration_steps()

@receiver(post_save, sender=CandidateProfile)
def update_candidate_registration_steps(sender, instance, **kwargs):
    instance.user.update_registration_steps()

@receiver(post_save, sender=Education)
def update_education_registration_steps(sender, instance, **kwargs):
    instance.user.update_registration_steps()

@receiver(post_save, sender=Experience)
def update_experience_registration_steps(sender, instance, **kwargs):
    instance.user.update_registration_steps()