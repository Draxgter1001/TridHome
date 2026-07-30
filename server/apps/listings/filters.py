import django_filters as df

from .models import Listing


class ListingFilter(df.FilterSet):
    """Mirrors the legacy FilterForm fields 1:1."""

    min_price = df.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = df.NumberFilter(field_name="price", lookup_expr="lte")
    min_surface = df.NumberFilter(field_name="surface", lookup_expr="gte")
    max_surface = df.NumberFilter(field_name="surface", lookup_expr="lte")
    n_rooms = df.NumberFilter(field_name="n_rooms", lookup_expr="gte")
    province = df.CharFilter(lookup_expr="icontains")
    county = df.CharFilter(lookup_expr="icontains")
    post_code = df.CharFilter()

    class Meta:
        model = Listing
        fields = ["category", "typology", "contract", "province", "county", "post_code"]
