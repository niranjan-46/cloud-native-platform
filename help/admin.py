from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import HelpSupport

# Admin site customization
admin.site.site_header = "Zyukthi Administration"
admin.site.site_title = "Zyukthi Admin Portal"
admin.site.index_title = "Welcome to Zyukthi Admin"

class HelpSupportAdmin(admin.ModelAdmin):
    list_display = ('subject', 'user_link', 'status', 'created_at', 'view_screenshots')
    list_filter = ('status', 'created_at')
    search_fields = ('subject', 'message', 'user__email', 'user__name')
    readonly_fields = ('created_at', 'updated_at', 'view_screenshots')
    fieldsets = (
        (None, {'fields': ('user', 'subject', 'message')}),
        ('Screenshots', {'fields': ('screenshot1', 'screenshot2', 'screenshot3', 'screenshot4', 'screenshot5', 'view_screenshots')}),
        ('Status', {'fields': ('status',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    actions = ['mark_as_pending', 'mark_as_resolved', 'mark_as_closed']

    def user_link(self, obj):
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'

    def view_screenshots(self, obj):
        screenshots = []
        for i in range(1, 6):
            screenshot = getattr(obj, f'screenshot{i}')
            if screenshot:
                screenshots.append(f'<a href="{screenshot}" target="_blank">Screenshot {i}</a>')
        return format_html(', '.join(screenshots)) if screenshots else 'No screenshots'
    view_screenshots.short_description = 'Screenshots'

    def mark_as_pending(self, request, queryset):
        queryset.update(status='pending')
    mark_as_pending.short_description = "Mark selected tickets as pending"

    def mark_as_resolved(self, request, queryset):
        queryset.update(status='resolved')
    mark_as_resolved.short_description = "Mark selected tickets as resolved"

    def mark_as_closed(self, request, queryset):
        queryset.update(status='closed')
    mark_as_closed.short_description = "Mark selected tickets as closed"

# Register models with their admin classes
admin.site.register(HelpSupport, HelpSupportAdmin)
