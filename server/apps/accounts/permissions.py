from rest_framework.permissions import BasePermission


class IsAgency(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "agency"


class IsVerified(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_verified


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return getattr(obj, "owner_id", getattr(obj, "user_id", None)) == request.user.id
