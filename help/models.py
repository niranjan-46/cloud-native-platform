from django.db import models
from accounts.models import User

class HelpSupport(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    screenshot1 = models.URLField(null=True, blank=True)
    screenshot2 = models.URLField(null=True, blank=True)
    screenshot3 = models.URLField(null=True, blank=True)
    screenshot4 = models.URLField(null=True, blank=True)
    screenshot5 = models.URLField(null=True, blank=True)
    
    
    status = models.CharField(max_length=255, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.subject