from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import JobPost, Bid, DirectApplication, SavedJob

# Admin site customization
admin.site.site_header = "Zyukthi Administration"
admin.site.site_title = "Zyukthi Admin Portal"
admin.site.index_title = "Welcome to Zyukthi Admin"

class JobPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'company_name', 'location', 'work_mode', 'job_type', 
                   'experience_level', 'is_published', 'posted_by_link', 'created_at')
    list_filter = ('work_mode', 'job_type', 'experience_level', 'is_published', 'created_at')
    search_fields = ('title', 'company_name', 'location', 'description', 'skills_required')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('title', 'company_name', 'posted_by')}),
        ('Company Details', {'fields': ('company_website', 'company_email', 'company_logo')}),
        ('Job Details', {'fields': ('location', 'work_mode', 'job_type', 'experience_level', 'industry')}),
        ('Salary Information', {'fields': ('min_salary', 'max_salary', 'currency', 'salary_type')}),
        ('Job Description', {'fields': ('description', 'requirements', 'responsibilities', 'skills_required')}),
        ('Additional Info', {'fields': ('deadline', 'vacancies', 'is_published')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

    def posted_by_link(self, obj):
        url = reverse('admin:accounts_user_change', args=[obj.posted_by.id])
        return format_html('<a href="{}">{}</a>', url, obj.posted_by.email)
    posted_by_link.short_description = 'Posted By'

class BidAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'consultancy_name', 'fee', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('job__title', 'consultancy__consultancy_name', 'proposal')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('job', 'consultancy')}),
        ('Bid Details', {'fields': ('proposal', 'fee', 'status')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

    def job_title(self, obj):
        return obj.job.title
    job_title.short_description = 'Job'

    def consultancy_name(self, obj):
        return obj.consultancy.consultancy_name
    consultancy_name.short_description = 'Consultancy'

class DirectApplicationAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'candidate_name', 'status', 'applied_at', 'resume_link')
    list_filter = ('status', 'applied_at')
    search_fields = ('job__title', 'candidate__user__name', 'cover_letter')
    readonly_fields = ('applied_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('job', 'candidate')}),
        ('Application Details', {'fields': ('resume', 'cover_letter', 'status')}),
        ('Timestamps', {'fields': ('applied_at', 'updated_at')}),
    )

    def job_title(self, obj):
        return obj.job.title
    job_title.short_description = 'Job'

    def candidate_name(self, obj):
        return obj.candidate.user.name
    candidate_name.short_description = 'Candidate'

    def resume_link(self, obj):
        if obj.resume:
            return format_html('<a href="{}" target="_blank">View Resume</a>', obj.resume)
        return '-'
    resume_link.short_description = 'Resume'

class SavedJobAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'candidate_name', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('job__title', 'candidate__user__name')
    readonly_fields = ('created_at',)
    fieldsets = (
        (None, {'fields': ('job', 'candidate')}),
        ('Timestamps', {'fields': ('created_at',)}),
    )

    def job_title(self, obj):
        return obj.job.title
    job_title.short_description = 'Job'

    def candidate_name(self, obj):
        return obj.candidate.user.name
    candidate_name.short_description = 'Candidate'

# Register models with their admin classes
admin.site.register(JobPost, JobPostAdmin)
admin.site.register(Bid, BidAdmin)
admin.site.register(DirectApplication, DirectApplicationAdmin)
admin.site.register(SavedJob, SavedJobAdmin)
