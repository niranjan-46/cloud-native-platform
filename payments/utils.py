from .models import Payment
from jobs.models import Bid, JobPost
from django.conf import settings
from django.core.mail import send_mail, EmailMessage
from accounts.models import User
from django.utils import timezone
from threading import Thread
from datetime import datetime
from accounts.models import User, EmployerProfile, ConsultancyProfile
import tempfile
from django.template.loader import render_to_string
from django.contrib.auth import django_apps
import os

def _get_weasyprint_html():
    # Lazy import avoids crashing startup/management commands on machines
    # missing WeasyPrint native libraries.
    from weasyprint import HTML
    return HTML

def generate_pdf_receipt(payment):
    """
    Generate a PDF receipt for the payment
    """
    html_string = render_to_string('payments/receipt_pdf.html', {
        'payment': payment
    })
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as output:
        # Generate PDF with no sandbox option
        HTML = _get_weasyprint_html()
        HTML(string=html_string).write_pdf(output.name, sandbox=False)
        return output.name

def send_payment_receipt_email(payment):
    """
    Send payment receipt email with PDF attachment
    """
    try:
        # Generate PDF receipt
        pdf_path = generate_pdf_receipt(payment)
        
        # Prepare email content
        email_html = render_to_string('payments/payment_email.html', {
            'payment': payment
        })
        
        # Create email message
        email = EmailMessage(
            subject=f'Payment Receipt - {payment.order_id}',
            body=email_html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[payment.user.email],
        )
        
        # Set content type to HTML
        email.content_subtype = "html"
        
        # Attach PDF
        with open(pdf_path, 'rb') as pdf_file:
            email.attach(
                f'payment_receipt_{payment.order_id}.pdf',
                pdf_file.read(),
                'application/pdf'
            )
        
        # Send email
        email.send(fail_silently=False)
        
        # Clean up temporary PDF file
        os.unlink(pdf_path)
        
        return True
    except Exception as e:
        print(f"Error sending payment receipt email: {str(e)}")
        return False

def send_payment_receipt_email_async(payment):
    """
    Send payment receipt email asynchronously
    """
    thread = Thread(target=send_payment_receipt_email, args=(payment,))
    thread.start()

