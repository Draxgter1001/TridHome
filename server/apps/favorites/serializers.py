from rest_framework import serializers

from apps.accounts.serializers import PublicUserSerializer
from apps.listings.serializers import ListingListSerializer

from .models import Favorite


class FavoriteSerializer(serializers.ModelSerializer):
    listing_detail = ListingListSerializer(source="listing", read_only=True)
    agency_detail = PublicUserSerializer(source="agency", read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "listing", "agency", "listing_detail", "agency_detail", "created_at"]
