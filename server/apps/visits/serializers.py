from django.utils import timezone
from rest_framework import serializers

from .models import AvailabilitySlot, VisitRequest


class SlotSerializer(serializers.ModelSerializer):
    is_booked = serializers.ReadOnlyField()

    class Meta:
        model = AvailabilitySlot
        fields = ["id", "listing", "date", "start_time", "end_time", "is_booked"]

    def validate(self, attrs):
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError("L'orario di fine deve seguire quello di inizio.")
        request = self.context["request"]
        if attrs["listing"].owner_id != request.user.id:
            raise serializers.ValidationError("Puoi gestire solo i tuoi annunci.")
        return attrs


class VisitRequestSerializer(serializers.ModelSerializer):
    slot_detail = SlotSerializer(source="slot", read_only=True)
    buyer_name = serializers.SerializerMethodField()
    listing_id = serializers.IntegerField(source="slot.listing_id", read_only=True)
    listing_title = serializers.CharField(source="slot.listing.title", read_only=True)

    class Meta:
        model = VisitRequest
        fields = [
            "id", "slot", "slot_detail", "message", "status",
            "buyer_name", "listing_id", "listing_title",
            "decided_at", "created_at",
        ]
        read_only_fields = ["status", "decided_at"]

    def get_buyer_name(self, obj):
        return f"{obj.buyer.first_name} {obj.buyer.last_name}".strip() or obj.buyer.email

    def validate_slot(self, slot):
        user = self.context["request"].user
        if slot.listing.owner_id == user.id:
            raise serializers.ValidationError("Non puoi prenotare una visita al tuo annuncio.")
        if slot.is_booked:
            raise serializers.ValidationError("Questo orario è già stato confermato per un'altra visita.")
        if slot.date < timezone.localdate():
            raise serializers.ValidationError("Questa data è già passata.")
        return slot
