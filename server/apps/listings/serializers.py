from rest_framework import serializers

from apps.accounts.serializers import PublicUserSerializer

from .models import Listing, ListingImage


class ListingImageSerializer(serializers.ModelSerializer):
    url = serializers.ReadOnlyField()

    class Meta:
        model = ListingImage
        fields = ["id", "url", "sort_order"]


class ListingListSerializer(serializers.ModelSerializer):
    """Card view for the search grid."""

    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id", "title", "advert_code", "category", "typology", "contract",
            "price", "surface", "n_rooms", "province", "county", "primary_image",
            "created_at",
        ]

    def get_primary_image(self, obj):
        first = obj.images.first()
        return first.url if first else None


class ListingDetailSerializer(serializers.ModelSerializer):
    """Full detail: replaces legacy triple fetch (property + advert + owner)."""

    images = ListingImageSerializer(many=True, read_only=True)
    owner = PublicUserSerializer(read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id", "title", "description", "advert_code", "owner",
            "province", "county", "post_code", "address", "lat", "lng",
            "category", "typology", "contract", "price", "surface",
            "n_rooms", "floor_level", "images", "created_at", "updated_at",
        ]


class ListingCreateSerializer(serializers.ModelSerializer):
    image_urls = serializers.ListField(
        child=serializers.URLField(), write_only=True, required=False
    )

    class Meta:
        model = Listing
        fields = [
            "id", "title", "description", "province", "county", "post_code",
            "address", "lat", "lng", "category", "typology", "contract",
            "price", "surface", "n_rooms", "floor_level", "image_urls",
            "advert_code",
        ]
        read_only_fields = ["id", "advert_code"]

    def create(self, validated_data):
        image_urls = validated_data.pop("image_urls", [])
        listing = Listing.objects.create(owner=self.context["request"].user, **validated_data)
        for i, url in enumerate(image_urls):
            ListingImage.objects.create(listing=listing, external_url=url, sort_order=i)
        return listing
