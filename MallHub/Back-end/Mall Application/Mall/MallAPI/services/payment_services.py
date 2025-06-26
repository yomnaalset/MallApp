import uuid
from datetime import datetime
from decimal import Decimal
from MallAPI.models.payment_model import Payment
from MallAPI.services.cart_services import CartService
from MallAPI.services.delivery_services import DeliveryService
from MallAPI.services.loyalty_services import LoyaltyService

class PayFlexService:
    @staticmethod
    def process_payment(user, cart, amount, card_details):
        """Process payment through PayFlex"""
        if not PayFlexService._validate_card(card_details):
            raise ValueError("Invalid card details")
        
        # Create payment record
        payment = Payment.objects.create(
            user=user,
            cart=cart,
            amount=amount,
            payment_id=f"PF-{uuid.uuid4().hex[:8].upper()}",
            status=Payment.COMPLETED
        )
        
        print(f"Payment created: {payment.payment_id}")  # Debug log
        
        # After successful payment, create delivery order
        try:
            delivery_order = DeliveryService.assign_delivery(payment.id)
            print(f"Delivery order created: {delivery_order.id}")  # Debug log
        except Exception as e:
            print(f"Error assigning delivery: {str(e)}")
        
        # Add loyalty points for the purchase
        try:
            points_added = LoyaltyService.add_points_after_payment(payment.payment_id)
            print(f"Loyalty points added: {points_added}")  # Debug log
        except Exception as e:
            print(f"Error adding loyalty points: {str(e)}")
            
        return payment

    @staticmethod
    def _validate_card(card_details):
        """Validate card details"""
        try:
            card_number = card_details.get('card_number', '')
            expiry_month = card_details.get('expiry_month', '')
            expiry_year = card_details.get('expiry_year', '')
            cvv = card_details.get('cvv', '')

            # Basic validations
            if not card_number.isdigit() or len(card_number) != 16:
                raise ValueError("Card number must be 16 digits")

            if not expiry_month.isdigit() or not (1 <= int(expiry_month) <= 12):
                raise ValueError("Invalid expiry month")

            current_year = int(str(datetime.now().year)[2:])
            if int(expiry_year) < current_year:
                raise ValueError("Card has expired")

            if not cvv.isdigit() or len(cvv) != 3:
                raise ValueError("Invalid CVV")

            return True

        except ValueError as e:
            raise ValueError(str(e))
