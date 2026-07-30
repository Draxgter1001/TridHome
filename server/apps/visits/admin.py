from django.contrib import admin

from .models import AvailabilitySlot, VisitRequest

admin.site.register(AvailabilitySlot)
admin.site.register(VisitRequest)
