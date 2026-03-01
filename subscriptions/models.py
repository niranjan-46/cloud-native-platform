# subscriptions/models.py
from django.db import models
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import sys

CURRENCY_CHOICES = [
    ('INR', 'Indian Rupee'),
    ('USD', 'US Dollar'),
    ('EUR', 'Euro'),
]

USER_TYPE_CHOICES = [
    ('employer', 'Employer'),
    ('consultancy', 'Consultancy'),
]

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    description = models.JSONField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES)
    user_type = models.CharField(max_length=15, choices=USER_TYPE_CHOICES)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.currency} {self.price})"

class UserSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    job_limit = models.BigIntegerField(default=0)
    bid_limit = models.BigIntegerField(default=0)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(blank=True, null=True)
    active = models.BooleanField(null=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user'], condition=Q(active=True), name='unique_active_subscription_per_user')
        ]
    
    def __str__(self):
        return f"{self.user} - {self.plan} - {'Active' if self.active else 'Inactive'}"

    def save(self, *args, **kwargs):
        # Only set limits from plan on creation
        if self._state.adding:
            description = getattr(self.plan, 'description', {}) or {}
            # Set job_limit
            job_posts = description.get('job_posts')
            if job_posts == 'unlimited':
                self.job_limit = sys.maxsize
            elif isinstance(job_posts, int):
                self.job_limit = job_posts
            # Set bid_limit
            consultancy_bids = description.get('consultancy_bids')
            if consultancy_bids == 'unlimited':
                self.bid_limit = sys.maxsize
            elif isinstance(consultancy_bids, int):
                self.bid_limit = consultancy_bids
        super().save(*args, **kwargs)


class UserSubscriptionPayments(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('created', 'Created'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('authorized', 'Authorized'),
        ('refunded', 'Refunded'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subscription = models.ForeignKey(UserSubscription, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES)
    
    order_id = models.CharField(max_length=100, blank=True, null=True)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    signature = models.CharField(max_length=100, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='created')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.subscription} - {self.amount} - {self.currency} - {self.status}"