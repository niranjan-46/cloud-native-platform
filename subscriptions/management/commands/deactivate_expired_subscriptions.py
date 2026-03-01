# django/hirelink-api/subscriptions/management/commands/deactivate_expired_subscriptions.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from subscriptions.models import UserSubscription


"""
This command is used to deactivate expired user subscriptions.
 step 01. Run crontab -e
 step 02. Paste the appropriate line for your environment.
 step 03. Save and exit.
  #0 * * * * cd /media/mrx/projects/Hirelink/django/hirelink-api && /media/mrx/projects/Hirelink/django/hirelink-api/venv/bin/python manage.py deactivate_expired_subscriptions
    */3 * * * * cd /media/mrx/projects/Hirelink/django/hirelink-api && /media/mrx/projects/Hirelink/django/hirelink-api/venv/bin/python manage.py deactivate_expired_subscriptions
"""
class Command(BaseCommand):
    help = 'Deactivate expired user subscriptions'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        expired = UserSubscription.objects.filter(active=True, end_date__lt=now)
        count = expired.update(active=False)
        self.stdout.write(self.style.SUCCESS(f'Deactivated {count} expired subscriptions.'))