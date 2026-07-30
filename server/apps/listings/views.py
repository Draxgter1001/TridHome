from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.permissions import IsOwner

from .filters import ListingFilter
from .models import Listing, ListingImage
from .serializers import (
    ListingCreateSerializer,
    ListingDetailSerializer,
    ListingImageSerializer,
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
        if self.action in ("create", "upload_image", "mine"):
            return [permissions.IsAuthenticated()]
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsOwner()]
        return [permissions.AllowAny()]

    @action(detail=False, methods=["get"])
    def mine(self, request):
        qs = self.get_queryset().filter(owner=request.user)
        return Response(ListingListSerializer(qs, many=True).data)

    @action(
        detail=True, methods=["post"],
        parser_classes=[MultiPartParser, FormParser],
        url_path="images",
    )
    def upload_image(self, request, pk=None):
        listing = self.get_object()
        if listing.owner_id != request.user.id:
            raise PermissionDenied("Puoi aggiungere foto solo ai tuoi annunci.")
        f = request.FILES.get("image")
        if not f:
            raise ValidationError("Nessun file 'image' ricevuto.")
        if f.size > 8 * 1024 * 1024:
            raise ValidationError("Ogni foto può pesare al massimo 8 MB.")
        if not (f.content_type or "").startswith("image/"):
            raise ValidationError("Il file deve essere un'immagine.")
        img = ListingImage.objects.create(
            listing=listing, image=f, sort_order=listing.images.count()
        )
        return Response(ListingImageSerializer(img).data, status=201)
