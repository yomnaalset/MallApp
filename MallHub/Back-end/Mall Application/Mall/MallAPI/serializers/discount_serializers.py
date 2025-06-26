from rest_framework import serializers
from MallAPI.models.discount_model import DiscountCode

class DiscountCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCode
        fields = ['id', 'code', 'value', 'description', 'is_active', 'expiration_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at'] 