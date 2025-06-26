from rest_framework import serializers
from MallAPI.models.cart_model import ShoppingCart, CartItem
from MallAPI.models.store_model import StoreDiscount
from .store_serializers import ProductSerializer
from decimal import Decimal

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    total_price = serializers.SerializerMethodField()
    product_image_url = serializers.SerializerMethodField()
    is_prize_redemption = serializers.BooleanField(read_only=True)
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'total_price', 'product_image_url', 'is_prize_redemption', 'discounted_price']
        error_messages = {
            'quantity': {
                'min_value': 'Quantity must be at least 1',
                'max_value': 'Quantity cannot exceed 100'
            }
        }

    def get_discounted_price(self, obj):
        if not obj.product.store:
            return None
            
        try:
            discount = StoreDiscount.objects.filter(store=obj.product.store, is_active=True).first()
            if discount and discount.percentage > 0:
                discounted_price = float(obj.product.price) * (1 - (float(discount.percentage) / 100))
                return round(discounted_price, 2)
        except Exception:
            pass
        return None

    def get_total_price(self, obj):
        # Check if there's a store discount
        discounted_price = self.get_discounted_price(obj)
        if discounted_price is not None:
            return Decimal(str(discounted_price)) * obj.quantity
        # Otherwise use regular price
        return obj.product.price * obj.quantity

    def get_product_image_url(self, obj):
        if obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
        return None

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1")
        if value > 100:
            raise serializers.ValidationError("Quantity cannot exceed 100")
        return value

class ShoppingCartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = ShoppingCart
        fields = ['id', 'items', 'total', 'created_at', 'updated_at']

    def get_total(self, obj):
        total = Decimal('0.00')
        for item in obj.items.all():
            # Get the cart item serializer to use its logic for discounted prices
            item_serializer = CartItemSerializer(item, context=self.context)
            total += Decimal(str(item_serializer.get_total_price(item)))
        return total

class CartBillSerializer(ShoppingCartSerializer):
    user_address = serializers.CharField(source='user.address', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    
    class Meta(ShoppingCartSerializer.Meta):
        fields = ShoppingCartSerializer.Meta.fields + ['user_address', 'user_phone'] 