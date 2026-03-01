from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'  # Replace with your actual app name

    def ready(self):
        import accounts.signals  # Make sure to match your app name here
