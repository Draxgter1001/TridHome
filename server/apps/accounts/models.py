from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Single user table; role decides which profile table applies."""

    class Role(models.TextChoices):
        PRIVATE = "private", "Privato"
        AGENCY = "agency", "Agenzia"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.PRIVATE)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    google_sub = models.CharField(max_length=64, blank=True, db_index=True)
    is_verified = models.BooleanField(default=False)  # "Verificato" badge
    avatar = models.ImageField(upload_to="avatars/", blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email} ({self.role})"


class PrivateProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="private_profile")
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"PrivateProfile<{self.user.email}>"


class AgencyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="agency_profile")
    official_name = models.CharField(max_length=255)
    vat_number = models.CharField("Partita IVA", max_length=20, unique=True)
    office_address = models.CharField(max_length=255)
    opening_hours = models.JSONField(default=dict, blank=True)
    website = models.URLField(blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    bio = models.TextField(blank=True)
    logo = models.ImageField(upload_to="agency_logos/", blank=True)

    def __str__(self):
        return self.official_name


class VerificationDocument(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "In attesa"
        APPROVED = "approved", "Approvato"
        REJECTED = "rejected", "Rifiutato"

    class DocType(models.TextChoices):
        ID_CARD = "id_card", "Documento d'identità"
        VAT_CERT = "vat_cert", "Certificato P.IVA / Visura"
        CHAMBER_REG = "chamber_reg", "Iscrizione Camera di Commercio"
        OTHER = "other", "Altro"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_documents")
    doc_type = models.CharField(max_length=20, choices=DocType.choices)
    file = models.FileField(upload_to="verification/%Y/%m/")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reject_reason = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Badge rule: any approved document verifies the user (Alpha policy).
        if self.status == self.Status.APPROVED and not self.user.is_verified:
            self.user.is_verified = True
            self.user.save(update_fields=["is_verified"])
