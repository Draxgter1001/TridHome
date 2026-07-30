from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsOwner

from .filters import ListingFilter
from .models import Listing
from .serializers import (
    ListingCreateSerializer,
    ListingDetailSerializer,
    ListingListSerializer,
)


class ListingViewSet(viewsets.ModelViewSet):
    queryset = (
        Listing.objects.filter(is_published=True)
        .select_related("owner__agency_profile")
        .prefetch_related("images")
    )
    filterset_class = ListingFilter
    search_fields = ["title", "description", "address", "county", "province"]
    ordering_fields = ["price", "surface", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ListingListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ListingCreateSerializer
        return ListingDetailSerializer

    def get_permissions(self):
        if self.action in ("create",):
            return [permissions.IsAuthenticated()]
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsOwner()]
        return [permissions.AllowAny()]
