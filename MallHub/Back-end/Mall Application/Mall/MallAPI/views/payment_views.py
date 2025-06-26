from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from MallAPI.permissions import IsNormalUser
from MallAPI.models.cart_model import ShoppingCart
from MallAPI.services.payment_services import PayFlexService
from MallAPI.serializers.payment_serializers import PaymentSerializer, CardDetailsSerializer, PaymentCreateSerializer
from MallAPI.models.payment_model import Payment
from MallAPI.models.delivery_model import DeliveryOrder
from MallAPI.services.cart_services import CartService 
from MallAPI.services.loyalty_services import LoyaltyService
from MallAPI.utils import format_error_message
import stripe
from django.conf import settings
from MallAPI.serializers.delivery_serializers import DeliveryOrderSerializer

# Only set stripe key if it exists in settings
if hasattr(settings, 'STRIPE_SECRET_KEY'):
    stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentProcessView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def post(self, request):
        """Process payment with PayFlex"""
        # Extract discount code if provided
        discount_code = request.data.get('discount_code')
        
        card_serializer = CardDetailsSerializer(data=request.data)
        if not card_serializer.is_valid():
            return Response(format_error_message("Invalid card details"), status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Get active cart
            cart = CartService.get_or_create_active_cart(request.user)
            
            # Check if cart is empty
            if cart.items.count() == 0:
                return Response(format_error_message("Cart is empty"), status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate points to be earned before payment
            points_preview = LoyaltyService.calculate_purchase_points(cart.id)
            
            # Determine final amount: Apply discount if code is valid
            final_amount = CartService.get_cart_total(cart)
            discount_details = None
            if discount_code:
                try:
                    # Validate discount code again and get final amount
                    discount_result = LoyaltyService.apply_discount_code(discount_code, cart.id)
                    final_amount = discount_result['final_amount']
                    discount_details = discount_result # Store details for response
                    print(f"Discount {discount_code} applied. Final amount: {final_amount}")
                except ValueError as e:
                    # Handle invalid/used discount code applied at checkout stage
                    print(f"Discount code {discount_code} invalid at payment: {e}")
                    return Response(format_error_message(f"Discount code error: {e}"), status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    print(f"Error validating discount during payment: {e}")
                    return Response(format_error_message("Error processing discount during payment."), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            payment = PayFlexService.process_payment(
                user=request.user,
                cart=cart,
                amount=final_amount, # Pass the final amount
                card_details=card_serializer.validated_data
            )
            
            # Create new cart for future use
            CartService.get_or_create_active_cart(request.user)
            
            return Response({
                "status": "success",
                "message": "Payment processed successfully",
                "payment_details": {
                    "payment_id": payment.payment_id,
                    "amount": str(payment.amount),
                    "status": payment.status,
                    "timestamp": payment.created_at
                },
                "cart_details": {
                    "total_items": cart.items.count(),
                    "items": [{
                        "product_name": item.product.name,
                        "quantity": item.quantity,
                        "price": str(item.product.price),
                        "subtotal": str(item.product.price * item.quantity)
                    } for item in cart.items.all()],
                    "total_amount": str(payment.amount)
                },
                "loyalty_points": {
                    "earned": points_preview.get('total_points', 0),
                    "total_diamonds": points_preview.get('total_diamonds', 0),
                    "breakdown": points_preview.get('breakdown', [])
                },
                # Optionally include discount info in the response
                "discount_info": discount_details if discount_details else "No discount applied"
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Log the actual error
            print(f"Payment processing error: {str(e)}")
            return Response(format_error_message(f"Payment processing failed: {str(e)}"), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrderStatusView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def get(self, request):
        """Get latest order status for the user"""
        try:
            # Get user's latest payment
            payment = Payment.objects.filter(
                user=request.user,
                status='completed'
            ).latest('created_at')
            
            try:
                # Get delivery order and use DeliveryOrderSerializer to include return fields
                delivery = DeliveryOrder.objects.get(payment=payment)
                serializer = DeliveryOrderSerializer(delivery, context={'request': request})
                
                return Response({
                    'status': 'success',
                    'order_status': serializer.data
                })
                
            except DeliveryOrder.DoesNotExist:
                return Response(format_error_message('Payment found but no delivery order created. Please contact support.'), status=status.HTTP_404_NOT_FOUND)
                
        except Payment.DoesNotExist:
            return Response(format_error_message('No completed payment found for this user'), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentPreviewView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def get(self, request):
        """Get preview of payment details including potential reward points"""
        try:
            # Get active cart
            cart = CartService.get_or_create_active_cart(request.user)
            
            # Check if cart is empty
            if cart.items.count() == 0:
                return Response(format_error_message("Cart is empty"), status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate cart total
            cart_total = CartService.get_cart_total(cart)
            
            # Calculate potential loyalty points
            points_preview = LoyaltyService.calculate_purchase_points(cart.id)
            
            # Get cart items with store information
            cart_items = []
            store_diamonds = {}
            
            for item in cart.items.all():
                store = item.product.store
                if store.id not in store_diamonds:
                    # Get diamond quantity for this store
                    diamond = store.diamonds.first()
                    diamond_quantity = diamond.quantity if diamond else 0
                    store_diamonds[store.id] = {
                        "store_name": store.name,
                        "diamonds": diamond_quantity
                    }
                
                cart_items.append({
                    "product_name": item.product.name,
                    "quantity": item.quantity,
                    "price": str(item.product.price),
                    "subtotal": str(item.product.price * item.quantity),
                    "store_name": store.name,
                    "store_id": store.id
                })
            
            return Response({
                "cart_details": {
                    "total_items": cart.items.count(),
                    "items": cart_items,
                    "total_amount": str(cart_total)
                },
                "loyalty_points": {
                    "potential_points": points_preview.get('total_points', 0),
                    "total_diamonds": points_preview.get('total_diamonds', 0),
                    "breakdown": points_preview.get('breakdown', [])
                },
                "stores": list(store_diamonds.values())
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Apply discount code to cart"""
        try:
            discount_code = request.data.get('discount_code')
            if not discount_code:
                return Response(format_error_message("Discount code is required"), status=status.HTTP_400_BAD_REQUEST)
            
            # Get active cart
            cart = CartService.get_or_create_active_cart(request.user)
            
            # Apply discount code
            discount_result = LoyaltyService.apply_discount_code(discount_code, cart.id)
            
            return Response({
                "discount_applied": True,
                "original_amount": str(discount_result.get('original_amount')),
                "discount_percentage": discount_result.get('discount_percentage'),
                "discount_amount": str(discount_result.get('discount_amount')),
                "final_amount": str(discount_result.get('final_amount'))
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentIntentView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def post(self, request):
        try:
            cart = ShoppingCart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response(format_error_message("Cart is empty"), status=status.HTTP_400_BAD_REQUEST)

            # Calculate total amount
            amount = int(cart.total_price * 100)  # Convert to cents for Stripe

            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='usd',
                metadata={'user_id': request.user.id}
            )

            return Response({
                'client_secret': intent.client_secret
            }, status=status.HTTP_201_CREATED)

        except ShoppingCart.DoesNotExist:
            return Response(format_error_message("Cart not found"), status=status.HTTP_404_NOT_FOUND)
        except stripe.error.StripeError as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request):
        try:
            payments = Payment.objects.filter(user=request.user)
            serializer = PaymentSerializer(payments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            cart = ShoppingCart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response(format_error_message("Cart is empty"), status=status.HTTP_400_BAD_REQUEST)

            payment_data = {
                'amount': cart.total_price,
                'cart_items': [item.id for item in cart.items.all()]
            }

            serializer = PaymentCreateSerializer(data=payment_data)
            if serializer.is_valid():
                payment = serializer.save(user=request.user)
                # Clear the cart after successful payment
                cart.items.all().delete()
                return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)

        except ShoppingCart.DoesNotExist:
            return Response(format_error_message("Cart not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR) 