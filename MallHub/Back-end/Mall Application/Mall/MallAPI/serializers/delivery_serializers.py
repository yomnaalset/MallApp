from rest_framework import serializers
from MallAPI.models.delivery_model import DeliveryOrder, ReturnOrder
from MallAPI.serializers.store_serializers import ProductSerializer
from django.utils import timezone

class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id')
    product_name = serializers.CharField(source='product.name')
    product_image = serializers.SerializerMethodField()
    quantity = serializers.IntegerField()

    class Meta:
        model = DeliveryOrder
        fields = ['product_id', 'product_name', 'product_image', 'quantity']

    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product.image and request:
            return request.build_absolute_uri(obj.product.image.url)
        return None

class DeliveryOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='payment.user.name', read_only=True)
    customer_email = serializers.CharField(source='payment.user.email', read_only=True)
    customer_phone = serializers.CharField(source='payment.user.phone_number', read_only=True)
    customer_address = serializers.CharField(source='payment.user.address', read_only=True)
    payment_id = serializers.CharField(source='payment.payment_id', read_only=True)
    order_items = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(source='payment.amount', max_digits=10, decimal_places=2, read_only=True)
    has_return = serializers.SerializerMethodField()
    is_return_eligible = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryOrder
        fields = [
            'id', 'status', 'assigned_at', 'delivered_at',
            'customer_name', 'customer_email', 'customer_phone',
            'customer_address', 'payment_id', 'order_items',
            'total_amount', 'has_return', 'is_return_eligible'
        ]
        error_messages = {
            'status': {
                'invalid_choice': 'Invalid delivery status',
                'required': 'Status is required'
            },
            'assigned_at': {
                'invalid': 'Invalid assignment date'
            },
            'delivered_at': {
                'invalid': 'Invalid delivery date'
            }
        }

    def validate(self, data):
        if 'delivered_at' in data and not data.get('assigned_at'):
            raise serializers.ValidationError("Order must be assigned before delivery")
        return data

    def get_order_items(self, obj):
        # Get cart items from the payment's cart
        cart_items = obj.payment.cart.items.all()
        return OrderItemSerializer(
            cart_items, 
            many=True,
            context={'request': self.context.get('request')}
        ).data
    
    def get_has_return(self, obj):
        """Check if delivery order has a return request"""
        try:
            return hasattr(obj, 'return_order')
        except:
            return False
    
    def get_is_return_eligible(self, obj):
        """Check if order is eligible for return (within 48 hours of delivery)"""
        if not obj.delivered_at:
            return False
        
        time_since_delivery = timezone.now() - obj.delivered_at
        return time_since_delivery.total_seconds() <= (48 * 3600)  # 48 hours in seconds

class ReturnOrderSerializer(serializers.ModelSerializer):
    delivery_order_id = serializers.PrimaryKeyRelatedField(
        source='delivery_order',
        queryset=DeliveryOrder.objects.filter(status='DELIVERED')
    )
    customer_name = serializers.SerializerMethodField()
    customer_address = serializers.SerializerMethodField()
    order_items = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ReturnOrder
        fields = [
            'id', 'delivery_order_id', 'reason', 'status',
            'created_at', 'created_at_formatted', 'updated_at', 'completed_at',
            'customer_name', 'customer_address', 'order_items'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']
    
    def get_customer_name(self, obj):
        return obj.delivery_order.payment.user.name if obj.delivery_order and obj.delivery_order.payment else None
    
    def get_customer_address(self, obj):
        return obj.delivery_order.payment.user.address if obj.delivery_order and obj.delivery_order.payment else None
    
    def get_order_items(self, obj):
        if not obj.delivery_order or not obj.delivery_order.payment or not obj.delivery_order.payment.cart:
            return []
        
        # Get cart items from the payment's cart
        cart_items = obj.delivery_order.payment.cart.items.all()
        return OrderItemSerializer(
            cart_items, 
            many=True,
            context={'request': self.context.get('request')}
        ).data
    
    def get_created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%B %d, %Y, %H:%M %p')
        return None
    
    def validate_delivery_order_id(self, value):
        """Validate that the order is eligible for return"""
        # Check that order status is DELIVERED
        if value.status != 'DELIVERED':
            raise serializers.ValidationError("Only delivered orders can be returned")
        
        # Check if order already has a return request
        if hasattr(value, 'return_order'):
            raise serializers.ValidationError("This order already has a return request")
        
        # Check 48-hour timeframe
        if not value.delivered_at:
            raise serializers.ValidationError("Delivery date not recorded")
        
        time_since_delivery = timezone.now() - value.delivered_at
        if time_since_delivery.total_seconds() > (48 * 3600):  # 48 hours in seconds
            raise serializers.ValidationError("Return period has expired (48 hours)")
        
        return value

class ReturnOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnOrder
        fields = ['delivery_order', 'reason']
        
    def validate_delivery_order(self, value):
        """Validate that the order is eligible for return"""
        # Check that order status is DELIVERED
        if value.status != 'DELIVERED':
            raise serializers.ValidationError("Only delivered orders can be returned")
        
        # Check if order already has a return request
        if hasattr(value, 'return_order'):
            raise serializers.ValidationError("This order already has a return request")
        
        # Check 48-hour timeframe
        if not value.delivered_at:
            raise serializers.ValidationError("Delivery date not recorded")
        
        time_since_delivery = timezone.now() - value.delivered_at
        if time_since_delivery.total_seconds() > (48 * 3600):  # 48 hours in seconds
            raise serializers.ValidationError("Return period has expired (48 hours)")
        
        return value 