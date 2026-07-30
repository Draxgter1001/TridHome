# TridHome Alpha — Rebuild Architecture & Migration Plan

**Author:** Lead Dev / System Architect
**Source:** `lenzoproject` legacy repo (React/Vite + Django) · TRIDHOME Alpha spec
**Strategy:** Fresh scaffold, selective port. No in-place refactoring.

---

## 0. Critical Architectural Finding (read first)

The legacy backend is **Django + raw MongoDB (pymongo)**, not Django ORM:

- `api/models.py` contains plain Python classes with `collection_name` and `ObjectId` — not `models.Model`.
- `api/services.py` is a hand-rolled data-access layer (`collection.insert_one`, `$addToSet`, `$pull`).
- Auth is a custom JWT implementation with a `@require_auth` decorator — no DRF, no `django.contrib.auth`.
- API responses leak BSON artifacts (`{"$date": ...}`) which the frontend patches around (`formatDate` in `PropertyListing.jsx`).

**Consequence:** the target stack (DRF + SQLite/PostgreSQL) means the backend is a **rebuild guided by the legacy code**, not a file move. The legacy `services.py` + `PropertyForm` payloads are the authoritative *field specification* for the new ORM models. The frontend is where ~80% of the genuine port value lives.

**Bonus consequence (good news):** killing Mongo also kills the `$date`/`_id` string-juggling in the frontend. Ported components get *simpler* during migration, not just re-styled.

---

## 1. New Directory Structure

```
tridhome/
├── client/                                # React + Vite frontend
│   ├── public/
│   │   └── media/
│   │       └── hero.mp4                   # Landing hero video
│   ├── src/
│   │   ├── api/                           # ALL fetch logic lives here (new)
│   │   │   ├── client.js                  # base fetch wrapper + auth header + 401 handling
│   │   │   ├── auth.js
│   │   │   ├── listings.js
│   │   │   ├── visits.js                  # calendar/booking endpoints
│   │   │   ├── reviews.js
│   │   │   ├── favorites.js
│   │   │   └── feedback.js
│   │   ├── assets/                        # ported icons/fonts (Playfair Display + Montserrat)
│   │   ├── components/
│   │   │   ├── common/                    # Button, Badge, Modal, StarRating, Spinner
│   │   │   ├── layout/                    # Navbar, Footer, ScrollToTop
│   │   │   ├── landing/                   # HeroVideo, MainButtons, HowAndWhy, Advantages
│   │   │   ├── search/                    # SearchBar, FilterForm, SortSelect        [PORTED]
│   │   │   ├── listings/                  # PropertyCard, ListingGrid               [PORTED]
│   │   │   ├── listing-detail/            # ImageCarousel, House(→PropertyDetails),
│   │   │   │                              #   ContactBox, ReviewsSection            [PORT+NEW]
│   │   │   ├── sell/                      # PropertyForm, SubmissionSuccess,
│   │   │   │                              #   LoginPrompt                           [PORTED]
│   │   │   ├── calendar/                  # AvailabilityEditor (seller),
│   │   │   │                              #   BookingCalendar (buyer),
│   │   │   │                              #   VisitRequestList (seller inbox)       [NEW]
│   │   │   ├── profile/                   # PrivateProfile, AgencyProfile,
│   │   │   │                              #   VerificationUpload, AgencyDashboard   [PORT+NEW]
│   │   │   └── feedback/                  # FeedbackModal (entry pop-up)            [NEW]
│   │   ├── context/
│   │   │   └── AuthContext.jsx            # replaces scattered checkSellPageAuth calls
│   │   ├── hooks/                         # useAuth, useListings, useNotifications
│   │   ├── pages/                         # route-level components only
│   │   │   ├── LandingPage.jsx
│   │   │   ├── SearchPage.jsx             # was Components/request/Request.jsx
│   │   │   ├── ListingPage.jsx            # was PropertyListing.jsx
│   │   │   ├── SellPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── FavoritesPage.jsx
│   │   │   ├── RegisterPage.jsx           # role split: Private vs Agency
│   │   │   └── LoginPage.jsx
│   │   ├── styles/
│   │   │   └── theme.css                  # green palette CSS variables (single source)
│   │   ├── App.jsx                        # router only
│   │   └── main.jsx
│   ├── .env.example                       # VITE_API_BASE_URL
│   ├── tailwind.config.js                 # brand colors registered here
│   ├── vite.config.js
│   └── package.json
│
├── server/                                # Django + DRF backend
│   ├── config/                            # project settings
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── dev.py                     # SQLite
│   │   │   └── prod.py                    # PostgreSQL (DATABASE_URL)
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/                      # custom User, PrivateProfile, AgencyProfile,
│   │   │   │                              #   VerificationDocument
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── permissions.py             # IsAgency, IsVerified, IsOwner
│   │   │   └── urls.py
│   │   ├── listings/                      # Listing (Property+Advert merged), ListingImage
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── filters.py                 # django-filter FilterSet ← mirrors FilterForm fields
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── visits/                        # AvailabilitySlot, VisitRequest
│   │   ├── reviews/                       # Review (stars + text, per user/agency)
│   │   ├── favorites/                     # Favorite (listing OR agency)
│   │   ├── notifications/                 # Notification (visit confirm/deny etc.)
│   │   └── feedback/                      # FeedbackSubmission (entry pop-up)
│   ├── media/                             # user uploads (dev); S3-compatible in prod
│   ├── requirements/
│   │   ├── base.txt                       # django, djangorestframework, django-filter,
│   │   │                                  #   djangorestframework-simplejwt, pillow,
│   │   │                                  #   django-cors-headers, google-auth
│   │   └── prod.txt                       # + psycopg2-binary, gunicorn, whitenoise
│   ├── manage.py
│   └── .env.example
│
├── docs/
│   ├── TRIDHOME_Alpha.pdf                 # source spec
│   └── MIGRATION_PLAN.md                  # this file
└── README.md
```

