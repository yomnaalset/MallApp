from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from MallAPI.permissions import IsAdmin, IsNormalUser
from MallAPI.services.loyalty_services import LoyaltyService
from MallAPI.models.Loyalty_models import Prize, GlobalLoyaltySetting
from MallAPI.serializers.Loyalty_Serializers import (
    DiamondSerializer,
    UserPointsSerializer,
    PrizeSerializer,
    PrizeRedemptionSerializer,
    PointsPreviewSerializer,
    DiscountApplicationSerializer,
    PointsConversionSerializer,
    StoreWithDiamondsSerializer,
    GlobalLoyaltySettingSerializer
)
from MallAPI.utils import format_error_message

class GlobalLoyaltySettingView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        """Get global loyalty settings"""
        try:
            settings = GlobalLoyaltySetting.get_settings()
            serializer = GlobalLoyaltySettingSerializer(settings)
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request):
        """Update diamond points value"""
        try:
            diamond_points_value = request.data.get('diamond_points_value')
            
            if not diamond_points_value:
                return Response(
                    format_error_message("Diamond points value is required"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            settings = GlobalLoyaltySetting.get_settings()
            settings.diamond_points_value = diamond_points_value
            settings.save()
            
            # Update this value for all existing diamonds
            LoyaltyService.update_all_diamonds_points_value(diamond_points_value)
            
            serializer = GlobalLoyaltySettingSerializer(settings)
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminDiamondView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        """Get all stores with their diamonds"""
        try:
            stores = LoyaltyService.get_all_stores_with_diamonds()
            serializer = StoreWithDiamondsSerializer(stores, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Assign diamonds to a store"""
        try:
            store_id = request.data.get('store_id')
            quantity = request.data.get('quantity', 1)  # Default to 1 if not provided
            
            if not store_id:
                return Response(
                    format_error_message("Store ID is required"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # We don't need points_value from the request as we'll use the global value
            diamond = LoyaltyService.assign_diamonds(store_id, None, quantity)
            serializer = DiamondSerializer(diamond, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, diamond_id):
        """Update diamond quantity"""
        try:
            quantity = request.data.get('quantity')
            
            if not quantity:
                return Response(
                    format_error_message("Quantity is required"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Only update quantity, always use global points value
            update_data = {'quantity': quantity}
                
            diamond = LoyaltyService.update_diamond(diamond_id, **update_data)
            serializer = DiamondSerializer(diamond, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, diamond_id):
        """Delete a diamond"""
        try:
            LoyaltyService.delete_diamond(diamond_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminPrizeView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request, store_id=None):
        """Get all prizes for a store or all prizes if store_id is None"""
        try:
            if store_id:
                prizes = LoyaltyService.get_store_prizes(store_id)
            else:
                # For admin users, get all prizes
                prizes = Prize.objects.all()
            serializer = PrizeSerializer(prizes, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new prize"""
        try:
            # Pass request context to serializer for admin user detection
            serializer = PrizeSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                # Extract validated data
                validated_data = serializer.validated_data
                
                # For admin users, explicitly handle the store_id
                store_id = None
                if 'store' in validated_data and validated_data['store'] is not None:
                    store_id = validated_data['store'].id
                    # Remove store from validated_data as create_prize expects store_id
                    validated_data.pop('store')
                
                # Extract gift product fields if it's a product
                product_name = None
                product_description = None
                product_image = None
                is_product = validated_data.get('is_product', False)
                
                if is_product:
                    product_name = validated_data.get('product_name')
                    product_description = validated_data.get('product_description')
                    product_image = validated_data.get('product_image')
                
                # Create the prize with the correct parameters
                prize = LoyaltyService.create_prize(
                    name=validated_data.get('name'),
                    description=validated_data.get('description'),
                    points_required=validated_data.get('points_required'),
                    store_id=store_id,
                    is_product=is_product,
                    discount_percentage=validated_data.get('discount_percentage'),
                    image=validated_data.get('image'),
                    product_name=product_name,
                    product_description=product_description,
                    product_image=product_image
                )
                
                return Response(PrizeSerializer(prize, context={'request': request}).data, status=status.HTTP_201_CREATED)
            return Response(format_error_message(serializer.errors), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, prize_id):
        """Update prize details"""
        try:
            # Simply pass all form data to the service layer
            update_data = request.data.copy()
            
            # The service layer will handle validation of gift product fields
            prize = LoyaltyService.update_prize(prize_id, **update_data)
            return Response(PrizeSerializer(prize, context={'request': request}).data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, prize_id):
        """Delete a prize"""
        try:
            LoyaltyService.delete_prize(prize_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomerPointsView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def get(self, request):
        """Get user's points for all stores"""
        try:
            points = LoyaltyService.get_user_points(request.user.id)
            serializer = UserPointsSerializer(points, many=True, context={'request': request})
            
            # Calculate total points across all stores for convenience
            total_points = 0
            if isinstance(points, list) or hasattr(points, '__iter__'):
                for point in points:
                    try:
                        total_points += point.points
                    except (AttributeError, TypeError):
                        pass
            
            # Return both the detailed points per store and a total sum
            return Response({
                'points_per_store': serializer.data,
                'total_points': total_points,
            })
        except Exception as e:
            print(f"Error fetching user points: {str(e)}")
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomerPrizeView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def get(self, request):
        """Get available prizes"""
        try:
            prizes = LoyaltyService.get_store_prizes(None)
            serializer = PrizeSerializer(prizes, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Redeem a prize"""
        try:
            prize_id = request.data.get('prize_id')
            if not prize_id:
                return Response(
                    format_error_message("Prize ID is required"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            redemption = LoyaltyService.redeem_prize(request.user.id, prize_id)
            serializer = PrizeRedemptionSerializer(redemption, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomerRedemptionHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def get(self, request):
        """Get user's redemption history"""
        try:
            history = LoyaltyService.get_redemption_history(request.user.id)
            serializer = PrizeRedemptionSerializer(history, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckoutPointsPreviewView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def get(self, request):
        """Get points preview for cart at checkout"""
        try:
            cart_id = request.query_params.get('cart_id')
            if not cart_id:
                return Response(
                    format_error_message("Cart ID is required"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            points_preview = LoyaltyService.calculate_purchase_points(cart_id)
            serializer = PointsPreviewSerializer(points_preview)
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ApplyDiscountView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def post(self, request):
        """Apply discount code to cart"""
        try:
            discount_code = request.data.get('discount_code')
            cart_id = request.data.get('cart_id')
            
            if not all([discount_code, cart_id]):
                return Response(
                    format_error_message("Discount code and cart ID are required"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            discount_result = LoyaltyService.apply_discount_code(discount_code, cart_id)
            serializer = DiscountApplicationSerializer(discount_result)
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)

class PointsConversionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id=None):
        """Get points conversion rates for stores"""
        try:
            if store_id:
                conversion = LoyaltyService.get_store_points_conversion(store_id)
                serializer = PointsConversionSerializer(conversion)
            else:
                stores = LoyaltyService.get_all_stores_with_diamonds()
                conversions = []
                for store in stores:
                    conversion = LoyaltyService.get_store_points_conversion(store.id)
                    conversions.append(conversion)
                serializer = PointsConversionSerializer(conversions, many=True)
            
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)