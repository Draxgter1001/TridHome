from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import GoogleLoginView, MeView, RegisterView, VerificationDocumentViewSet

router = DefaultRouter()
router.register("verification-documents", VerificationDocumentViewSet,
                basename="verification-document")

urlpatterns = router.urls + [
    path("register/", RegisterView.as_view()),
    path("login/", TokenObtainPairView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("google/", GoogleLoginView.as_view()),
    path("me/", MeView.as_view()),
]
