from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import User, EmployerProfile, ConsultancyProfile, CandidateProfile, Education, Experience

# Admin site customization
admin.site.site_header = "Zyukthi Administration"
admin.site.site_title = "Zyukthi Admin Portal"
admin.site.index_title = "Welcome to Zyukthi Admin"

class EducationInline(admin.TabularInline):
    model = Education
    extra = 0
    fields = ('education_type', 'school_name', 'degree', 'field_of_study', 'start_date', 'end_date', 'grade')
    readonly_fields = ('created_at', 'updated_at')
    classes = ('collapse',)

class ExperienceInline(admin.TabularInline):
    model = Experience
    extra = 0
    fields = ('company_name', 'designation', 'job_type', 'location', 'currently_working', 'start_date', 'end_date')
    readonly_fields = ('created_at', 'updated_at')
    classes = ('collapse',)

class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'phone', 'user_type', 'is_staff', 'is_active', 'is_email_verified', 
                   'is_phone_verified', 'is_verified', 'is_suspended', 'is_deleted', 'registration_status')
    list_filter = ('user_type', 'is_staff', 'is_active', 'is_email_verified', 'is_phone_verified', 
                  'is_verified', 'is_suspended', 'is_deleted', 'registration_step')
    search_fields = ('email', 'name', 'phone')
    ordering = ('-date_joined',)
    actions = ['approve_users', 'reject_users', 'suspend_users', 'unsuspend_users', 'verify_email', 'verify_phone']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'phone', 'user_type')}),
        ('Verification Status', {'fields': ('is_email_verified', 'is_phone_verified', 'is_verified')}),
        ('Account Status', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_suspended', 'is_deleted')}),
        ('Registration Progress', {'fields': ('registration_step', 'completed_steps')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'phone', 'user_type', 'password1', 'password2'),
        }),
    )

    def get_inlines(self, request, obj=None):
        if obj and obj.user_type == 'candidate':
            return [EducationInline, ExperienceInline]
        return []

    def registration_status(self, obj):
        if obj.completed_steps:
            return format_html('<span style="color: green;">✓ Complete</span>')
        return format_html('<span style="color: orange;">⚠ In Progress ({}/7)</span>', obj.registration_step)
    registration_status.short_description = 'Registration Status'

    # Custom actions
    def approve_users(self, request, queryset):
        updated = queryset.update(is_verified=True, is_active=True)
        self.message_user(request, f"{updated} users approved successfully.")
    approve_users.short_description = "Approve selected users"

    def reject_users(self, request, queryset):
        updated = queryset.update(is_verified=False, is_active=False)
        self.message_user(request, f"{updated} users rejected.")
    reject_users.short_description = "Reject selected users"

    def suspend_users(self, request, queryset):
        updated = queryset.update(is_suspended=True)
        self.message_user(request, f"{updated} users suspended.")
    suspend_users.short_description = "Suspend selected users"

    def unsuspend_users(self, request, queryset):
        updated = queryset.update(is_suspended=False)
        self.message_user(request, f"{updated} users unsuspended.")
    unsuspend_users.short_description = "Unsuspend selected users"

    def verify_email(self, request, queryset):
        updated = queryset.update(is_email_verified=True)
        self.message_user(request, f"{updated} users email verified.")
    verify_email.short_description = "Mark email as verified"

    def verify_phone(self, request, queryset):
        updated = queryset.update(is_phone_verified=True)
        self.message_user(request, f"{updated} users phone verified.")
    verify_phone.short_description = "Mark phone as verified"

class EmployerProfileAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'user_link', 'designation', 'industry', 'company_size', 
                    'application_status', 'document_status', 'view_documents')
    list_filter = ('application_status', 'industry', 'company_size')
    search_fields = ('company_name', 'user__email', 'user__name', 'designation')
    readonly_fields = ('user_link', 'view_documents')
    actions = ['approve_applications', 'reject_applications']
    
    fieldsets = (
        (None, {'fields': ('user_link', 'company_name', 'designation')}),
        ('Company Info', {'fields': ('industry', 'company_size', 'company_address', 'website_url', 'phone_number')}),
        ('Documents', {'fields': ('msme_or_incorporation_certificate', 'gstin_certificate', 'pan_card', 'poc_document')}),
        ('Status', {'fields': ('application_status',)}),
    )

    def user_link(self, obj):
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'

    def document_status(self, obj):
        docs = [
            obj.msme_or_incorporation_certificate,
            obj.gstin_certificate,
            obj.pan_card,
            obj.poc_document
        ]
        uploaded = sum(1 for doc in docs if doc)
        color = 'green' if uploaded == 4 else 'red' if uploaded == 0 else 'orange'
        return format_html('<span style="color: {};">{}/4 Documents</span>', color, uploaded)
    document_status.short_description = 'Documents Uploaded'

    def view_documents(self, obj):
        links = []
        if obj.msme_or_incorporation_certificate:
            links.append(f'<a href="{obj.msme_or_incorporation_certificate}" target="_blank">MSME</a>')
        if obj.gstin_certificate:
            links.append(f'<a href="{obj.gstin_certificate}" target="_blank">GSTIN</a>')
        if obj.pan_card:
            links.append(f'<a href="{obj.pan_card}" target="_blank">PAN</a>')
        if obj.poc_document:
            links.append(f'<a href="{obj.poc_document}" target="_blank">POC</a>')
        return mark_safe(', '.join(links)) if links else 'No documents'
    view_documents.short_description = 'Documents'

    def approve_applications(self, request, queryset):
        queryset.update(application_status='approved')
        for profile in queryset:
            profile.user.is_verified = True
            profile.user.save()
        self.message_user(request, f"{queryset.count()} applications approved.")
    approve_applications.short_description = "Approve selected applications"

    def reject_applications(self, request, queryset):
        queryset.update(application_status='rejected')
        for profile in queryset:
            profile.user.is_verified = False
            profile.user.save()
        self.message_user(request, f"{queryset.count()} applications rejected.")
    reject_applications.short_description = "Reject selected applications"

class ConsultancyProfileAdmin(admin.ModelAdmin):
    list_display = ('consultancy_name', 'user_link', 'specialization', 'experience_years', 
                    'consultancy_size', 'application_status', 'document_status', 'view_documents')
    list_filter = ('application_status', 'specialization', 'consultancy_size')
    search_fields = ('consultancy_name', 'user__email', 'user__name', 'specialization')
    readonly_fields = ('user_link', 'view_documents')
    actions = ['approve_applications', 'reject_applications']
    
    fieldsets = (
        (None, {'fields': ('user_link', 'consultancy_name', 'specialization')}),
        ('Consultancy Info', {'fields': ('experience_years', 'office_address', 'website', 'consultancy_size', 'phone_number')}),
        ('Documents', {'fields': ('msme_or_incorporation_certificate', 'gstin_certificate', 'pan_card', 'poc_document')}),
        ('Status', {'fields': ('application_status',)}),
    )

    def user_link(self, obj):
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'

    def document_status(self, obj):
        docs = [
            obj.msme_or_incorporation_certificate,
            obj.gstin_certificate,
            obj.pan_card,
            obj.poc_document
        ]
        uploaded = sum(1 for doc in docs if doc)
        color = 'green' if uploaded == 4 else 'red' if uploaded == 0 else 'orange'
        return format_html('<span style="color: {};">{}/4 Documents</span>', color, uploaded)
    document_status.short_description = 'Documents Uploaded'

    def view_documents(self, obj):
        links = []
        if obj.msme_or_incorporation_certificate:
            links.append(f'<a href="{obj.msme_or_incorporation_certificate}" target="_blank">MSME</a>')
        if obj.gstin_certificate:
            links.append(f'<a href="{obj.gstin_certificate}" target="_blank">GSTIN</a>')
        if obj.pan_card:
            links.append(f'<a href="{obj.pan_card}" target="_blank">PAN</a>')
        if obj.poc_document:
            links.append(f'<a href="{obj.poc_document}" target="_blank">POC</a>')
        return mark_safe(', '.join(links)) if links else 'No documents'
    view_documents.short_description = 'Documents'

    def approve_applications(self, request, queryset):
        queryset.update(application_status='approved')
        for profile in queryset:
            profile.user.is_verified = True
            profile.user.save()
        self.message_user(request, f"{queryset.count()} applications approved.")
    approve_applications.short_description = "Approve selected applications"

    def reject_applications(self, request, queryset):
        queryset.update(application_status='rejected')
        for profile in queryset:
            profile.user.is_verified = False
            profile.user.save()
        self.message_user(request, f"{queryset.count()} applications rejected.")
    reject_applications.short_description = "Reject selected applications"

