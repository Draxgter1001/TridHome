from rest_framework import mixins, permissions, viewsets

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet
):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action == "list":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Review.objects.select_related("author")
        target = self.request.query_params.get("target")
        return qs.filter(target_id=target) if target else qs.none()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
