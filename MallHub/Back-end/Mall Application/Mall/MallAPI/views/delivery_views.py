from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from MallAPI.permissions import IsDeliveryUser
from MallAPI.services.delivery_services import DeliveryService, ReturnService
from MallAPI.serializers.delivery_serializers import DeliveryOrderSerializer, ReturnOrderSerializer, ReturnOrderCreateSerializer
from MallAPI.models.delivery_model import DeliveryOrder, ReturnOrder
from MallAPI.permissions import IsNormalUser, IsAdmin
from MallAPI.utils import format_error_message

class DeliveryOrderView(APIView):
    permission_classes = [IsAuthenticated, IsDeliveryUser]
    
    def get(self, request):
        """Get active orders assigned to delivery user"""
        try:
            orders = DeliveryService.get_delivery_user_orders(request.user)
            if not orders.exists():
                return Response({
                    "status": "info",
                    "message": "No active orders assigned"
                }, status=status.HTTP_200_OK)
                
            serializer = DeliveryOrderSerializer(
                orders, 
                many=True,
                context={'request': request}
            )
            return Response({
                "status": "success",
                "orders": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "Details": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, delivery_id):
        """Update delivery status"""
        try:
            new_status = request.data.get('status')
            if not new_status:
                return Response(
                    {"Details": "Status is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            delivery = DeliveryService.update_delivery_status(
                delivery_id=delivery_id,
                status=new_status,
                user=request.user
            )
            
            serializer = DeliveryOrderSerializer(delivery)
            return Response({
                "status": "success",
                "message": f"Delivery status updated to {new_status}",
                "delivery": serializer.data
            })
            
        except ValueError as e:
            return Response({
                "Details": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class DeliveryHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsDeliveryUser]
    
    def get(self, request):
        """Get delivery history"""
        try:
            orders = DeliveryService.get_delivery_user_history(request.user)
            serializer = DeliveryOrderSerializer(orders, many=True)
            return Response({
                "status": "success",
                "history": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class DeliveryView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request):
        try:
            delivery = DeliveryOrder.objects.get(user=request.user)
            serializer = DeliveryOrderSerializer(delivery)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DeliveryOrder.DoesNotExist:
            return Response(format_error_message("Delivery order not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = DeliveryOrderSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        try:
            delivery = DeliveryOrder.objects.get(user=request.user)
            serializer = DeliveryOrderSerializer(delivery, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except DeliveryOrder.DoesNotExist:
            return Response(format_error_message("Delivery order not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        try:
            delivery = DeliveryOrder.objects.get(user=request.user)
            delivery.delete()
            return Response({"message": "Delivery order deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except DeliveryOrder.DoesNotExist:
            return Response(format_error_message("Delivery order not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomerOrderReturnView(APIView):
    """View for customers to create and manage their return requests"""
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def get(self, request):
        """Get all return requests for the authenticated customer"""
        try:
            returns = ReturnService.get_user_return_orders(request.user)
            
            if not returns.exists():
                return Response({
                    "status": "info",
                    "message": "No return requests found"
                }, status=status.HTTP_200_OK)
            
            serializer = ReturnOrderSerializer(returns, many=True, context={'request': request})
            return Response({
                "status": "success",
                "returns": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new return request"""
        try:
            delivery_order_id = request.data.get('delivery_order_id')
            reason = request.data.get('reason')
            
            if not delivery_order_id:
                return Response(format_error_message("Delivery order ID is required"), 
                               status=status.HTTP_400_BAD_REQUEST)
            
            if not reason:
                return Response(format_error_message("Reason for return is required"), 
                               status=status.HTTP_400_BAD_REQUEST)
            
            return_order = ReturnService.create_return_request(
                delivery_order_id=delivery_order_id,
                user=request.user,
                reason=reason
            )
            
            serializer = ReturnOrderSerializer(return_order, context={'request': request})
            return Response({
                "status": "success",
                "message": "Return request created successfully",
                "return": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_return_order(self, return_id, user):
        """Helper method to get a return order and verify ownership"""
        try:
            return ReturnOrder.objects.get(id=return_id, user=user)
        except ReturnOrder.DoesNotExist:
            raise ValueError("Return order not found or not authorized")

class CustomerReturnDetailView(APIView):
    """View for customers to view details of a specific return request"""
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def get(self, request, return_id):
        """Get details of a specific return request"""
        try:
            return_order = ReturnOrder.objects.get(id=return_id, user=request.user)
            serializer = ReturnOrderSerializer(return_order, context={'request': request})
            return Response({
                "status": "success",
                "return": serializer.data
            }, status=status.HTTP_200_OK)
            
        except ReturnOrder.DoesNotExist:
            return Response(format_error_message("Return order not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DeliveryReturnOrdersView(APIView):
    """View for delivery users to manage return orders assigned to them"""
    permission_classes = [IsAuthenticated, IsDeliveryUser]
    
    def get(self, request):
        """Get all return orders assigned to the delivery user"""
        try:
            returns = ReturnService.get_delivery_user_returns(request.user)
            
            if not returns.exists():
                return Response({
                    "status": "info",
                    "message": "No return orders assigned"
                }, status=status.HTTP_200_OK)
            
            serializer = ReturnOrderSerializer(returns, many=True, context={'request': request})
            return Response({
                "status": "success",
                "returns": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, return_id):
        """Update status of a return order"""
        try:
            new_status = request.data.get('status')
            if not new_status:
                return Response(format_error_message("Status is required"), 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Validate that the return order is assigned to this delivery user
            return_order = ReturnOrder.objects.get(id=return_id, delivery_user=request.user)
            
            updated_return = ReturnService.update_return_status(
                return_id=return_id,
                status=new_status,
                user=request.user
            )
            
            serializer = ReturnOrderSerializer(updated_return, context={'request': request})
            return Response({
                "status": "success",
                "message": f"Return order status updated to {new_status}",
                "return": serializer.data
            }, status=status.HTTP_200_OK)
            
        except ReturnOrder.DoesNotExist:
            return Response(format_error_message("Return order not found or not assigned to you"), 
                           status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminReturnOrdersView(APIView):
    """View for admins to manage all return orders"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        """Get all return orders"""
        try:
            returns = ReturnOrder.objects.all().order_by('-created_at')
            
            # Filter by status if provided
            status_filter = request.query_params.get('status')
            if status_filter:
                returns = returns.filter(status=status_filter)
            
            if not returns.exists():
                return Response({
                    "status": "info",
                    "message": "No return orders found"
                }, status=status.HTTP_200_OK)
            
            serializer = ReturnOrderSerializer(returns, many=True, context={'request': request})
            return Response({
                "status": "success",
                "returns": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, return_id):
        """Update status of a return order"""
        try:
            new_status = request.data.get('status')
            delivery_user_id = request.data.get('delivery_user_id')
            
            if not new_status:
                return Response(format_error_message("Status is required"), 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Get return order
            return_order = ReturnOrder.objects.get(id=return_id)
            
            # If assigning to a delivery user
            if new_status == 'APPROVED' and delivery_user_id:
                return_order = ReturnService.assign_return_to_delivery_user(
                    return_id=return_id,
                    delivery_user_id=delivery_user_id
                )
            
            # Update status
            updated_return = ReturnService.update_return_status(
                return_id=return_id,
                status=new_status
            )
            
            serializer = ReturnOrderSerializer(updated_return, context={'request': request})
            return Response({
                "status": "success",
                "message": f"Return order status updated to {new_status}",
                "return": serializer.data
            }, status=status.HTTP_200_OK)
            
        except ReturnOrder.DoesNotExist:
            return Response(format_error_message("Return order not found"), 
                           status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response(format_error_message(str(e)), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Auto-assign approved returns to delivery users"""
        try:
            success, message = ReturnService.auto_assign_returns()
            
            return Response({
                "status": "success" if success else "error",
                "message": message
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR) 