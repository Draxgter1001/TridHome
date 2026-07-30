from django.urls import path

from .views import TridChatView

urlpatterns = [path("ai/chat/", TridChatView.as_view())]
