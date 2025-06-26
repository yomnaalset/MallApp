from django.utils import timezone
from MallAPI.models.delivery_model import DeliveryOrder, ReturnOrder
from MallAPI.models.payment_model import Payment
from MallAPI.models.user_model import User

class DeliveryService:
    @staticmethod
    def assign_delivery(payment_id):
        """Assign a delivery to an available delivery user"""
        try:
            payment = Payment.objects.get(id=payment_id)
            
            # Find any delivery user
            delivery_user = User.objects.filter(role='DELIVERY').first()
            
            if not delivery_user:
                raise ValueError("No delivery users available")
            
            # Check if delivery order already exists
            delivery_order, created = DeliveryOrder.objects.get_or_create(
                payment=payment,
                defaults={
                    'delivery_user': delivery_user,
                    'status': 'PENDING'
                }
            )
            
            if not created:
                print(f"Delivery order already exists for payment {payment_id}")
            else:
                print(f"Created new delivery order {delivery_order.id}")
                
            return delivery_order
            
        except Payment.DoesNotExist:
            raise ValueError(f"Payment {payment_id} not found")
        except Exception as e:
            raise ValueError(f"Error assigning delivery: {str(e)}")

    @staticmethod
    def update_delivery_status(delivery_id, status, user):
        """Update delivery status"""
        try:
            # Get active order that belongs to this delivery user
            delivery = DeliveryOrder.objects.get(
                id=delivery_id,
                delivery_user=user,
                status__in=['PENDING', 'IN_PROGRESS']  # Can only update active orders
            )
            
            # Validate status transition
            valid_transitions = {
                'PENDING': ['IN_PROGRESS'],
                'IN_PROGRESS': ['DELIVERED']
            }
            
            if status not in valid_transitions.get(delivery.status, []):
                raise ValueError(
                    f"Invalid status transition from {delivery.status} to {status}"
                )
            
            delivery.status = status
            if status == 'DELIVERED':
                delivery.delivered_at = timezone.now()
                
            delivery.save()
            return delivery
            
        except DeliveryOrder.DoesNotExist:
            raise ValueError("Active delivery order not found or not authorized")

    @staticmethod
    def get_delivery_user_orders(user):
        """Get all active (non-delivered) orders assigned to a delivery user"""
        return DeliveryOrder.objects.filter(
            delivery_user=user,
            status__in=['PENDING', 'IN_PROGRESS']  # Only get active orders
        ).select_related('payment__user').order_by('-assigned_at')

    @staticmethod
    def get_delivery_user_history(user):
        """Get delivery history (completed deliveries)"""
        return DeliveryOrder.objects.filter(
            delivery_user=user,
            status='DELIVERED'
        ).select_related('payment__user').order_by('-delivered_at')

class ReturnService:
    @staticmethod
    def create_return_request(delivery_order_id, user, reason):
        """Create a return request for a delivered order"""
        try:
            # TEMPORARILY: Allow IN_PROGRESS orders for testing (normally only DELIVERED)
            delivery_order = DeliveryOrder.objects.get(
                id=delivery_order_id,
                payment__user=user,  # Ensure the order belongs to this user
                status__in=['DELIVERED', 'IN_PROGRESS']  # Allow both for testing
            )
            
            # Check if return already exists
            if hasattr(delivery_order, 'return_order'):
                raise ValueError("A return request already exists for this order")
            
            # For testing: Skip 48-hour check for IN_PROGRESS orders
            if delivery_order.status == 'DELIVERED':
                # Check if within 48-hour return window
                if delivery_order.delivered_at:
                    time_since_delivery = timezone.now() - delivery_order.delivered_at
                    if time_since_delivery.total_seconds() > (48 * 3600):  # 48 hours in seconds
                        raise ValueError("Return period has expired (48 hours)")
                else:
                    raise ValueError("Delivery date not recorded for this order")
            
            # Create return order and automatically assign to the original delivery user
            return_order = ReturnOrder.objects.create(
                delivery_order=delivery_order,
                user=user,
                reason=reason,
                status='APPROVED',  # Auto-approve and assign to original delivery user
                delivery_user=delivery_order.delivery_user  # Assign to original delivery user
            )
            
            return return_order
            
        except DeliveryOrder.DoesNotExist:
            raise ValueError("Delivered order not found")
        except Exception as e:
            raise ValueError(f"Error creating return request: {str(e)}")
    
    @staticmethod
    def get_user_return_orders(user):
        """Get all return orders created by a user"""
        return ReturnOrder.objects.filter(
            user=user
        ).select_related('delivery_order__payment').order_by('-created_at')
    
    @staticmethod
    def get_delivery_user_returns(user):
        """Get all return orders assigned to a delivery user"""
        return ReturnOrder.objects.filter(
            delivery_user=user
        ).select_related('delivery_order__payment__user').order_by('-created_at')
    
    @staticmethod
    def get_pending_returns():
        """Get all pending return orders that need to be assigned"""
        return ReturnOrder.objects.filter(
            status='APPROVED',
            delivery_user__isnull=True
        ).select_related('delivery_order__payment__user').order_by('-created_at')
    
    @staticmethod
    def update_return_status(return_id, status, user=None):
        """Update return order status"""
        try:
            return_order = ReturnOrder.objects.get(id=return_id)
            
            # Validate status transition
            valid_transitions = {
                'PENDING': ['APPROVED', 'REJECTED'],
                'APPROVED': ['IN_PROGRESS'],
                'IN_PROGRESS': ['COMPLETED']
            }
            
            if status not in valid_transitions.get(return_order.status, []):
                raise ValueError(
                    f"Invalid status transition from {return_order.status} to {status}"
                )
            
            # Additional validation for specific transitions
            if status == 'IN_PROGRESS' and not return_order.delivery_user:
                if not user or user.role != 'DELIVERY':
                    raise ValueError("Return must be assigned to a delivery user first")
                return_order.delivery_user = user
            
            # Update status
            return_order.status = status
            
            # Set completed timestamp if status is COMPLETED
            if status == 'COMPLETED':
                return_order.completed_at = timezone.now()
            
            return_order.save()
            return return_order
            
        except ReturnOrder.DoesNotExist:
            raise ValueError("Return order not found")
    
    @staticmethod
    def assign_return_to_delivery_user(return_id, delivery_user_id):
        """Assign a return order to a delivery user"""
        try:
            return_order = ReturnOrder.objects.get(id=return_id, status='APPROVED')
            delivery_user = User.objects.get(id=delivery_user_id, role='DELIVERY')
            
            return_order.delivery_user = delivery_user
            return_order.save()
            
            return return_order
            
        except ReturnOrder.DoesNotExist:
            raise ValueError("Approved return order not found")
        except User.DoesNotExist:
            raise ValueError("Delivery user not found")
    
    @staticmethod
    def auto_assign_returns():
        """Automatically assign approved returns to delivery users"""
        pending_returns = ReturnOrder.objects.filter(
            status='APPROVED',
            delivery_user__isnull=True
        )
        
        delivery_users = User.objects.filter(role='DELIVERY')
        
        if not delivery_users.exists():
            return False, "No delivery users available"
        
        assigned_count = 0
        for return_order in pending_returns:
            # Simple round-robin assignment
            delivery_user = delivery_users[assigned_count % delivery_users.count()]
            return_order.delivery_user = delivery_user
            return_order.save()
            assigned_count += 1
        
        return True, f"Assigned {assigned_count} returns to delivery users" 