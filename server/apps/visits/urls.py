from rest_framework.routers import DefaultRouter

from .views import SlotViewSet, VisitRequestViewSet

router = DefaultRouter()
router.register("slots", SlotViewSet, basename="slot")
router.register("visit-requests", VisitRequestViewSet, basename="visit-request")
urlpatterns = router.urls
