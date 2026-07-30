"""Seed demo data for the investor prototype: 1 agency, 2 privates, 10 listings."""
import random

from django.core.management.base import BaseCommand

from apps.accounts.models import AgencyProfile, PrivateProfile, User
from apps.listings.models import Listing, ListingImage

DEMO_LISTINGS = [
    ("Attico luminoso con terrazza a Prati", "attico", "vendita", 890000, 145, 5, "Roma", "Prati", "00193"),
    ("Trilocale ristrutturato zona Trastevere", "appartamento", "vendita", 520000, 95, 3, "Roma", "Trastevere", "00153"),
    ("Bilocale moderno vicino Metro B", "appartamento", "affitto", 1250, 62, 2, "Roma", "Bologna", "00162"),
    ("Villa con giardino ai Castelli Romani", "villa", "vendita", 745000, 240, 7, "Roma", "Frascati", "00044"),
    ("Monolocale arredato San Lorenzo", "appartamento", "affitto", 850, 40, 1, "Roma", "San Lorenzo", "00185"),
    ("Ufficio open space EUR", "ufficio", "affitto", 2900, 180, 6, "Roma", "EUR", "00144"),
    ("Casa indipendente con corte interna", "casa", "vendita", 398000, 130, 4, "Roma", "Centocelle", "00171"),
    ("Quadrilocale con doppio balcone Monteverde", "appartamento", "vendita", 610000, 118, 4, "Roma", "Monteverde", "00152"),
    ("Negozio su strada ad alto passaggio", "negozio", "affitto", 3200, 90, 2, "Roma", "Appio Latino", "00183"),
    ("Attico panoramico Parioli", "attico", "vendita", 1250000, 175, 6, "Roma", "Parioli", "00197"),
]

TYPOLOGY_BY_ROOMS = {1: "monolocale", 2: "bilocale", 3: "trilocale", 4: "quadrilocale"}


class Command(BaseCommand):
    help = "Create demo users and listings (idempotent)."

    def handle(self, *args, **options):
        if User.objects.filter(email="agenzia@tridhome.demo").exists():
            self.stdout.write("Demo data already present, skipping.")
            return

        agency = User.objects.create_user(
            username="agenzia@tridhome.demo", email="agenzia@tridhome.demo",
            password="demo1234", first_name="Verdi", last_name="Immobiliare",
            role=User.Role.AGENCY, is_verified=True,
        )
        AgencyProfile.objects.create(
            user=agency, official_name="Verdi Immobiliare S.r.l.",
            vat_number="IT01234567890", office_address="Via del Corso 12, Roma",
            opening_hours={"lun-ven": "09:00-18:00", "sab": "09:00-13:00"},
            website="https://verdi-immobiliare.demo",
            bio="Agenzia di quartiere specializzata nel centro di Roma.",
        )

        privates = []
        for i, (fn, ln) in enumerate([("Marco", "Rossi"), ("Giulia", "Bianchi")], 1):
            u = User.objects.create_user(
                username=f"privato{i}@tridhome.demo", email=f"privato{i}@tridhome.demo",
                password="demo1234", first_name=fn, last_name=ln,
                role=User.Role.PRIVATE, is_verified=(i == 1),
            )
            PrivateProfile.objects.create(user=u)
            privates.append(u)

        owners = [agency, agency, agency, agency, privates[0], privates[0],
                  privates[1], privates[1], agency, agency]

        for owner, row in zip(owners, DEMO_LISTINGS):
            title, category, contract, price, surface, rooms, province, county, cap = row
            typology = TYPOLOGY_BY_ROOMS.get(rooms, "villa" if category == "villa" else "attico")
            listing = Listing.objects.create(
                owner=owner, title=title,
                description=(
                    f"{title}. Immobile in ottime condizioni, zona {county}. "
                    "Contattaci per prenotare una visita direttamente dal calendario."
                ),
                province=province, county=county, post_code=cap,
                address=f"Via Demo {random.randint(1, 120)}, {county}",
                lat=41.9 + random.uniform(-0.05, 0.05),
                lng=12.5 + random.uniform(-0.05, 0.05),
                category=category, typology=typology, contract=contract,
                price=price, surface=surface, n_rooms=rooms,
                floor_level=str(random.randint(0, 5)),
            )
            for i in range(3):
                ListingImage.objects.create(
                    listing=listing,
                    external_url=f"https://picsum.photos/seed/trid{listing.id}{i}/800/600",
                    sort_order=i,
                )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {User.objects.count()} users, {Listing.objects.count()} listings."
        ))
