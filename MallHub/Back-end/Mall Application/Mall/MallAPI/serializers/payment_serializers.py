from rest_framework import serializers
from MallAPI.models.payment_model import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'payment_id', 'amount', 'status', 'created_at']
        error_messages = {
            'amount': {
                'min_value': 'Amount must be greater than 0',
                'invalid': 'Amount must be a valid number'
            }
        }

class CardDetailsSerializer(serializers.Serializer):
    card_number = serializers.CharField(max_length=16, required=True)
    expiry_month = serializers.CharField(max_length=2, required=True)
    expiry_year = serializers.CharField(max_length=2, required=True)
    cvv = serializers.CharField(max_length=3, required=True)

    def validate_card_number(self, value):
        if not value.isdigit() or len(value) != 16:
            raise serializers.ValidationError("Card number must be 16 digits")
        return value

    def validate_expiry_month(self, value):
        if not value.isdigit() or not (1 <= int(value) <= 12):
            raise serializers.ValidationError("Invalid expiry month")
        return value

    def validate_expiry_year(self, value):
        if not value.isdigit() or len(value) != 2:
            raise serializers.ValidationError("Expiry year must be 2 digits")
        return value

    def validate_cvv(self, value):
        if not value.isdigit() or len(value) != 3:
            raise serializers.ValidationError("CVV must be 3 digits")
        return value

class PaymentCreateSerializer(serializers.ModelSerializer):
    cart_items = serializers.ListField(child=serializers.IntegerField(), write_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'amount', 'payment_id', 'status', 'cart_items']
        read_only_fields = ['id', 'payment_id', 'status']
        error_messages = {
            'amount': {
                'required': 'Amount is required',
                'min_value': 'Amount must be greater than 0',
                'invalid': 'Amount must be a valid number'
            }
        }

    def create(self, validated_data):
        cart_items = validated_data.pop('cart_items')
        # Generate a unique payment ID
        import uuid
        validated_data['payment_id'] = str(uuid.uuid4())
        validated_data['status'] = Payment.PENDING
        
        payment = Payment.objects.create(**validated_data)
        return payment
