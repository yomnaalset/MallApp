from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from MallAPI.services.cart_services import CartService
from MallAPI.serializers.cart_serializers import ShoppingCartSerializer, CartBillSerializer
from MallAPI.models.cart_model import ShoppingCart, CartItem
from MallAPI.models.store_model import Product
from MallAPI.permissions import IsNormalUser
from MallAPI.utils import format_error_message
import logging

logger = logging.getLogger(__name__)

class CartView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request):
        """View cart contents"""
        try:
            cart = CartService.get_or_create_active_cart(request.user)
            serializer = ShoppingCartSerializer(cart, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Add product to cart"""
        try:
            product_id = request.data.get('product_id')
            if not product_id:
                return Response(format_error_message("Product ID is required"), status=status.HTTP_400_BAD_REQUEST)
                
            quantity = int(request.data.get('quantity', 1))
            cart = CartService.add_to_cart(request.user, product_id, quantity)
            serializer = ShoppingCartSerializer(cart)
            return Response({
                "message": "Product added to cart successfully",
                "cart": serializer.data
            })
        except Product.DoesNotExist:
            return Response(format_error_message("Product not found"), status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        """Update cart item quantity"""
        try:
            item_id = request.data.get('item_id')
            if not item_id:
                return Response(format_error_message("Item ID is required"), status=status.HTTP_400_BAD_REQUEST)
                
            quantity = int(request.data.get('quantity', 0))
            cart = CartService.update_cart_item(request.user, item_id, quantity)
            serializer = ShoppingCartSerializer(cart)
            return Response({
                "message": "Cart updated successfully",
                "cart": serializer.data
            })
        except CartItem.DoesNotExist:
            return Response(format_error_message("Cart item not found"), status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        """Remove item from cart or clear entire cart"""
        try:
            item_id = request.query_params.get('item_id')
            if item_id:
                cart = CartService.remove_from_cart(request.user, item_id)
                message = "Product removed from cart successfully"
            else:
                cart = CartService.clear_cart(request.user)
                message = "Cart cleared successfully"
                
            serializer = ShoppingCartSerializer(cart)
            return Response({
                "message": message,
                "cart": serializer.data
            })
        except CartItem.DoesNotExist:
            return Response(format_error_message("Cart item not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request):
        """Decrease cart item quantity by 1"""
        try:
            item_id = request.data.get('item_id')
            if not item_id:
                return Response(
                    format_error_message("Item ID is required"), 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            logger.info(f"Attempting to decrease quantity for item_id: {item_id}")
            
            cart = CartService.decrease_cart_item_quantity(request.user, item_id)
            serializer = ShoppingCartSerializer(cart, context={'request': request})
            
            return Response({
                "message": "Cart updated successfully",
                "cart": serializer.data
            })
            
        except CartItem.DoesNotExist:
            logger.warning(f"Cart item not found: {item_id}")
            return Response(
                format_error_message("Cart item not found"), 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in patch request: {str(e)}", exc_info=True)
            return Response(
                format_error_message(str(e)), 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CartBillView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request):
        """View cart bill with user details"""
        try:
            cart = CartService.get_or_create_active_cart(request.user)
            serializer = CartBillSerializer(cart)
            return Response({
                "message": "Cart bill retrieved successfully",
                "bill": serializer.data
            })
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR) 