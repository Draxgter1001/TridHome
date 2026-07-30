from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import AgencyProfile, PrivateProfile, User


class AgencyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyProfile
        fields = [
            "official_name", "vat_number", "office_address", "opening_hours",
            "website", "social_links", "bio", "logo",
        ]


class UserSerializer(serializers.ModelSerializer):
    agency_profile = AgencyProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "role", "phone",
            "is_verified", "avatar", "agency_profile", "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "is_verified", "date_joined"]


class PublicUserSerializer(serializers.ModelSerializer):
    """What other visitors see on a listing / profile page."""
    agency_profile = AgencyProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "role", "is_verified",
                  "avatar", "agency_profile", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    agency = AgencyProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "phone", "role", "agency"]

    def validate(self, attrs):
        if attrs.get("role") == User.Role.AGENCY and not attrs.get("agency"):
            raise serializers.ValidationError(
                {"agency": "I dati dell'agenzia sono obbligatori per un account agenzia."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        agency_data = validated_data.pop("agency", None)
        password = validated_data.pop("password")
        user = User(username=validated_data["email"], **validated_data)
        user.set_password(password)
        user.save()
        if user.role == User.Role.AGENCY:
            AgencyProfile.objects.create(user=user, **agency_data)
        else:
            PrivateProfile.objects.create(user=user)
        return user
