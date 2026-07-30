import random

from django.db import models


def _new_advert_code() -> int:
    return random.randint(100000, 999999)


class Listing(models.Model):
    """Merged legacy Property + Advert (they were 1:1)."""

    class Category(models.TextChoices):
        APPARTAMENTO = "appartamento", "Appartamento"
        CASA = "casa", "Casa"
        VILLA = "villa", "Villa"
        UFFICIO = "ufficio", "Ufficio"
        NEGOZIO = "negozio", "Negozio"
        CAPANNONE = "capannone", "Capannone"

    class Typology(models.TextChoices):
        MONOLOCALE = "monolocale", "Monolocale"
        BILOCALE = "bilocale", "Bilocale"
        TRILOCALE = "trilocale", "Trilocale"
        QUADRILOCALE = "quadrilocale", "Quadrilocale"
        VILLA = "villa", "Villa"
        ATTICO = "attico", "Attico"

    class Contract(models.TextChoices):
        VENDITA = "vendita", "Vendita"
        AFFITTO = "affitto", "Affitto"

    owner = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="listings")
    title = models.CharField(max_length=255)
    description = models.TextField()
    advert_code = models.PositiveIntegerField(unique=True, default=_new_advert_code)

    province = models.CharField(max_length=100)
    county = models.CharField(max_length=100)
    post_code = models.CharField(max_length=10)
    address = models.CharField(max_length=255)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    category = models.CharField(max_length=20, choices=Category.choices)
    typology = models.CharField(max_length=20, choices=Typology.choices)
    contract = models.CharField(max_length=10, choices=Contract.choices)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    surface = models.PositiveIntegerField(help_text="m²")
    n_rooms = models.PositiveSmallIntegerField()
    floor_level = models.CharField(max_length=20)

    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.advert_code}] {self.title}"


class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="listings/%Y/%m/", blank=True)
    external_url = models.URLField(blank=True)  # transitional: legacy stored URLs
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    @property
    def url(self) -> str:
        return self.image.url if self.image else self.external_url
