from django.db import models


class FeedbackSubmission(models.Model):
    """Entry pop-up responses; export with `manage.py export_feedback`."""

    user = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL
    )
    text = models.TextField()
    page = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
