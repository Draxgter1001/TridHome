from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.notifications.models import Notification

from .models import AvailabilitySlot, VisitRequest
from .serializers import SlotSerializer, VisitRequestSerializer


class SlotViewSet(viewsets.ModelViewSet):
    serializer_class = SlotSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = AvailabilitySlot.objects.select_related("listing").filter(
            date__gte=timezone.localdate()
        )
        listing_id = self.request.query_params.get("listing")
        if listing_id:
            qs = qs.filter(listing_id=listing_id)
        return qs

    def perform_destroy(self, instance):
        if instance.listing.owner_id != self.request.user.id:
            raise PermissionDenied("Puoi gestire solo i tuoi annunci.")
        instance.delete()


class VisitRequestViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VisitRequestSerializer

    def get_queryset(self):
        from django.db.models import Q

        user = self.request.user
        base = VisitRequest.objects.select_related("slot__listing", "buyer")
        if self.action != "list":
            # Detail actions: both parties can see the object;
            # _transition enforces who may act on it.
            return base.filter(Q(buyer=user) | Q(slot__listing__owner=user))
        role = self.request.query_params.get("role", "buyer")
        if role == "seller":
            return base.filter(slot__listing__owner=user)
        return base.filter(buyer=user)

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                req = serializer.save(buyer=self.request.user)
                Notification.objects.create(
                    recipient=req.slot.listing.owner,
                    kind=Notification.Kind.VISIT_REQUESTED,
                    payload={
                        "request_id": req.id,
                        "listing_id": req.slot.listing_id,
                        "listing_title": req.slot.listing.title,
                        "date": str(req.slot.date),
                        "start_time": str(req.slot.start_time),
                    },
                )
        except IntegrityError:
            raise ValidationError("Hai già una richiesta attiva per questo orario.")

    def _transition(self, req, new_status, actor_is_seller):
        user = self.request.user
        seller_id = req.slot.listing.owner_id
        if actor_is_seller and user.id != seller_id:
            raise PermissionDenied("Solo il venditore può decidere questa richiesta.")
        if not actor_is_seller and user.id != req.buyer_id:
            raise PermissionDenied("Solo chi ha prenotato può annullare la richiesta.")
        if req.status != VisitRequest.Status.PENDING:
            raise ValidationError("Questa richiesta è già stata decisa.")

        kind = {
            VisitRequest.Status.APPROVED: Notification.Kind.VISIT_APPROVED,
            VisitRequest.Status.DENIED: Notification.Kind.VISIT_DENIED,
        }.get(new_status)

        with transaction.atomic():
            req.status = new_status
            req.decided_at = timezone.now()
            req.save(update_fields=["status", "decided_at"])
            if kind:  # notify buyer on seller decision
                Notification.objects.create(
                    recipient=req.buyer,
                    kind=kind,
                    payload={
                        "request_id": req.id,
                        "listing_id": req.slot.listing_id,
                        "listing_title": req.slot.listing.title,
                        "date": str(req.slot.date),
                        "start_time": str(req.slot.start_time),
                    },
                )
        return Response(self.get_serializer(req).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._transition(self.get_object(), VisitRequest.Status.APPROVED, True)

    @action(detail=True, methods=["post"])
    def deny(self, request, pk=None):
        return self._transition(self.get_object(), VisitRequest.Status.DENIED, True)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        return self._transition(self.get_object(), VisitRequest.Status.CANCELLED, False)
