from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import AgencyProfile, PrivateProfile, User, VerificationDocument


@admin.register(User)
class TridUserAdmin(UserAdmin):
    list_display = ("email", "role", "is_verified", "is_staff")
    list_filter = ("role", "is_verified")
    fieldsets = UserAdmin.fieldsets + (
        ("TridHome", {"fields": ("role", "phone", "is_verified", "avatar", "google_sub")}),
    )


@admin.register(VerificationDocument)
class VerificationDocumentAdmin(admin.ModelAdmin):
    list_display = ("user", "doc_type", "status", "uploaded_at")
    list_filter = ("status", "doc_type")
    actions = ["approve", "reject"]

    @admin.action(description="Approva documenti selezionati")
    def approve(self, request, queryset):
        from django.utils import timezone
        for doc in queryset:
            doc.status = doc.Status.APPROVED
            doc.reviewed_by = request.user
            doc.reviewed_at = timezone.now()
            doc.save()

    @admin.action(description="Rifiuta documenti selezionati")
    def reject(self, request, queryset):
        from django.utils import timezone
        queryset.update(status=VerificationDocument.Status.REJECTED,
                        reviewed_by=request.user, reviewed_at=timezone.now())


admin.site.register(PrivateProfile)
admin.site.register(AgencyProfile)
