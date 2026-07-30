"""Trid — the TridHome AI agent.

Provider-agnostic: the chat() dispatcher picks an engine based on
TRID_AI_PROVIDER (or auto-detects from which API key is set):

- "gemini"    → Google Gemini (generativelanguage.googleapis.com, function
                calling). Has a FREE tier via a Google AI Studio key.
- "anthropic" → Claude (Anthropic Messages API, tool use). Paid.
- "fallback"  → deterministic Italian-language parser, zero configuration.

Every engine answers with REAL listings from the database. Any provider
error degrades gracefully to the fallback engine, so the demo never breaks.
"""
import json
import re

import requests
from django.conf import settings

from apps.listings.models import Listing
from apps.listings.serializers import ListingListSerializer

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

SYSTEM_PROMPT = """Sei Trid, l'agente AI di TridHome, piattaforma italiana per la
compravendita e l'affitto di case. Il tuo compito: aiutare le persone a trovare
casa, spiegare come funziona la piattaforma e guidarle verso la prenotazione di
una visita.

Regole:
- Rispondi SEMPRE in italiano, tono amichevole e professionale, risposte brevi.
- Quando l'utente cerca casa, usa lo strumento search_listings con i criteri che
  ha espresso. Non inventare MAI immobili: proponi solo i risultati dello strumento.
- Dopo una ricerca, riassumi i risultati in 1-2 frasi; le schede vengono mostrate
  automaticamente sotto il tuo messaggio, quindi non elencare i dettagli uno a uno.
- Se non ci sono risultati, dillo e suggerisci di allargare i criteri.
- Ricorda quando utile: su TridHome le visite si prenotano dal calendario
  dell'annuncio, il venditore conferma con un click, niente telefonate.
- Non dare consulenza legale o fiscale vincolante; per quelle rimanda a un professionista."""

SEARCH_TOOL = {
    "name": "search_listings",
    "description": (
        "Cerca annunci immobiliari reali nel database TridHome. "
        "Usa solo i criteri che l'utente ha espresso."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "contract": {"type": "string", "enum": ["vendita", "affitto"]},
            "category": {
                "type": "string",
                "enum": ["appartamento", "casa", "villa", "ufficio", "negozio", "capannone"],
            },
            "county": {"type": "string", "description": "Zona o comune, es. 'Trastevere'"},
            "max_price": {"type": "number"},
            "min_price": {"type": "number"},
            "min_rooms": {"type": "integer"},
            "min_surface": {"type": "integer"},
        },
    },
}

MAX_TOOL_TURNS = 3
MAX_RESULTS = 5


def run_search(params: dict):
    qs = Listing.objects.filter(is_published=True).prefetch_related("images")
    if params.get("contract"):
        qs = qs.filter(contract=params["contract"])
    if params.get("category"):
        qs = qs.filter(category=params["category"])
    if params.get("county"):
        qs = qs.filter(county__icontains=params["county"])
    if params.get("max_price"):
        qs = qs.filter(price__lte=params["max_price"])
    if params.get("min_price"):
        qs = qs.filter(price__gte=params["min_price"])
    if params.get("min_rooms"):
        qs = qs.filter(n_rooms__gte=params["min_rooms"])
    if params.get("min_surface"):
        qs = qs.filter(surface__gte=params["min_surface"])
    return list(qs[:MAX_RESULTS])


def _listing_summary(l: Listing) -> dict:
    return {
        "id": l.id,
        "titolo": l.title,
        "zona": f"{l.county}, {l.province}",
        "prezzo": float(l.price),
        "contratto": l.contract,
        "locali": l.n_rooms,
        "superficie_m2": l.surface,
    }


