from django.urls import path, include
from help.views import HelpSupportView

urlpatterns = [
    path('help-support/', HelpSupportView.as_view(), name='help-support'),
]