class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('user_link', 'gender', 'city', 'preferenced_city', 'application_status', 
                    'resume_status', 'view_documents', 'view_education_experience')
    list_filter = ('application_status', 'gender', 'city')
    search_fields = ('user__email', 'user__name', 'city', 'preferenced_city')
    readonly_fields = ('user_link', 'view_documents')
    actions = ['approve_applications', 'reject_applications']
    
    fieldsets = (
        (None, {'fields': ('user_link', 'gender', 'city', 'preferenced_city')}),
        ('Professional Info', {'fields': ('skills', 'portfolio_website', 'phone_number')}),
        ('Documents', {'fields': ('resume',)}),
        ('Status', {'fields': ('application_status',)}),
    )

    def user_link(self, obj):
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'

    def resume_status(self, obj):
        if obj.resume:
            return format_html('<span style="color: green;">✓ Uploaded</span> <a href="{}" target="_blank">(View)</a>', obj.resume)
        return format_html('<span style="color: red;">✗ Missing</span>')
    resume_status.short_description = 'Resume Status'

    def view_documents(self, obj):
        if obj.resume:
            return format_html('<a href="{}" target="_blank">View Resume</a>', obj.resume)
        return 'No resume'
    view_documents.short_description = 'Documents'

    def view_education_experience(self, obj):
        if obj.user:
            url = reverse('admin:accounts_user_change', args=[obj.user.id])
            return format_html('<a href="{}">View Details</a>', url)
        return '-'
    view_education_experience.short_description = 'Education & Experience'

    def approve_applications(self, request, queryset):
        queryset.update(application_status='approved')
        for profile in queryset:
            profile.user.is_verified = True
            profile.user.save()
        self.message_user(request, f"{queryset.count()} applications approved.")
    approve_applications.short_description = "Approve selected applications"

    def reject_applications(self, request, queryset):
        queryset.update(application_status='rejected')
        for profile in queryset:
            profile.user.is_verified = False
            profile.user.save()
        self.message_user(request, f"{queryset.count()} applications rejected.")
    reject_applications.short_description = "Reject selected applications"

class EducationAdmin(admin.ModelAdmin):
    list_display = ('user_link', 'education_type', 'school_name', 'degree', 'field_of_study', 'start_date', 'end_date')
    list_filter = ('education_type', 'start_date', 'end_date')
    search_fields = ('user__email', 'user__name', 'school_name', 'degree', 'field_of_study')
    readonly_fields = ('created_at', 'updated_at')
    
    def user_link(self, obj):
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'

class ExperienceAdmin(admin.ModelAdmin):
    list_display = ('user_link', 'company_name', 'designation', 'job_type', 'location', 'currently_working', 'start_date', 'end_date')
    list_filter = ('job_type', 'currently_working', 'start_date', 'end_date')
    search_fields = ('user__email', 'user__name', 'company_name', 'designation', 'location')
    readonly_fields = ('created_at', 'updated_at')
    
    def user_link(self, obj):
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'

# Register models with their admin classes
admin.site.register(User, UserAdmin)
admin.site.register(EmployerProfile, EmployerProfileAdmin)
admin.site.register(ConsultancyProfile, ConsultancyProfileAdmin)
admin.site.register(CandidateProfile, CandidateProfileAdmin)
admin.site.register(Education, EducationAdmin)
admin.site.register(Experience, ExperienceAdmin)