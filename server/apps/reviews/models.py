from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Review(models.Model):
    """Stars + text on a seller (private or agency)."""

    target = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="reviews_received"
    )
    author = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="reviews_written"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("target", "author")]
        ordering = ["-created_at"]
