from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import FeedbackSubmission


class FeedbackView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        text = (request.data.get("text") or "").strip()
        if not text:
            return Response({"detail": "Il testo è obbligatorio."}, status=400)
        FeedbackSubmission.objects.create(
            user=request.user if request.user.is_authenticated else None,
            text=text[:3000],
            page=(request.data.get("page") or "")[:100],
        )
        return Response({"ok": True}, status=201)
