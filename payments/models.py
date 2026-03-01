from django.db import models
from accounts.models import User
from jobs.models import JobPost, Bid


class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('created', 'Created'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('authorized', 'Authorized'),
        ('refunded', 'Refunded'),
    ]
        
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    bid = models.ForeignKey(Bid, on_delete=models.CASCADE)
    amount = models.FloatField()
    currency = models.CharField(max_length=10, default='INR')
    
    order_id = models.CharField(max_length=100, blank=True, null=True)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    signature = models.CharField(max_length=100, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='created')
    

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    

    def __str__(self):
        return f"{self.user.email} - ₹{self.amount} - {'Paid' if self.paid else 'Unpaid'}"





