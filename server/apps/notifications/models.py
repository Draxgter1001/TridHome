from django.db import models


class Notification(models.Model):
    class Kind(models.TextChoices):
        VISIT_REQUESTED = "visit_requested", "Nuova richiesta di visita"
        VISIT_APPROVED = "visit_approved", "Visita confermata"
        VISIT_DENIED = "visit_denied", "Visita rifiutata"
        VERIFICATION = "verification", "Verifica documenti"

    recipient = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    kind = models.CharField(max_length=30, choices=Kind.choices)
    payload = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
