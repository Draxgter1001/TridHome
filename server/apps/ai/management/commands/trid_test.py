"""Diagnose Trid's AI provider: `manage.py trid_test`.

Shows which engine will be used and makes one real API call, printing the
raw HTTP status and response so key/model problems are visible immediately.
"""
import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.ai import services


def mask(key: str) -> str:
    return f"{key[:6]}…{key[-4:]} ({len(key)} chars)" if key else "(non impostata)"


class Command(BaseCommand):
    help = "Test the configured Trid AI provider with a live API call."

    def handle(self, *args, **options):
        w = self.stdout.write
        w(f"TRID_AI_PROVIDER : {settings.TRID_AI_PROVIDER}")
        w(f"TRID_AI_MODEL    : {settings.TRID_AI_MODEL}")
        w(f"GEMINI_API_KEY   : {mask(settings.GEMINI_API_KEY)}")
        w(f"ANTHROPIC_API_KEY: {mask(settings.ANTHROPIC_API_KEY)}")
        provider = services.resolve_provider()
        w(f"→ Provider risolto: {provider}\n")

        if provider == "fallback":
            w(self.style.WARNING(
                "Nessuna chiave configurata: Trid userà il motore fallback."))
            return

        if provider == "gemini":
            url = services.GEMINI_URL.format(model=settings.TRID_AI_MODEL)
            resp = requests.post(
                url,
                headers={"x-goog-api-key": settings.GEMINI_API_KEY,
                         "content-type": "application/json"},
                json={"contents": [{"role": "user",
                                    "parts": [{"text": "Rispondi solo: ok"}]}]},
                timeout=30,
            )
        else:  # anthropic
            resp = requests.post(
                services.ANTHROPIC_URL,
                headers={"x-api-key": settings.ANTHROPIC_API_KEY,
                         "anthropic-version": services.ANTHROPIC_VERSION,
                         "content-type": "application/json"},
                json={"model": settings.TRID_AI_MODEL, "max_tokens": 16,
                      "messages": [{"role": "user", "content": "Rispondi solo: ok"}]},
                timeout=30,
            )

        w(f"HTTP {resp.status_code}")
        w(resp.text[:800])
        if resp.ok:
            w(self.style.SUCCESS("\n✔ Il provider risponde: Trid userà l'AI vera."))
        else:
            w(self.style.ERROR(
                "\n✘ Il provider ha rifiutato la chiamata (vedi corpo sopra). "
                "Trid degraderà al fallback finché non risolvi. Cause tipiche: "
                "chiave del tipo sbagliato, modello non abilitato al piano "
                "gratuito, quota esaurita (429)."))
