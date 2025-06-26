from MallAPI.models.discount_model import DiscountCode
from MallAPI.serializers.discount_serializers import DiscountCodeSerializer
from django.utils import timezone
from MallAPI.services.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

class DiscountCodeService:
    @staticmethod
    def get_all_discount_codes():
        """Get all discount codes"""
        discount_codes = DiscountCode.objects.all().order_by('-created_at')
        return discount_codes
    
    @staticmethod
    def get_active_discount_codes():
        """Get all active and non-expired discount codes"""
        now = timezone.now()
        discount_codes = DiscountCode.objects.filter(is_active=True).order_by('-created_at')
        
        # Filter out expired codes
        active_codes = []
        for code in discount_codes:
            if not code.expiration_date or code.expiration_date > now:
                active_codes.append(code)
        
        return active_codes
    
    @staticmethod
    def get_discount_code_by_id(discount_id):
        """Get a specific discount code by ID"""
        try:
            return DiscountCode.objects.get(id=discount_id)
        except DiscountCode.DoesNotExist:
            return None
    
    @staticmethod
    def create_discount_code(data):
        """Create a new discount code and send notification to customers"""
        serializer = DiscountCodeSerializer(data=data)
        if serializer.is_valid():
            discount_code = serializer.save()
            
            # Send email notification to customers
            try:
                success, message = EmailService.send_admin_discount_notification(
                    discount_code.code, 
                    discount_code.value
                )
                if not success:
                    logger.warning(f"Failed to send discount notification: {message}")
            except Exception as e:
                logger.error(f"Error sending discount notification: {str(e)}")
            
            return discount_code, None
        return None, serializer.errors
    
    @staticmethod
    def update_discount_code(discount_id, data):
        """Update an existing discount code"""
        try:
            discount_code = DiscountCode.objects.get(id=discount_id)
            serializer = DiscountCodeSerializer(discount_code, data=data, partial=True)
            if serializer.is_valid():
                updated_discount = serializer.save()
                return updated_discount, None
            return None, serializer.errors
        except DiscountCode.DoesNotExist:
            return None, {"error": "Discount code not found"}
    
    @staticmethod
    def delete_discount_code(discount_id):
        """Delete a discount code"""
        try:
            discount_code = DiscountCode.objects.get(id=discount_id)
            discount_code.delete()
            return True, None
        except DiscountCode.DoesNotExist:
            return False, {"error": "Discount code not found"}
    
    @staticmethod
    def validate_discount_code(code):
        """Validate if a discount code exists, is active, and not expired"""
        now = timezone.now()
        try:
            # First, get the discount code
            discount = DiscountCode.objects.get(code=code, is_active=True, used=False)
            
            # Check if the discount code has expired
            if discount.expiration_date and discount.expiration_date < now:
                return None  # Expired code
                
            return discount
        except DiscountCode.DoesNotExist:
            return None
            
    @staticmethod
    def mark_discount_code_as_used(code):
        """Mark a discount code as used"""
        try:
            discount = DiscountCode.objects.get(code=code, is_active=True, used=False)
            discount.used = True
            discount.save()
            return discount
        except DiscountCode.DoesNotExist:
            return None