from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
import random
from django.template.loader import render_to_string
import time


def send_password_reset_email(user, uid, token):
    context = {
        'reset_link': f"https://app.niranjan.cloud/reset-password/{uid}/{token}/",
        'recipient_name': user.name or user.email
    }
    subject = "Reset Your Password"
    message = f"""
    Hi {user.name or user.email},

    Please click the link below to reset your password:
    {context['reset_link']}

    If you didn't request this, you can ignore this email.
    """
    # Render the HTML template
    html_message = render_to_string('admin/accounts/emails/auto_email_reset_password_link.html', context)
    
    # Send the email
    send_mail(
        subject=subject,
        message=message,
        html_message=html_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

#health check
def health_check(request):
    return JsonResponse({'status': 'ok'}, status=200)



def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_via_email(email, otp, recipient_name="User"):
    subject = 'Zyukthi - Email Verification'
    
    # Ensure OTP is a string and has exactly 6 digits
    otp = str(otp).zfill(6)
    
    # Prepare context for the template
    context = {
        'otp': otp,
        'recipient_name': recipient_name
    }
    
    # Render the HTML template
    html_message = render_to_string('admin/accounts/emails/auto_email_otp.html', context)
    
    # Send the email
    send_mail(
        subject=subject,
        message=f'Your OTP verification code is: {otp}',
        html_message=html_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
