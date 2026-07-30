from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from .services import chat


class TridThrottleAnon(AnonRateThrottle):
    rate = "15/min"


class TridThrottleUser(UserRateThrottle):
    rate = "30/min"


class TridChatView(APIView):
    """POST {"messages": [{"role": "user"|"assistant", "content": "..."}]}"""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [TridThrottleAnon, TridThrottleUser]

    def post(self, request):
        messages = request.data.get("messages") or []
        cleaned = [
            {"role": m["role"], "content": str(m["content"])[:2000]}
            for m in messages[-12:]
            if isinstance(m, dict) and m.get("role") in ("user", "assistant") and m.get("content")
        ]
        if not cleaned or cleaned[-1]["role"] != "user":
            return Response({"detail": "Serve almeno un messaggio utente."}, status=400)
        return Response(chat(cleaned))
