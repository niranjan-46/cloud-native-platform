from django.contrib.auth import django_apps
from django.template.loader import render_to_string
from django.http import HttpResponse
import tempfile
import os
from jobs.models import Bid, JobPost
from accounts.models import User, EmployerProfile, ConsultancyProfile
from datetime import datetime
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from threading import Thread
from core.gcs_upload import upload_path_to_gcs

def _get_weasyprint_html():
    # Lazy import avoids crashing startup/management commands on machines
    # missing WeasyPrint native libraries.
    from weasyprint import HTML
    return HTML


def generate_agreement_pdf(bid):
    bid = Bid.objects.get(id=bid)
    job = JobPost.objects.get(id=bid.job.id)
    employer = EmployerProfile.objects.get(user=bid.job.posted_by)
    consultancy = ConsultancyProfile.objects.get(id=bid.consultancy.id)
    
    # Generate agreement ID if not exists
    if not bid.agreement_id:
        bid.agreement_id = bid.generate_agreement_id()
        bid.save()
    
    # Prepare context for template
    context = {
        'agreement_id': bid.agreement_id,
        'current_date': datetime.now().strftime("%B %d, %Y"),
        'employer': employer,
        'consultancy': consultancy,
        'job': job,
        'bid': bid,
        'acceptance_date': datetime.now().strftime("%B %d, %Y"),
    }
    
    # Render HTML template
    html_string = render_to_string('bids/employer_consultancy_agreement.html', context)
    
    # Create PDF
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        HTML = _get_weasyprint_html()
        HTML(string=html_string).write_pdf(temp_file.name)
        

        
        upload_result = upload_path_to_gcs(
            temp_file.name,
            folder="agreements",
            filename=f"{bid.agreement_id}.pdf",
            content_type="application/pdf",
        )
        
        # Update bid with PDF URL
        bid.agreement_pdf_url = upload_result['secure_url']
        bid.save()
        
        # Send email to employer
        Thread(target=send_employer_agreement_email, args=(bid.id,)).start()
        
        # Send email to consultancy
        Thread(target=send_consultancy_agreement_email, args=(bid.id,)).start()
        
        try:
            os.unlink(temp_file.name)
        except OSError:
            pass

        return bid.agreement_pdf_url
    
    
    

def send_employer_agreement_email(bid):
    """
    Send agreement email to employer
    """
    try:
        bid = Bid.objects.get(id=bid)
        job = JobPost.objects.get(id=bid.job.id)
        employer = EmployerProfile.objects.get(user=bid.job.posted_by)
        consultancy = ConsultancyProfile.objects.get(id=bid.consultancy.id)
        
        context = {
            'employer': employer,
            'consultancy': consultancy,
            'job': job,
            'bid': bid,
            'agreement_id': bid.agreement_id,
            'current_year': timezone.now().year
        }
        
        # Render email template
        html_message = render_to_string('bids/emails/employer_agreement_email.html', context)
        
        # Send email
        send_mail(
            subject=f'Employment Recruitment Agreement - {bid.agreement_id}',
            message='',  # Plain text version (empty as we're using HTML)
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[employer.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
    except Exception as e:
        print(f"Error sending employer agreement email: {str(e)}")
        return False

def send_consultancy_agreement_email(bid):
    """
    Send agreement email to consultancy
    """
    try:
        bid = Bid.objects.get(id=bid)
        job = JobPost.objects.get(id=bid.job.id)
        employer = EmployerProfile.objects.get(user=bid.job.posted_by)
        consultancy = ConsultancyProfile.objects.get(id=bid.consultancy.id)
        
        context = {
            'employer': employer,
            'consultancy': consultancy,
            'job': job,
            'bid': bid,
            'agreement_id': bid.agreement_id,
            'current_year': timezone.now().year
        }
        
        # Render email template
        html_message = render_to_string('bids/emails/consultancy_agreement_email.html', context)
        
        # Send email
        send_mail(
            subject=f'Employment Recruitment Agreement - {bid.agreement_id}',
            message='',  # Plain text version (empty as we're using HTML)
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[consultancy.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
    except Exception as e:
        print(f"Error sending consultancy agreement email: {str(e)}")
        return False

def send_employer_reject_bid_email(bid):
    """
    Send bid rejection notification to employer
    """
    try:
        bid = Bid.objects.get(id=bid)
        job = JobPost.objects.get(id=bid.job.id)
        employer = EmployerProfile.objects.get(user=bid.job.posted_by)
        consultancy = ConsultancyProfile.objects.get(id=bid.consultancy.id)
        
        context = {
            'employer': employer,
            'consultancy': consultancy,
            'job': job,
            'bid': bid,
            'current_year': timezone.now().year
        }
        
        # Render email template
        html_message = render_to_string('bids/emails/employer_reject_bid_email.html', context)
        
        # Send email
        send_mail(
            subject=f'Bid Rejection Notification - {job.title}',
            message='',  # Plain text version (empty as we're using HTML)
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[employer.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
    except Exception as e:
        print(f"Error sending employer rejection email: {str(e)}")
        return False

def send_consultancy_reject_bid_email(bid):
    """
    Send bid rejection notification to consultancy
    """
    try:
        bid = Bid.objects.get(id=bid)
        job = JobPost.objects.get(id=bid.job.id)
        employer = EmployerProfile.objects.get(user=bid.job.posted_by)
        consultancy = ConsultancyProfile.objects.get(id=bid.consultancy.id)
        
        context = {
            'employer': employer,
            'consultancy': consultancy,
            'job': job,
            'bid': bid,
            'current_year': timezone.now().year
        }
        
        # Render email template
        html_message = render_to_string('bids/emails/consultancy_reject_bid_email.html', context)
        
        # Send email
        send_mail(
            subject=f'Bid Rejection Notification - {job.title}',
            message='',  # Plain text version (empty as we're using HTML)
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[consultancy.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
    except Exception as e:
        print(f"Error sending consultancy rejection email: {str(e)}")
        return False
    
    
    
