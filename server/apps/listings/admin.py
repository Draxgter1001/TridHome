from django.contrib import admin

from .models import Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("advert_code", "title", "category", "contract", "price", "owner", "is_published")
    list_filter = ("category", "contract", "is_published")
    search_fields = ("title", "advert_code", "county")
    inlines = [ListingImageInline]
