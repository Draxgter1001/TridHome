from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve


def health(_request):
    return JsonResponse({"status": "ok", "service": "tridhome-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.listings.urls")),
    path("api/", include("apps.visits.urls")),
    path("api/", include("apps.reviews.urls")),
    path("api/", include("apps.favorites.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/", include("apps.ai.urls")),
    path("api/", include("apps.feedback.urls")),
    # Alpha-grade media serving (prod: move to object storage / nginx volume)
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