**Rules that keep it clean:**
1. Components never call `fetch` directly — only `src/api/*` does. (Legacy hard-codes `http://localhost:8000` in a dozen components.)
2. `pages/` compose, `components/` render. No business logic in pages.
3. One Django app per bounded context; no `api` mega-app like the legacy repo.
4. All colors come from `theme.css` variables / Tailwind config — never inline hex.

---

## 2. Database Schema (Django ORM)

### 2.1 Accounts — the critical Private vs Agency split

Design decision: **one custom `User` with a `role` field + two profile tables** (multi-table, not single-table with nullable columns). Rationale: agencies have ~8 extra required fields; stuffing them nullable into `User` makes "is this agency data complete?" unverifiable at the DB level, and the spec says agencies get a richer dashboard, so the split will only grow.

```python
# apps/accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        PRIVATE = "private", "Privato"
        AGENCY  = "agency",  "Agenzia"

    role         = models.CharField(max_length=10, choices=Role.choices, default=Role.PRIVATE)
    email        = models.EmailField(unique=True)          # login by email, as legacy did
    phone        = models.CharField(max_length=30, blank=True)
    google_sub   = models.CharField(max_length=64, blank=True, db_index=True)  # Google OAuth
    is_verified  = models.BooleanField(default=False)      # "Verificato" badge
    avatar       = models.ImageField(upload_to="avatars/", blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]


class AgencyProfile(models.Model):
    user           = models.OneToOneField(User, on_delete=models.CASCADE,
                                          related_name="agency_profile")
    official_name  = models.CharField(max_length=255)               # Nome ufficiale
    vat_number     = models.CharField(max_length=20, unique=True)   # Partita IVA
    office_address = models.CharField(max_length=255)               # Indirizzo sede
    opening_hours  = models.JSONField(default=dict)                 # {"mon": ["09:00-13:00", "14:00-18:00"], ...}
    website        = models.URLField(blank=True)
    social_links   = models.JSONField(default=dict, blank=True)     # {"instagram": "...", ...}
    bio            = models.TextField(blank=True)
    logo           = models.ImageField(upload_to="agency_logos/", blank=True)


class PrivateProfile(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE,
                                      related_name="private_profile")
    bio        = models.TextField(blank=True)
    # legacy 'name'/'surname' map to User.first_name/last_name


class VerificationDocument(models.Model):
    class Status(models.TextChoices):
        PENDING  = "pending"
        APPROVED = "approved"
        REJECTED = "rejected"

    class DocType(models.TextChoices):
        ID_CARD      = "id_card"        # privati
        VAT_CERT     = "vat_cert"       # visura / certificato P.IVA (agenzie)
        CHAMBER_REG  = "chamber_reg"    # iscrizione camera di commercio
        OTHER        = "other"

    user         = models.ForeignKey(User, on_delete=models.CASCADE,
                                     related_name="verification_documents")
    doc_type     = models.CharField(max_length=20, choices=DocType.choices)
    file         = models.FileField(upload_to="verification/%Y/%m/")
    status       = models.CharField(max_length=10, choices=Status.choices,
                                    default=Status.PENDING)
    reviewed_by  = models.ForeignKey(User, null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name="+")
    reviewed_at  = models.DateTimeField(null=True, blank=True)
    reject_reason = models.TextField(blank=True)
    uploaded_at  = models.DateTimeField(auto_now_add=True)
```

