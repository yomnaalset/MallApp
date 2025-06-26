from MallAPI.models.cart_model import ShoppingCart, CartItem
from MallAPI.models.store_model import Product, StoreDiscount
from MallAPI.models.payment_model import Payment
from django.shortcuts import get_object_or_404
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class CartService:
    @staticmethod
    def get_or_create_active_cart(user):
        """Get active cart or create new one if current cart is used in payment"""
        # Get the most recent cart for the user
        cart = ShoppingCart.objects.filter(user=user).order_by('-created_at').first()
        
        # If cart exists, check if it's used in payment
        if cart and Payment.objects.filter(cart=cart).exists():
            # Create new cart since the existing one is used
            cart = ShoppingCart.objects.create(user=user)
            
        # If no cart exists, create new one
        elif not cart:
            cart = ShoppingCart.objects.create(user=user)
            
        return cart

    @staticmethod
    def add_to_cart(user, product_id, quantity=1):
        """Add product to cart"""
        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")
            
        cart = CartService.get_or_create_active_cart(user)
        product = get_object_or_404(Product, id=product_id)
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
            
        return cart

    @staticmethod
    def update_cart_item(user, item_id, quantity):
        """Update cart item quantity"""
        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")
            
        cart = CartService.get_or_create_active_cart(user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        
        # Prevent updating quantity for prize items
        if cart_item.is_prize_redemption:
            raise ValueError("Cannot change quantity of a prize item.")
            
        cart_item.quantity = quantity
        cart_item.save()
            
        return cart

    @staticmethod
    def remove_from_cart(user, item_id):
        """Remove item from cart"""
        cart = CartService.get_or_create_active_cart(user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()
        return cart

    @staticmethod
    def clear_cart(user):
        """Clear all items from cart"""
        cart = CartService.get_or_create_active_cart(user)
        cart.items.all().delete()
        return cart

    @staticmethod
    def get_discounted_price(product):
        """Get discounted price for a product if store discount exists"""
        if not product.store:
            return None
            
        try:
            discount = StoreDiscount.objects.filter(store=product.store, is_active=True).first()
            if discount and discount.percentage > 0:
                discounted_price = float(product.price) * (1 - (float(discount.percentage) / 100))
                return Decimal(str(round(discounted_price, 2)))
        except Exception as e:
            logger.error(f"Error calculating discount: {str(e)}")
            
        return None

    @staticmethod
    def get_cart_total(cart):
        """Calculate cart total considering store discounts"""
        total = Decimal('0.00')
        for item in cart.items.all():
            # Check for store discount
            discounted_price = CartService.get_discounted_price(item.product)
            if discounted_price is not None:
                total += discounted_price * item.quantity
            else:
                total += item.product.price * item.quantity
        return total

    @staticmethod
    def decrease_cart_item_quantity(user, item_id):
        """Decrease cart item quantity by 1, remove if quantity becomes 0"""
        try:
            # Convert item_id to integer if it's a string
            item_id = int(item_id)
            
            cart = CartService.get_or_create_active_cart(user)
            cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
            
            # Prevent decreasing quantity for prize items
            if cart_item.is_prize_redemption:
                raise ValueError("Cannot change quantity of a prize item.")
            
            logger.info(f"Current quantity for item {item_id}: {cart_item.quantity}")
            
            if cart_item.quantity > 1:
                cart_item.quantity -= 1
                cart_item.save()
                logger.info(f"Decreased quantity to: {cart_item.quantity}")
            else:
                # If quantity would become 0, remove the item
                cart_item.delete()
                logger.info(f"Removed item {item_id} from cart")
            
            return cart
            
        except ValueError:
            logger.error(f"Invalid item_id format: {item_id}")
            raise ValueError("Invalid item ID format")
        except Exception as e:
            logger.error(f"Error in decrease_cart_item_quantity: {str(e)}", exc_info=True)
            raise