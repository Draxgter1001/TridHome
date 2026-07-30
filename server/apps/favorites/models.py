from django.db import models


class Favorite(models.Model):
    """Heart on a listing OR an agency profile (exactly one)."""

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="favorites"
    )
    listing = models.ForeignKey(
        "listings.Listing", null=True, blank=True, on_delete=models.CASCADE,
        related_name="favorited_by",
    )
    agency = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.CASCADE,
        related_name="agency_favorited_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(listing__isnull=False, agency__isnull=True)
                    | models.Q(listing__isnull=True, agency__isnull=False)
                ),
                name="favorite_exactly_one_target",
            ),
            models.UniqueConstraint(
                fields=["user", "listing"], name="uniq_fav_listing",
                condition=models.Q(listing__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["user", "agency"], name="uniq_fav_agency",
                condition=models.Q(agency__isnull=False),
            ),
        ]