**Badge rule (signal or service):** when a user's documents include at least one `APPROVED` of the required type for their role → `user.is_verified = True`. Admin approves via Django Admin for Alpha — no custom moderation UI needed yet.

### 2.2 Listings — merge legacy `Property` + `Advert`

Legacy split Property and Advert 1:1, forcing the frontend into dual fetches (`/properties/{id}` then `/adverts/by-property/{id}`). Merge them; keep the *form's* two-step UX untouched.

```python
# apps/listings/models.py
class Listing(models.Model):
    class Category(models.TextChoices):
        APPARTAMENTO = "appartamento"; CASA = "casa"; VILLA = "villa"
        UFFICIO = "ufficio"; NEGOZIO = "negozio"; CAPANNONE = "capannone"

    class Typology(models.TextChoices):
        MONOLOCALE = "monolocale"; BILOCALE = "bilocale"; TRILOCALE = "trilocale"
        QUADRILOCALE = "quadrilocale"; VILLA = "villa"; ATTICO = "attico"

    class Contract(models.TextChoices):
        VENDITA = "vendita"; AFFITTO = "affitto"

    owner        = models.ForeignKey("accounts.User", on_delete=models.CASCADE,
                                     related_name="listings")
    # --- ex-Advert fields ---
    title        = models.CharField(max_length=255)
    description  = models.TextField()
    advert_code  = models.PositiveIntegerField(unique=True)   # keep: users reference it
    # --- ex-Property fields (exact legacy field spec) ---
    province     = models.CharField(max_length=100)
    county       = models.CharField(max_length=100)
    post_code    = models.CharField(max_length=10)
    address      = models.CharField(max_length=255)
    lat          = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    lng          = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    category     = models.CharField(max_length=20, choices=Category.choices)
    typology     = models.CharField(max_length=20, choices=Typology.choices)
    contract     = models.CharField(max_length=10, choices=Contract.choices)
    price        = models.DecimalField(max_digits=12, decimal_places=2)
    surface      = models.PositiveIntegerField()              # m²
    n_rooms      = models.PositiveSmallIntegerField()
    floor_level  = models.CharField(max_length=20)
    is_published = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)


class ListingImage(models.Model):
    listing    = models.ForeignKey(Listing, on_delete=models.CASCADE,
                                   related_name="images")
    image      = models.ImageField(upload_to="listings/%Y/%m/")
    sort_order = models.PositiveSmallIntegerField(default=0)   # index 0 = primary

    class Meta:
        ordering = ["sort_order"]
```

(Legacy stored image *URL strings* in a Mongo array. A proper `ImageField` table fixes ordering, deletion, and lets Alpha move to real uploads.)

### 2.3 Visits — the Request → Approve/Deny → Notify flow

```python
# apps/visits/models.py
class AvailabilitySlot(models.Model):
    """Seller-declared windows when the property can be visited."""
    listing    = models.ForeignKey("listings.Listing", on_delete=models.CASCADE,
                                   related_name="availability_slots")
    date       = models.DateField()
    start_time = models.TimeField()
    end_time   = models.TimeField()

    class Meta:
        unique_together = [("listing", "date", "start_time")]


class VisitRequest(models.Model):
    class Status(models.TextChoices):
        PENDING   = "pending"
        APPROVED  = "approved"
        DENIED    = "denied"
        CANCELLED = "cancelled"   # buyer withdraws

    slot       = models.ForeignKey(AvailabilitySlot, on_delete=models.CASCADE,
                                   related_name="requests")
    buyer      = models.ForeignKey("accounts.User", on_delete=models.CASCADE,
                                   related_name="visit_requests")
    message    = models.TextField(blank=True)       # spec: "giorno, orario e un messaggio"
    status     = models.CharField(max_length=10, choices=Status.choices,
                                  default=Status.PENDING)
    decided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # one active request per buyer per slot
            models.UniqueConstraint(
                fields=["slot", "buyer"],
                condition=models.Q(status__in=["pending", "approved"]),
                name="uniq_active_request_per_slot_buyer",
            )
        ]
```

