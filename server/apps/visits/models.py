from django.db import models


class AvailabilitySlot(models.Model):
    """Seller-declared window when the property can be visited."""

    listing = models.ForeignKey(
        "listings.Listing", on_delete=models.CASCADE, related_name="availability_slots"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        unique_together = [("listing", "date", "start_time")]
        ordering = ["date", "start_time"]

    def __str__(self):
        return f"{self.listing_id} {self.date} {self.start_time}"

    @property
    def is_booked(self) -> bool:
        return self.requests.filter(status=VisitRequest.Status.APPROVED).exists()


class VisitRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "In attesa"
        APPROVED = "approved", "Confermata"
        DENIED = "denied", "Rifiutata"
        CANCELLED = "cancelled", "Annullata"

    slot = models.ForeignKey(
        AvailabilitySlot, on_delete=models.CASCADE, related_name="requests"
    )
    buyer = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="visit_requests"
    )
    message = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    decided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["slot", "buyer"],
                condition=models.Q(status__in=["pending", "approved"]),
                name="uniq_active_request_per_slot_buyer",
            )
        ]
