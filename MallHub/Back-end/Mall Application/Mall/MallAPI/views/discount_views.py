from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from MallAPI.permissions import IsAdmin

from MallAPI.services.discount_service import DiscountCodeService
from MallAPI.serializers.discount_serializers import DiscountCodeSerializer
import logging

logger = logging.getLogger(__name__)

class DiscountCodeListCreateView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request):
        """Get all discount codes"""
        # Debug info
        logger.debug(f"User: {request.user}, Authenticated: {request.user.is_authenticated}, Role: {getattr(request.user, 'role', 'Unknown')}")
        
        discount_codes = DiscountCodeService.get_all_discount_codes()
        serializer = DiscountCodeSerializer(discount_codes, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new discount code"""
        # Debug info
        logger.debug(f"User: {request.user}, Authenticated: {request.user.is_authenticated}, Role: {getattr(request.user, 'role', 'Unknown')}")
        
        discount_code, errors = DiscountCodeService.create_discount_code(request.data)
        if discount_code:
            logger.info(f"Discount code created: {discount_code.code} with value {discount_code.value}%")
            serializer = DiscountCodeSerializer(discount_code)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Failed to create discount code: {errors}")
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

class ActiveDiscountCodesView(APIView):
    """View to get active and non-expired discount codes"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        discount_codes = DiscountCodeService.get_active_discount_codes()
        serializer = DiscountCodeSerializer(discount_codes, many=True)
        return Response(serializer.data)

class DiscountCodeDetailView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request, pk):
        """Get a specific discount code"""
        discount_code = DiscountCodeService.get_discount_code_by_id(pk)
        if discount_code:
            serializer = DiscountCodeSerializer(discount_code)
            return Response(serializer.data)
        return Response({"error": "Discount code not found"}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, pk):
        """Update a discount code"""
        discount_code, errors = DiscountCodeService.update_discount_code(pk, request.data)
        if discount_code:
            serializer = DiscountCodeSerializer(discount_code)
            return Response(serializer.data)
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Delete a discount code"""
        success, errors = DiscountCodeService.delete_discount_code(pk)
        if success:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(errors, status=status.HTTP_404_NOT_FOUND)

class ValidateDiscountCodeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Validate a discount code"""
        code = request.data.get('code')
        if not code:
            return Response({"error": "Code is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        discount = DiscountCodeService.validate_discount_code(code)
        if discount:
            serializer = DiscountCodeSerializer(discount)
            return Response(serializer.data)
        return Response({"error": "Invalid or expired discount code"}, status=status.HTTP_404_NOT_FOUND) 