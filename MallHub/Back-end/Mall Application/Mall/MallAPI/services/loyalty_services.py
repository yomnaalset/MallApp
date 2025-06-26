from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Sum
from MallAPI.models.Loyalty_models import Diamond, UserPoints, Prize, PrizeRedemption, GlobalLoyaltySetting
from MallAPI.models.store_model import Store
from MallAPI.models.cart_model import ShoppingCart, CartItem
from MallAPI.models.payment_model import Payment
from MallAPI.models.discount_model import DiscountCode
from django.utils import timezone
from MallAPI.services.cart_services import CartService
import random
import string
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class LoyaltyService:
    @staticmethod
    def get_global_settings():
        """Get global loyalty settings"""
        return GlobalLoyaltySetting.get_settings()
    
    @staticmethod
    def update_global_diamond_points_value(points_value):
        """Update global diamond points value"""
        settings = GlobalLoyaltySetting.get_settings()
        settings.diamond_points_value = points_value
        settings.save()
        return settings

    @staticmethod
    def update_all_diamonds_points_value(points_value):
        """Update points_value for all existing diamonds"""
        Diamond.objects.all().update(points_value=points_value)
    
    @staticmethod
    def get_all_stores_with_diamonds():
        """Get all stores with their assigned diamonds"""
        return Store.objects.prefetch_related('diamonds').all()
    
    @staticmethod
    def assign_diamonds(store_id, points_value, quantity=1):
        """Assign diamonds to a store"""
        store = get_object_or_404(Store, id=store_id)
        
        # Always use global diamond points value
        settings = GlobalLoyaltySetting.get_settings()
        points_value = settings.diamond_points_value
            
        diamond = Diamond.objects.create(
            store=store,
            points_value=points_value,
            quantity=quantity
        )
        return diamond
    
    @staticmethod
    def update_diamond(diamond_id, **kwargs):
        """Update diamond quantity and apply global points value"""
        diamond = get_object_or_404(Diamond, id=diamond_id)
        
        # Always use global value - enforcing the global setting
        settings = GlobalLoyaltySetting.get_settings()
        kwargs['points_value'] = settings.diamond_points_value
        
        for key, value in kwargs.items():
            setattr(diamond, key, value)
            
        diamond.save()
        return diamond
    
    @staticmethod
    def delete_diamond(diamond_id):
        """Delete a diamond from a store"""
        diamond = get_object_or_404(Diamond, id=diamond_id)
        diamond.delete()
    
    @staticmethod
    def get_store_prizes(store_id=None):
        """Get all prizes for a store or all prizes if store_id is None"""
        if store_id:
            return Prize.objects.filter(store_id=store_id)
        else:
            # Return all prizes when store_id is None (for admin users)
            return Prize.objects.all()
    
    @staticmethod
    def create_prize(name, description, points_required, store_id=None, is_product=False, discount_percentage=None, image=None, product_name=None, product_description=None, product_image=None):
        """Create a new prize"""
        # For admin users, store_id might be None
        store = None
        if store_id:
            store = get_object_or_404(Store, id=store_id)
            
        prize_data = {
            'name': name,
            'description': description,
            'points_required': points_required,
            'is_product': is_product,
            'discount_percentage': discount_percentage,
            'image': image
        }
        
        # Handle gift product (now the only option when is_product is true)
        if is_product and product_name:
            prize_data['product_name'] = product_name
            prize_data['product_description'] = product_description
            prize_data['product_image'] = product_image
        
        if store:
            prize_data['store'] = store
            
        prize = Prize.objects.create(**prize_data)
        return prize
    
    @staticmethod
    def update_prize(prize_id, **kwargs):
        """Update prize details"""
        prize = get_object_or_404(Prize, id=prize_id)
        
        # Handle gift product fields
        if kwargs.get('is_product'):
            # If this is a product prize, make sure we have gift product fields
            if not kwargs.get('product_name'):
                # If no product_name, this is not a valid gift product
                kwargs['is_product'] = False
        
        for key, value in kwargs.items():
            setattr(prize, key, value)
            
        prize.save()
        return prize
    
    @staticmethod
    def delete_prize(prize_id):
        """Delete a prize"""
        prize = get_object_or_404(Prize, id=prize_id)
        prize.delete()
    
    @staticmethod
    def get_user_points(user_id, store_id=None):
        """Get user points for all stores or a specific store"""
        if store_id:
            return UserPoints.objects.filter(user_id=user_id, store_id=store_id).first()
        return UserPoints.objects.filter(user_id=user_id)
    
    @staticmethod
    def add_points(user_id, store_id, points):
        """Add points to user's account"""
        user_points, created = UserPoints.objects.get_or_create(
            user_id=user_id,
            store_id=store_id,
            defaults={'points': 0}
        )
        user_points.points += points
        user_points.save()
        return user_points
    
    @staticmethod
    def redeem_prize(user_id, prize_id):
        """Redeem a prize with points, checking total points and deducting across stores."""
        with transaction.atomic():
            prize = get_object_or_404(Prize, id=prize_id)
            
            # 1. Get user's total points across all stores
            user_point_records = UserPoints.objects.filter(user_id=user_id)
            total_user_points = user_point_records.aggregate(total=Sum('points'))['total'] or 0
            
            # 2. Check if total points are sufficient
            if total_user_points < prize.points_required:
                raise ValueError("Insufficient total points for redemption")
            
            # 3. Deduct points across stores
            points_to_deduct = prize.points_required
            
            # Prioritize deducting from the prize's store if it exists
            if prize.store:
                try:
                    store_points_record = user_point_records.get(store=prize.store)
                    deduct_from_this_store = min(store_points_record.points, points_to_deduct)
                    store_points_record.points -= deduct_from_this_store
                    store_points_record.save()
                    points_to_deduct -= deduct_from_this_store
                except UserPoints.DoesNotExist:
                    pass # User has no points for this specific store, continue to others
            
            # Deduct remaining points from other stores (or all if prize has no store)
            if points_to_deduct > 0:
                # Order records to deduct consistently (e.g., highest points first)
                other_point_records = user_point_records.exclude(store=prize.store).order_by('-points')
                
                for record in other_point_records:
                    if points_to_deduct <= 0:
                        break
                    deduct_from_this_store = min(record.points, points_to_deduct)
                    record.points -= deduct_from_this_store
                    record.save()
                    points_to_deduct -= deduct_from_this_store

            # Ensure all points were deducted (shouldn't happen if total check passed, but good validation)
            if points_to_deduct > 0:
                 # This indicates a logic error or race condition, rollback transaction
                 raise Exception("Failed to deduct all required points despite sufficient total.")
            
            # 4. Create redemption record
            redemption_data = {
                'user_id': user_id,
                'prize': prize
            }
            
            if not prize.is_product and prize.discount_percentage:
                # Use the prize name as the discount code
                # discount_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
                redemption_data['discount_code'] = prize.name # Use prize name
            
            redemption = PrizeRedemption.objects.create(**redemption_data)
            
            if prize.is_product:
                redemption.status = 'approved'
                redemption.save()
                
                # Add the linked product to the user's cart directly
                if prize.product: # Check if the prize has a linked product
                    try:
                        # Get the user's active cart
                        cart = CartService.get_or_create_active_cart(user=redemption.user) # Use redemption.user
                        
                        # Get or create the CartItem, ensuring quantity is 1 and flag is set
                        cart_item, created = CartItem.objects.update_or_create(
                            cart=cart,
                            product=prize.product,
                            defaults={'quantity': 1, 'is_prize_redemption': True}
                        )

                        print(f"Product {prize.product.name} (ID: {prize.product.id}) added/updated in cart for user {user_id} after redeeming prize {prize.id}. Quantity forced to 1.")
                    except Exception as cart_error:
                        # Log error but don't fail the redemption itself
                        print(f"Error adding prize product {prize.product.id} to cart for user {user_id}: {cart_error}")
                        # Optionally, you could raise a specific exception or return a different response
                else:
                    # Log a warning if a prize is marked as product but doesn't link to one
                    print(f"Warning: Prize {prize.id} is marked as product but has no linked product object.")
            
            return redemption
    
    @staticmethod
    def get_redemption_history(user_id):
        """Get user's prize redemption history"""
        return PrizeRedemption.objects.filter(user_id=user_id)
    
    @staticmethod
    def calculate_purchase_points(cart_id):
        """Calculate points to be earned from a purchase"""
        try:
            cart = get_object_or_404(ShoppingCart, id=cart_id)
            settings = GlobalLoyaltySetting.get_settings()
            
            # Get the unique stores in the cart, skipping items with no store
            stores_in_cart = set()
            for item in cart.items.all():
                if item.product and item.product.store:
                    stores_in_cart.add(item.product.store.id)
                # else: Product or its store is None, skip for points calculation
            
            # Calculate points based on diamonds for each store
            points_breakdown = []
            total_points = 0
            total_diamonds = 0
            
            for store_id in stores_in_cart:
                try:
                    # Get the store
                    store = Store.objects.get(id=store_id)
                    
                    # Get the store's diamonds
                    diamond = Diamond.objects.filter(store_id=store_id).first()
                    if diamond:
                        # Calculate points based on the number of diamonds the store has
                        diamond_count = diamond.quantity
                        store_points = diamond_count * settings.diamond_points_value
                        
                        # Calculate the amount spent in this store for the breakdown
                        store_amount = sum(
                            item.quantity * item.product.price
                            for item in cart.items.all()
                            # Ensure product and store exist before checking ID
                            if item.product and item.product.store and item.product.store.id == store_id
                        )
                        
                        total_diamonds += diamond_count
                        total_points += store_points
                        
                        points_breakdown.append({
                            'store_id': store_id,
                            'store_name': store.name,
                            'amount': store_amount,
                            'diamond_count': diamond_count,
                            'points': store_points
                        })
                except Exception as e:
                    print(f"Error calculating points for store {store_id}: {str(e)}")
                    # Skip if any error occurs for a store
                    continue
            
            return {
                'total_points': total_points,
                'total_diamonds': total_diamonds,
                'breakdown': points_breakdown
            }
        except Exception as e:
            raise ValueError(f"Error calculating points: {str(e)}")
    
    @staticmethod
    def add_points_after_payment(payment_id):
        """Add points to user after successful payment"""
        try:
            payment = get_object_or_404(Payment, payment_id=payment_id, status=Payment.COMPLETED)
            cart = payment.cart
            user_id = payment.user.id
            settings = GlobalLoyaltySetting.get_settings()
            
            # Get the unique stores in the cart
            stores_in_cart = set()
            for item in cart.items.all():
                stores_in_cart.add(item.product.store.id)
            
            # Add points for each store based on their diamonds
            points_added = []
            for store_id in stores_in_cart:
                try:
                    # Get the store
                    store = Store.objects.get(id=store_id)
                    
                    # Get the store's diamonds
                    diamond = Diamond.objects.filter(store_id=store_id).first()
                    if diamond:
                        # Calculate points based on the number of diamonds the store has
                        diamond_count = diamond.quantity
                        store_points = diamond_count * settings.diamond_points_value
                        
                        # Add these points to the user's account
                        user_points = LoyaltyService.add_points(user_id, store_id, store_points)
                        
                        points_added.append({
                            'store_id': store_id,
                            'store_name': store.name,
                            'diamond_count': diamond_count,
                            'points_added': store_points,
                            'total_points': user_points.points
                        })
                except Exception as e:
                    print(f"Error adding points for store {store_id}: {str(e)}")
                    # Skip if any error occurs for a store
                    continue
            
            return points_added
        except Exception as e:
            raise ValueError(f"Error adding points: {str(e)}")
    
    @staticmethod
    def apply_discount_code(discount_code, cart_id):
        """Apply a discount code to a cart"""
        try:
            # First, try to find a prize redemption discount code
            try:
                redemption = PrizeRedemption.objects.get(
                    discount_code=discount_code,
                    used=False
                )
                
                if not redemption.prize.discount_percentage:
                    raise ValueError("Invalid prize discount code")
                
                cart = get_object_or_404(ShoppingCart, id=cart_id)
                
                # Calculate the discount amount using cart_total to account for store discounts
                total_amount = CartService.get_cart_total(cart)
                # Log the calculation to help with debugging
                logger.info(f"Prize discount calculation: Total amount (with any store discounts): {total_amount}, Prize discount percentage: {redemption.prize.discount_percentage}%")
                # Convert integer to Decimal to avoid type mismatch
                discount_percentage = Decimal(str(redemption.prize.discount_percentage))
                discount_amount = (total_amount * discount_percentage) / Decimal('100')
                logger.info(f"Applied prize discount: {discount_amount}, Final amount: {total_amount - discount_amount}")
                
                # Mark redemption as used
                redemption.used = True
                redemption.save()
                
                return {
                    'original_amount': total_amount,
                    'discount_percentage': discount_percentage,
                    'discount_amount': discount_amount,
                    'final_amount': total_amount - discount_amount,
                    'discount_code': discount_code
                }
            except PrizeRedemption.DoesNotExist:
                # If not found as a prize redemption, check regular discount codes
                discount = DiscountCode.objects.get(
                    code=discount_code, 
                    is_active=True, 
                    used=False
                )
                
                # Check if expired
                if discount.expiration_date and discount.expiration_date < timezone.now():
                    raise ValueError("Discount code has expired")
                
                cart = get_object_or_404(ShoppingCart, id=cart_id)
                
                # Calculate the discount amount using cart_total to account for store discounts
                total_amount = CartService.get_cart_total(cart)
                # Log the calculation to help with debugging
                logger.info(f"Discount calculation: Total amount (with any store discounts): {total_amount}, Discount percentage: {discount.value}%")
                # Make sure we're working with Decimal objects for financial calculations
                # No need to convert if already a Decimal
                discount_amount = (total_amount * discount.value) / Decimal('100')
                logger.info(f"Applied discount: {discount_amount}, Final amount: {total_amount - discount_amount}")
                
                # Mark discount as used
                discount.used = True
                discount.save()
                
                return {
                    'original_amount': total_amount,
                    'discount_percentage': discount.value,
                    'discount_amount': discount_amount,
                    'final_amount': total_amount - discount_amount,
                    'discount_code': discount_code
                }
                
        except (PrizeRedemption.DoesNotExist, DiscountCode.DoesNotExist) as e:
            raise ValueError("Invalid or expired discount code")
        except Exception as e:
            raise ValueError(f"Error applying discount: {str(e)}")
            
    @staticmethod
    def get_store_points_conversion(store_id):
        """Get the points conversion rate for a store"""
        try:
            # Always return the global value
            settings = GlobalLoyaltySetting.get_settings()
            
            # We still accept store_id for potential future use or to maintain API structure,
            # but the returned value is the global one.
            # If store_id is provided, we can optionally verify the store exists.
            if store_id:
                get_object_or_404(Store, id=store_id) 
            
            return {
                'store_id': store_id, # Keep store_id if provided, null otherwise
                'points_per_diamond': settings.diamond_points_value
            }
        except Store.DoesNotExist:
             raise ValueError(f"Store with id {store_id} not found.")
        except Exception as e:
            raise ValueError(f"Error getting points conversion: {str(e)}")