# ---------------------------------------------------------------- Claude engine
def claude_chat(messages: list) -> dict:
    """messages: [{'role': 'user'|'assistant', 'content': str}, ...]"""
    api_messages = [{"role": m["role"], "content": m["content"]} for m in messages]
    collected = {}

    for _ in range(MAX_TOOL_TURNS):
        resp = requests.post(
            ANTHROPIC_URL,
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            json={
                "model": settings.TRID_AI_MODEL,
                "max_tokens": 1024,
                "system": SYSTEM_PROMPT,
                "tools": [SEARCH_TOOL],
                "messages": api_messages,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("stop_reason") != "tool_use":
            text = "".join(b.get("text", "") for b in data["content"] if b["type"] == "text")
            return {"reply": text.strip(), "listings": list(collected.values()), "engine": "claude"}

        # Execute every tool call in this turn, feed results back
        api_messages.append({"role": "assistant", "content": data["content"]})
        tool_results = []
        for block in data["content"]:
            if block["type"] != "tool_use":
                continue
            found = run_search(block["input"] or {})
            for l in found:
                collected[l.id] = l
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block["id"],
                "content": json.dumps(
                    [_listing_summary(l) for l in found], ensure_ascii=False
                ),
            })
        api_messages.append({"role": "user", "content": tool_results})

    return {
        "reply": "Ho trovato questi annunci per te:",
        "listings": list(collected.values()),
        "engine": "claude",
    }


# ---------------------------------------------------------------- Gemini engine
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Same tool, Gemini function-declaration format (uppercase Schema types)
GEMINI_TOOL = {
    "name": "search_listings",
    "description": SEARCH_TOOL["description"],
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "contract": {"type": "STRING", "enum": ["vendita", "affitto"]},
            "category": {
                "type": "STRING",
                "enum": ["appartamento", "casa", "villa", "ufficio", "negozio", "capannone"],
            },
            "county": {"type": "STRING", "description": "Zona o comune, es. 'Trastevere'"},
            "max_price": {"type": "NUMBER"},
            "min_price": {"type": "NUMBER"},
            "min_rooms": {"type": "INTEGER"},
            "min_surface": {"type": "INTEGER"},
        },
    },
}


def build_gemini_contents(messages: list) -> list:
    """Map our {'role': 'user'|'assistant'} history to Gemini's user/model roles."""
    return [
        {
            "role": "model" if m["role"] == "assistant" else "user",
            "parts": [{"text": m["content"]}],
        }
        for m in messages
    ]


