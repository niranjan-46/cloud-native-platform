from django.conf import settings
from django.utils import timezone
from django.db import models

DAYS_OF_WEEK = [
    ('monday', 'Monday'),
    ('tuesday', 'Tuesday'),
    ('wednesday', 'Wednesday'),
    ('thursday', 'Thursday'),
    ('friday', 'Friday'),
    ('saturday', 'Saturday'),
    ('sunday', 'Sunday'),
]

FREQUENCIES = [
    ('daily', 'Daily'),
    ('weekly', 'Weekly'),
    ('monthly', 'Monthly'),
]

class EmailPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    security_alerts = models.BooleanField(default=True)
    product_updates = models.BooleanField(default=True)
    newsletter = models.BooleanField(default=True)
    community_updates = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=True)
    job_alerts = models.BooleanField(default=True)
    job_alerts_frequency = models.CharField(max_length=20, choices=FREQUENCIES, default='daily')
    job_alerts_time = models.TimeField(default=timezone.now)
    job_alerts_day = models.CharField(max_length=20, choices=DAYS_OF_WEEK, default='monday')
    email_notifications = models.BooleanField(default=True)
    email_notifications_frequency = models.CharField(max_length=20, choices=FREQUENCIES, default='daily')
    email_notifications_time = models.TimeField(default=timezone.now)
    email_notifications_day = models.CharField(max_length=20, choices=DAYS_OF_WEEK, default='monday')
    

    def __str__(self):
        return f"{self.user.email} - {self.email_notifications_frequency}"
