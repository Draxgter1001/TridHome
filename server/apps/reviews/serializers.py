from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id", "target", "author_name", "rating", "text", "created_at"]

    def get_author_name(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or "Utente"

    def validate(self, attrs):
        user = self.context["request"].user
        if attrs["target"].id == user.id:
            raise serializers.ValidationError("Non puoi recensire te stesso.")
        if Review.objects.filter(target=attrs["target"], author=user).exists():
            raise serializers.ValidationError("Hai già recensito questo profilo.")
        return attrs