def gemini_chat(messages: list) -> dict:
    contents = build_gemini_contents(messages)
    collected = {}
    url = GEMINI_URL.format(model=settings.TRID_AI_MODEL)

    for _ in range(MAX_TOOL_TURNS):
        resp = requests.post(
            url,
            headers={
                "x-goog-api-key": settings.GEMINI_API_KEY,
                "content-type": "application/json",
            },
            json={
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": contents,
                "tools": [{"functionDeclarations": [GEMINI_TOOL]}],
                "generationConfig": {"maxOutputTokens": 1024},
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["candidates"][0]["content"]
        parts = content.get("parts", [])
        calls = [p["functionCall"] for p in parts if "functionCall" in p]

        if not calls:
            text = "".join(p.get("text", "") for p in parts)
            return {"reply": text.strip(), "listings": list(collected.values()), "engine": "gemini"}

        contents.append(content)
        response_parts = []
        for call in calls:
            found = run_search(call.get("args") or {})
            for l in found:
                collected[l.id] = l
            response_parts.append({
                "functionResponse": {
                    "name": call["name"],
                    "response": {"results": [_listing_summary(l) for l in found]},
                }
            })
        contents.append({"role": "user", "parts": response_parts})

    return {
        "reply": "Ho trovato questi annunci per te:",
        "listings": list(collected.values()),
        "engine": "gemini",
    }


# -------------------------------------------------------------- Fallback engine
# NB: 'casa'/'case' deliberately NOT mapped — Italians use them generically
# ("cerco casa" = any home), so treating them as the strict 'casa' category
# hides most results.
CATEGORY_WORDS = {
    "appartamento": "appartamento", "appartamenti": "appartamento",
    "casa indipendente": "casa",
    "villa": "villa", "ville": "villa",
    "ufficio": "ufficio", "uffici": "ufficio",
    "negozio": "negozio", "negozi": "negozio",
    "capannone": "capannone", "capannoni": "capannone",
}
ROOM_WORDS = {"monolocale": 1, "bilocale": 2, "trilocale": 3, "quadrilocale": 4, "attico": 4}


def _parse_price(text: str):
    # "500k", "500.000", "500 mila", "1,2 milioni", "900€", "900 euro al mese"
    m = re.search(r"(\d[\d.,]*)\s*(k|mila|milion\w*)?", text)
    if not m:
        return None
    raw = m.group(1).replace(".", "").replace(",", ".")
    try:
        n = float(raw)
    except ValueError:
        return None
    unit = m.group(2) or ""
    if unit in ("k", "mila"):
        n *= 1_000
    elif unit.startswith("milion"):
        n *= 1_000_000
    return n if n >= 100 else None


def fallback_chat(messages: list) -> dict:
    text = messages[-1]["content"].lower()
    params = {}

    if any(w in text for w in ("affitto", "affittare", "in affitto", "al mese", "/mese")):
        params["contract"] = "affitto"
    elif any(w in text for w in ("compr", "vendita", "acquist")):
        params["contract"] = "vendita"

    for word, cat in CATEGORY_WORDS.items():
        if word in text:
            params["category"] = cat
            break

    for word, rooms in ROOM_WORDS.items():
        if word in text:
            params["min_rooms"] = rooms
            break
    m = re.search(r"(\d+)\s*(locali|stanze|camere)", text)
    if m:
        params["min_rooms"] = int(m.group(1))

    counties = Listing.objects.values_list("county", flat=True).distinct()
    for county in counties:
        if county.lower() in text:
            params["county"] = county
            break

    if any(w in text for w in ("sotto", "massimo", "max", "entro", "budget", "non più di")):
        price = _parse_price(text)
        if price:
            params["max_price"] = price

    if not params:
        return {
            "reply": (
                "Ciao, sono Trid! 👋 Dimmi che casa cerchi — per esempio: "
                "\"un trilocale in affitto a Trastevere sotto i 1.500€\" — "
                "e ti mostro subito gli annunci disponibili. Poi potrai prenotare "
                "la visita direttamente dal calendario, senza telefonate."
            ),
            "listings": [],
            "engine": "fallback",
        }

    found = run_search(params)
    if not found:
        return {
            "reply": (
                "Non ho trovato annunci con questi criteri. Prova ad allargare "
                "la zona o il budget, oppure dimmi qualcos'altro sulla casa che cerchi."
            ),
            "listings": [],
            "engine": "fallback",
        }
    return {
        "reply": f"Ho trovato {len(found)} annunci che corrispondono alla tua ricerca. "
                 "Tocca una scheda per i dettagli e prenota la visita dal calendario!",
        "listings": found,
        "engine": "fallback",
    }


def resolve_provider() -> str:
    p = (settings.TRID_AI_PROVIDER or "auto").lower()
    if p in ("gemini", "anthropic", "fallback"):
        return p
    # auto: prefer whichever key is configured (Gemini first — it has a free tier)
    if settings.GEMINI_API_KEY:
        return "gemini"
    if settings.ANTHROPIC_API_KEY:
        return "anthropic"
    return "fallback"


ENGINES = {"gemini": None, "anthropic": None}  # filled below to keep refs simple


def chat(messages: list) -> dict:
    provider = resolve_provider()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        engine = gemini_chat
    elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        engine = claude_chat
    else:
        engine = fallback_chat

    if engine is fallback_chat:
        result = fallback_chat(messages)
    else:
        try:
            result = engine(messages)
        except (requests.RequestException, KeyError, IndexError, ValueError):
            # Provider down, rate-limited, or unexpected shape → never break the demo
            result = fallback_chat(messages)

    result["listings"] = ListingListSerializer(result["listings"], many=True).data
    return result
