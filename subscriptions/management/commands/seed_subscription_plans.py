from django.core.management.base import BaseCommand

from subscriptions.models import SubscriptionPlan


DEFAULT_PLANS = [
    {
        "name": "Starter",
        "user_type": "employer",
        "price": "1999.00",
        "currency": "INR",
        "description": {
            "job_posts": 5,
            "consultancy_bids": 30,
            "priority_support": False,
            "cv_database_access": False,
        },
    },
    {
        "name": "Growth",
        "user_type": "employer",
        "price": "4999.00",
        "currency": "INR",
        "description": {
            "job_posts": 20,
            "consultancy_bids": 120,
            "priority_support": True,
            "cv_database_access": True,
            "analytics_access": True,
        },
    },
    {
        "name": "Enterprise",
        "user_type": "employer",
        "price": "0.00",
        "currency": "INR",
        "description": {
            "job_posts": "unlimited",
            "consultancy_bids": "unlimited",
            "priority_support": True,
            "dedicated_account_manager": True,
            "cv_database_access": True,
            "analytics_access": True,
        },
    },
    {
        "name": "Basic",
        "user_type": "consultancy",
        "price": "1499.00",
        "currency": "INR",
        "description": {
            "consultancy_bids": 25,
            "candidate_management_dashboard": False,
            "priority_support": False,
        },
    },
    {
        "name": "Pro",
        "user_type": "consultancy",
        "price": "3999.00",
        "currency": "INR",
        "description": {
            "consultancy_bids": 100,
            "candidate_management_dashboard": True,
            "priority_support": True,
            "analytics_access": True,
        },
    },
    {
        "name": "Elite",
        "user_type": "consultancy",
        "price": "0.00",
        "currency": "INR",
        "description": {
            "consultancy_bids": "unlimited",
            "candidate_management_dashboard": True,
            "priority_support": True,
            "dedicated_account_manager": True,
            "analytics_access": True,
        },
    },
]


class Command(BaseCommand):
    help = "Seed default subscription plans for employer and consultancy."

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for plan in DEFAULT_PLANS:
            obj, is_created = SubscriptionPlan.objects.update_or_create(
                name=plan["name"],
                user_type=plan["user_type"],
                defaults={
                    "price": plan["price"],
                    "currency": plan["currency"],
                    "description": plan["description"],
                },
            )
            if is_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"Created: {obj.name} ({obj.user_type})"))
            else:
                updated += 1
                self.stdout.write(self.style.WARNING(f"Updated: {obj.name} ({obj.user_type})"))

        self.stdout.write(self.style.SUCCESS(f"Done. created={created}, updated={updated}"))
