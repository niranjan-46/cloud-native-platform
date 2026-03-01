from rest_framework import permissions

class IsEmployerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow employers to modify their own job posts.
    """
    def has_permission(self, request, view):
        # Allow read-only access for all users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if user is an employer
        return hasattr(request.user, 'employer_profile')

    def has_object_permission(self, request, view, obj):
        # Allow read-only access for all users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if the job post belongs to the employer
        return obj.posted_by == request.user

class IsCandidateOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow candidates to view and apply to jobs.
    """
    def has_permission(self, request, view):
        # Allow read-only access for all users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if user is a candidate
        return hasattr(request.user, 'candidate_profile')

class IsConsultancyOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow consultancies to view jobs and place bids.
    """
    def has_permission(self, request, view):
        # Allow read-only access for all users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if user is a consultancy
        return hasattr(request.user, 'consultancy_profile') 