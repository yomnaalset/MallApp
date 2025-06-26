from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from MallAPI.services.customer_services import CustomerService
from MallAPI.serializers.customer_serializers import (
    CustomerProfileSerializer,
    CustomerCategorySerializer,
    CustomerStoreSerializer,
    CustomerProductSerializer
)
from MallAPI.permissions import IsNormalUser,IsStoreManager,IsStoreManagerOrNormalUser,IsAdmin

class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = CustomerService.get_categories()
        serializer = CustomerCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class StoresByCategoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, category_id):
        stores = CustomerService.get_stores_by_category(category_id)
        if not stores.exists():
            return Response(
                {'Details': 'No stores found in this category'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CustomerStoreSerializer(stores, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CustomerSearchView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'Details': 'Please provide a search query'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        results = CustomerService.search(query)
        return Response({
            'categories': CustomerCategorySerializer(results['categories'], many=True).data,
            'stores': CustomerStoreSerializer(results['stores'], many=True).data,
            'products': CustomerProductSerializer(results['products'], many=True).data
        }, status=status.HTTP_200_OK)

class CustomerProfileView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request):
        serializer = CustomerProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = CustomerProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)