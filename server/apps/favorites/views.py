from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Favorite
from .serializers import FavoriteSerializer


class FavoriteViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        return (
            self.request.user.favorites
            .select_related("listing", "agency__agency_profile")
            .prefetch_related("listing__images")
        )

    @action(detail=False, methods=["get"])
    def ids(self, request):
        qs = self.get_queryset()
        return Response({
            "listings": list(qs.exclude(listing=None).values_list("listing_id", flat=True)),
            "agencies": list(qs.exclude(agency=None).values_list("agency_id", flat=True)),
        })

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        listing = request.data.get("listing")
        agency = request.data.get("agency")
        if bool(listing) == bool(agency):
            return Response({"detail": "Indica un annuncio oppure un'agenzia."}, status=400)
        kwargs = {"listing_id": listing} if listing else {"agency_id": agency}
        existing = Favorite.objects.filter(user=request.user, **kwargs).first()
        if existing:
            existing.delete()
            return Response({"favorited": False})
        Favorite.objects.create(user=request.user, **kwargs)
        return Response({"favorited": True}, status=201)