**State machine (enforced in the serializer/view, seller-only transition):**
`PENDING → APPROVED | DENIED` (seller) · `PENDING → CANCELLED` (buyer).
On transition, create a `Notification` for the buyer — inside the same DB transaction.

### 2.4 Notifications, Reviews, Favorites, Feedback

```python
# apps/notifications/models.py
class Notification(models.Model):
    class Kind(models.TextChoices):
        VISIT_REQUESTED = "visit_requested"   # → seller
        VISIT_APPROVED  = "visit_approved"    # → buyer
        VISIT_DENIED    = "visit_denied"      # → buyer
        VERIFICATION    = "verification"      # doc approved/rejected

    recipient  = models.ForeignKey("accounts.User", on_delete=models.CASCADE,
                                   related_name="notifications")
    kind       = models.CharField(max_length=30, choices=Kind.choices)
    payload    = models.JSONField(default=dict)    # {listing_id, slot, ...}
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


# apps/reviews/models.py
class Review(models.Model):
    """Stars + text on a seller (private or agency)."""
    target     = models.ForeignKey("accounts.User", on_delete=models.CASCADE,
                                   related_name="reviews_received")
    author     = models.ForeignKey("accounts.User", on_delete=models.CASCADE,
                                   related_name="reviews_written")
    rating     = models.PositiveSmallIntegerField()   # validate 1–5
    text       = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("target", "author")]      # one review per pair (Alpha)


# apps/favorites/models.py
class Favorite(models.Model):
    """Heart on a listing OR an agency (spec allows both)."""
    user       = models.ForeignKey("accounts.User", on_delete=models.CASCADE,
                                   related_name="favorites")
    listing    = models.ForeignKey("listings.Listing", null=True, blank=True,
                                   on_delete=models.CASCADE)
    agency     = models.ForeignKey("accounts.User", null=True, blank=True,
                                   on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(          # exactly one target
                check=(models.Q(listing__isnull=False, agency__isnull=True) |
                       models.Q(listing__isnull=True,  agency__isnull=False)),
                name="favorite_exactly_one_target",
            )
        ]
        unique_together = [("user", "listing"), ("user", "agency")]


# apps/feedback/models.py
class FeedbackSubmission(models.Model):
    """Entry pop-up responses. Spec: 'arrivi a noi su un foglio' →
    store in DB; optional management command exports CSV / pushes to Google Sheet."""
    user       = models.ForeignKey("accounts.User", null=True, blank=True,
                                   on_delete=models.SET_NULL)
    text       = models.TextField()
    page       = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 2.5 ER summary

```
User ─1:1─ AgencyProfile          Listing ─1:N─ ListingImage
User ─1:1─ PrivateProfile         Listing ─1:N─ AvailabilitySlot ─1:N─ VisitRequest
User ─1:N─ VerificationDocument   User(buyer) ─1:N─ VisitRequest
User ─1:N─ Listing (owner)        User ─1:N─ Notification
User ─N:M─ Review (author/target) User ─1:N─ Favorite ─→ (Listing | User-as-agency)
```

---

## 3. Migration Plan

### Phase 0 — Scaffold (Day 1)

1. `npm create vite@latest client -- --template react`; install `react-router-dom`, `tailwindcss`, `react-icons`, `lucide-react` (all present in legacy).
2. `django-admin startproject config server/`; create the six apps; install `base.txt` deps.
3. **Set `AUTH_USER_MODEL = "accounts.User"` before the first migration** — non-negotiable, changing it later means resetting the DB.
4. Register the brand palette once:

```js
// tailwind.config.js
theme: { extend: { colors: {
  brand: { dark: "#1B4332", light: "#74C69D", white: "#FFFFFF" },  // adjust hexes to final palette
}}}
```
```css
/* theme.css */
:root { --brand-dark:#1B4332; --brand-light:#74C69D; }
```
Fonts stay as legacy/spec: `Playfair Display` (titles), `Montserrat` (body).

### Phase 1 — Backend rebuild (Week 1)

The legacy backend is a **spec, not a source**. Port *knowledge*, not files:

| Legacy source | What to extract | New home |
|---|---|---|
| `server/tridHomeServer/api/models.py` | Exact field list for Property/Advert/User | `apps/listings/models.py`, `apps/accounts/models.py` (§2) |
| `server/tridHomeServer/api/services.py` → filter logic in property queries | Which query params search supports | `apps/listings/filters.py` (`django-filter` FilterSet) |
| `server/tridHomeServer/api/auth_views.py` → `verify_google_credential` | Google OAuth verification flow (`google-auth`, issuer check) | `apps/accounts/views.py` — **the one backend function ported nearly verbatim** |
| Custom JWT in `services.py`/`auth_views.py` | Nothing — replace | `djangorestframework-simplejwt` |
| `chatbot/` app | Nothing for Alpha (AI agent is external; you only embed it) | Leave a stub `POST /api/ai/echo` or iframe slot in frontend |

Steps: models → `makemigrations` → DRF serializers → ViewSets + routers → seed script (`manage.py seed_demo`) that creates 1 agency, 2 privates, ~10 listings so the frontend team is never blocked.

**API compatibility note:** the new `GET /api/listings/` returns the *merged* shape (listing + nested `images` + `owner` summary). This deliberately breaks legacy response format — see the frontend adapter step below.

### Phase 2 — Frontend port (Week 1–2, parallel with Phase 1 after seed data exists)

General cleanup applied to **every** ported file:
- Delete hard-coded `http://localhost:8000/...` → import from `src/api/*` (uses `import.meta.env.VITE_API_BASE_URL`).
- Delete `formatDate({$date})` BSON helpers → plain ISO strings from DRF.
- Delete `console.log` debugging (legacy is full of them, e.g. `Sellpage.jsx` auth logging).
- Replace `setTimeout(checkAuth, 200)` / window-focus auth polling hacks with `AuthContext`.
- Replace hard-coded grays/blacks/blues with `brand-*` Tailwind classes.
- Fix the folder typo: `pagesComponets` → gone; components land in semantic folders.

#### 2a. Port table (KEEP list)

| Legacy file | → New location | Cleanup during move |
|---|---|---|
| `Components/sellPage/PropertyForm.jsx` | `components/sell/PropertyForm.jsx` | Point submit at single `POST /api/listings/` (was 2 calls: create property → create advert). Keep the step UX identical — spec says it's perfect. |
| `Components/sellPage/Sellpage.jsx` | `pages/SellPage.jsx` | Strip auth-polling; wrap route in `<RequireAuth>`; remove logs. |
| `Components/sellPage/SubmissionSuccess.jsx`, `LoginPrompt.jsx` | `components/sell/` | Restyle CTA buttons to green palette only. |
| `Components/pagesComponets/SearchBar.jsx` | `components/search/SearchBar.jsx` | No logic change; theme colors. |
| `Components/pagesComponets/FilterForm.jsx` | `components/search/FilterForm.jsx` | Keep all fields/options (categoria, tipologia, contratto, prezzo, zona…) — they map 1:1 to `filters.py`. Extract option lists to `constants/listingOptions.js` shared with PropertyForm. |
| `Components/request/Request.jsx` | `pages/SearchPage.jsx` | Collapse the dual `properties + adverts` fetch into one `GET /api/listings/?{params}`. Move fetch into `useListings` hook. |
| `Components/property/PropertyCard.jsx` | `components/listings/PropertyCard.jsx` | Add ★ average + heart (Favorite) overlay. |
| `Components/property/PropertyListing.jsx` | `pages/ListingPage.jsx` | Remove 3 sequential fetches (property/advert/owner) → single detail endpoint. Keep layout ("traghetta profilo" tabs/links). Add `<ReviewsSection>` under owner box. |
| `Components/property/ImageCarousel.jsx` | `components/listing-detail/ImageCarousel.jsx` | Consume `images[].image` URLs; keep behavior as-is. |
| `Components/property/House.jsx` | `components/listing-detail/PropertyDetails.jsx` | Rename for clarity; no logic change. |
| `Components/property/ContactBox.jsx` | `components/listing-detail/ContactBox.jsx` | Show Verified badge from `owner.is_verified`; agency extra info if `role === "agency"`. |
| `Components/property/CalendarComponent.jsx` | **Do not port.** | Spec explicitly says old calendar insufficient. Replace with `components/calendar/BookingCalendar.jsx`. Reuse only its visual shell if styling is worth keeping. |
| `Components/LandingPageComponents/Footer.jsx` | `components/layout/Footer.jsx` | Recolor black→brand-dark; keep icon set. |
| `Components/userProfile/UserProfile.jsx` | `components/profile/PrivateProfile.jsx` | Split: shared header stays; agency variant is new. Recolor gradient hero to green. |
| `utils/auth.js` | `context/AuthContext.jsx` + `api/auth.js` | Keep token-storage + `createAuthenticatedFetch` idea; expiry check moves into the api client interceptor. |
| `Components/home/Furnish.jsx` and other Lenzo-branded extras | **Drop.** | Out of Alpha scope ("Lenzo" branding, before/after slider). Archive in legacy repo. |
| Fonts/icons/global CSS | `src/assets/`, `styles/` | Keep Playfair + Montserrat pairing per spec. |

#### 2b. Build-new list

| Component | Notes |
|---|---|
| `pages/LandingPage.jsx` + `components/landing/*` | Spec structure top-to-bottom: sticky nav (TridHome logo left → home; main buttons center; favorites+profile right) → **HeroVideo** with overlay text + Servizi button → **HowAndWhy** ("come e perché nasce TridHome") → **Advantages** → **Footer** + scroll-to-top; AI button bottom-left. |
| `pages/RegisterPage.jsx` | First screen: choose **Privato / Agenzia** (spec allows this outside classic registration — a pre-step selector is the cleanest). Agency branch renders the extra fields (official name, P.IVA, address, hours, website, socials, bio, logo). |
| `components/calendar/AvailabilityEditor.jsx` | Seller adds date+time windows → `POST /api/listings/{id}/slots/`. |
| `components/calendar/BookingCalendar.jsx` | Buyer sees open slots on ListingPage, picks slot + writes message → `POST /api/visit-requests/`. |
| `components/calendar/VisitRequestList.jsx` | Seller inbox: Approve / Deny buttons → `PATCH /api/visit-requests/{id}/` → triggers Notification. |
| `components/common/StarRating.jsx` + `listing-detail/ReviewsSection.jsx` | Display avg + list; submit form for logged-in users. |
| `components/profile/VerificationUpload.jsx` | Doc-type select + file upload → `POST /api/verification-documents/`; status chip (pending/approved/rejected). |
| `components/profile/AgencyDashboard.jsx` | Alpha-minimal "agenda": my listings + views count, pending visit requests, verified badge front-and-center. |
| `components/feedback/FeedbackModal.jsx` | Fires once per session (`sessionStorage` flag — allowed in real browser app, this is not an artifact). Copy from spec: "Il tuo parere conta! 💡 …". Submits to `POST /api/feedback/`. |
| `components/layout/NotificationBell.jsx` | Poll `GET /api/notifications/?unread=1` every 30s for Alpha (websockets are post-Alpha). |

### Phase 3 — Integration & polish (Week 3)

1. Wire `RequireAuth` route guards (sell, profile, favorites, seller calendar).
2. End-to-end walkthrough of the calendar state machine with two browsers (seller + buyer).
3. Verification loop: upload doc → approve in Django Admin → badge appears on ContactBox/profile.
4. Feedback export: `manage.py export_feedback --csv` (fulfills "arrivi a noi su un foglio").
5. Palette audit: grep the client for `bg-black|blue-600|gray-900` hero remnants; swap to brand tokens.
6. Prod checklist: `prod.py` + PostgreSQL, `MEDIA_ROOT` → object storage, CORS locked to the real domain, simplejwt refresh rotation on.

### Suggested sequencing / ownership

| Week | Backend | Frontend |
|---|---|---|
| 1 | Accounts + Listings models, auth (Google + JWT), seed data | Scaffold, theme, port search stack (SearchBar/FilterForm/SearchPage/PropertyCard) |
| 2 | Visits + Notifications + Reviews + Favorites + Feedback endpoints | Port sell flow + listing detail; build Landing + Register split |
| 3 | Verification admin flow, feedback export, hardening | Calendar UIs, dashboard, FeedbackModal, ReviewsSection, palette audit |

---

## 4. Open questions for the product owner

1. Exact hex values for the two greens (spec says "verde due tonalità scuro e chiaro" without codes) — I've used placeholder `#1B4332` / `#74C69D`.
2. Can only buyers who completed a visit leave a review, or anyone logged in? (Alpha default above: anyone logged in, one per target.)
3. Community (§7): nav button linking to an external group (Telegram/WhatsApp) is enough for Alpha? That's my assumption — zero build cost.
4. The AI agent ("Trid"): what interface does the other developer deliver (iframe, JS widget, REST endpoint)? Determines the shape of the bottom-left button integration.
