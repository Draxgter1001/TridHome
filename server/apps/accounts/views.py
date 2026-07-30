from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import RegisterSerializer, UserSerializer


def _tokens_for(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).data, **_tokens_for(user)},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class GoogleLoginView(APIView):
    """Exchange a Google ID token for TridHome JWTs.

    Ported (conceptually) from legacy auth_views.verify_google_credential.
    Requires GOOGLE_OAUTH_CLIENT_ID env var; returns 501 until configured.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.conf import settings

        credential = request.data.get("credential")
        if not credential:
            return Response({"detail": "credential mancante"}, status=400)
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response({"detail": "Google OAuth non configurato"}, status=501)

        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        try:
            idinfo = id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.GOOGLE_OAUTH_CLIENT_ID
            )
        except ValueError:
            return Response({"detail": "Credenziale Google non valida"}, status=401)

        if idinfo["iss"] not in ("accounts.google.com", "https://accounts.google.com"):
            return Response({"detail": "Issuer non valido"}, status=401)

        user, created = User.objects.get_or_create(
            email=idinfo["email"],
            defaults={
                "username": idinfo["email"],
                "first_name": idinfo.get("given_name", ""),
                "last_name": idinfo.get("family_name", ""),
                "google_sub": idinfo["sub"],
            },
        )
        if created:
            from .models import PrivateProfile
            PrivateProfile.objects.create(user=user)
        return Response({"user": UserSerializer(user).data, **_tokens_for(user)})
