from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from MallAPI.serializers.store_serializers import StoreSerializer, ProductCreateSerializer, StoreCreateSerializer, CategorySerializer, ProductSerializer,SectionSerializer, ProductListSerializer, StoreBasicSerializer, StorePaginatedSerializer, ProductWithStoreSerializer, ProductCommentSerializer, ProductInteractionSerializer, CommentInteractionSerializer, ProductRatingSerializer, FavoriteSerializer, StoreDiscountSerializer
from MallAPI.models.store_model import Store, Category, Product,Section, ProductComment, ProductInteraction, CommentInteraction, ProductRating, Favorite, StoreDiscount
from MallAPI.services.store_services import StoreService, SearchService
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied, NotFound
from django.shortcuts import get_object_or_404
from MallAPI.permissions import IsStoreManager, IsNormalUser, IsStoreManagerOrNormalUser, IsAdmin, IsOwnerOrAdminOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from MallAPI.permissions import IsStoreManagerOrAdmin
from MallAPI.services.store_services import SearchService
import logging
from django.core.paginator import Paginator, EmptyPage
from MallAPI.permissions import IsAdminOrStoreManagerOrNormalUser
from MallAPI.utils import format_error_message
from django.db.models import Q, Count, Avg
logger = logging.getLogger(__name__)

# Add a new view for store-wide discounts
class StoreDiscountView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManager]
    
    def get(self, request):
        """Get current store-wide discount for logged-in store manager"""
        try:
            store = Store.objects.get(owner=request.user)
            discount = StoreService.get_store_discount(store)
            
            if discount:
                return Response({
                    "status": "success",
                    "discount": {
                        "percentage": discount.percentage,
                        "is_active": discount.is_active
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "status": "success",
                    "discount": None
                }, status=status.HTTP_200_OK)
                
        except Store.DoesNotExist:
            return Response(format_error_message("You don't have a store assigned"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Apply a store-wide discount to all products"""
        try:
            percentage = request.data.get('percentage')
            if percentage is None:
                return Response(format_error_message("Percentage is required"), status=status.HTTP_400_BAD_REQUEST)
                
            try:
                percentage = float(percentage)
                if percentage < 0 or percentage > 100:
                    return Response(format_error_message("Percentage must be between 0 and 100"), status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response(format_error_message("Percentage must be a valid number"), status=status.HTTP_400_BAD_REQUEST)
                
            store = Store.objects.get(owner=request.user)
            discount, error = StoreService.apply_store_discount(store, percentage)
            
            if discount:
                return Response({
                    "status": "success",
                    "message": f"Applied {percentage}% discount to all products",
                    "discount": {
                        "percentage": discount.percentage,
                        "is_active": discount.is_active
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response(format_error_message(error), status=status.HTTP_400_BAD_REQUEST)
                
        except Store.DoesNotExist:
            return Response(format_error_message("You don't have a store assigned"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request):
        """Remove store-wide discount"""
        try:
            store = Store.objects.get(owner=request.user)
            success, error = StoreService.remove_store_discount(store)
            
            if success:
                return Response({
                    "status": "success",
                    "message": "Discount removed successfully"
                }, status=status.HTTP_200_OK)
            else:
                return Response(format_error_message(error), status=status.HTTP_400_BAD_REQUEST)
                
        except Store.DoesNotExist:
            return Response(format_error_message("You don't have a store assigned"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StoreListView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerOrNormalUser]

    def get(self, request):
        """Get all stores with their IDs and names"""
        try:
            stores = Store.objects.all().order_by('name')
            serializer = StoreBasicSerializer(stores, many=True)
            return Response({
                "status": "success",
                "stores": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserStoreListView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManager]

    def get(self, request):
        try:
            stores = StoreService.get_stores_by_user(request.user)
            serializer = StoreSerializer(stores, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProductCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStoreManagerOrNormalUser]

    def post(self, request):
        try:
            # Get the store directly from the logged-in user
            store = Store.objects.get(owner=request.user)
            
            serializer = ProductCreateSerializer(
                data=request.data,
                context={'store': store, 'request': request}
            )
            
            if serializer.is_valid():
                product = serializer.save()
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
            
        except Store.DoesNotExist:
            return Response(format_error_message("You don't have a store assigned"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StoreCreateView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerOrAdmin]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        try:
            # Check if the store manager already has a store
            if request.user.role == 'STORE_MANAGER' and Store.objects.filter(owner=request.user).exists():
                return Response(
                    {"Details": "Store manager can't create multiple stores!"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = StoreCreateSerializer(
                data=request.data,
                context={'request': request}
            )
            if serializer.is_valid():
                try:
                    store = serializer.save()
                    return Response(
                        serializer.to_representation(store),
                        status=status.HTTP_201_CREATED
                    )
                except Exception as e:
                    return Response(
                        {"Details": str(e)},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StoreManageView(APIView):
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated, IsStoreManager]

    def get(self, request):
        """Get the store owned by the current user"""
        try:
            store = Store.objects.get(owner=request.user)
            serializer = StoreSerializer(store, context={'request': request})
            return Response({
                "status": "success",
                "store": serializer.data
            }, status=status.HTTP_200_OK)
        except Store.DoesNotExist:
            return Response({
                "status": "error",
                "message": "You don't have a store yet"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        try:
            store = Store.objects.get(owner=request.user)
            serializer = StoreSerializer(store, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Store.DoesNotExist:
            return Response(format_error_message("Store not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        try:
            store = Store.objects.get(owner=request.user)
            store.delete()
            return Response({"message": "Store deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Store.DoesNotExist:
            return Response(format_error_message("Store not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProductManageView(generics.CreateAPIView, generics.UpdateAPIView, generics.DestroyAPIView):
    serializer_class = ProductCreateSerializer
    permission_classes = [IsAuthenticated, IsStoreManager]

    def perform_create(self, serializer):
        store = get_object_or_404(Store, owner=self.request.user)
        serializer.save(store=store)

    def get_queryset(self):
        return Product.objects.filter(store__owner=self.request.user)

class CategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, category_id=None):
        """Get all categories or a specific category"""
        try:
            if category_id:
                category = Category.objects.get(id=category_id)
                serializer = CategorySerializer(category)
                return Response({
                    "status": "success",
                    "category": serializer.data
                }, status=status.HTTP_200_OK)
            else:
                # If no category_id, return paginated list
                page = int(request.query_params.get('page', 1))
                per_page = int(request.query_params.get('per_page', 10))
                
                categories = StoreService.get_all_categories(page, per_page)
                
                if categories is None:
                    return Response(format_error_message("Page not found"), status=status.HTTP_404_NOT_FOUND)

                return Response({
                    "status": "success",
                    "pagination": {
                        "total_pages": categories['total_pages'],
                        "current_page": categories['current_page'],
                        "total_items": categories['total_items'],
                        "has_next": categories['has_next'],
                        "has_previous": categories['has_previous'],
                    },
                    "categories": categories['items']
                }, status=status.HTTP_200_OK)
        except Category.DoesNotExist:
            return Response(format_error_message("Category not found"), status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response(format_error_message("Invalid page number"), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Create a new category"""
        try:
            serializer = CategorySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Category created successfully",
                    "category": serializer.data
                }, status=status.HTTP_201_CREATED)
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, category_id):
        """Update category"""
        try:
            category = Category.objects.get(id=category_id)
            serializer = CategorySerializer(category, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Category updated successfully",
                    "category": serializer.data
                }, status=status.HTTP_200_OK)
            # Get the first error message
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Category.DoesNotExist:
            return Response(format_error_message("Category not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, category_id):
        """Delete category"""
        try:
            category = Category.objects.get(id=category_id)
            category.delete()
            return Response({
                "status": "success",
                "message": "Category deleted successfully"
            }, status=status.HTTP_204_NO_CONTENT)
        except Category.DoesNotExist:
            return Response(format_error_message("Category not found"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SearchView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    parser_classes = (JSONParser,)

    def post(self, request):
        try:
            search_type = request.data.get('type')
            name = request.data.get('name')
            page = request.query_params.get('page', 1)

            if not name:
                return Response(
                    {'error': 'Name is required for search'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if search_type == 'store':
                results = SearchService.search_stores(name, page)
            elif search_type == 'product':
                results = SearchService.search_products(name, page)
            else:
                return Response(
                    {'error': 'Invalid search type. Use "store" or "product"'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(results, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return Response(
                {'error': 'An error occurred during search'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CategoryFilterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = (JSONParser,)

    def post(self, request):
        try:
            category_name = request.data.get('category')
            if not category_name:
                return Response(
                    {'error': 'Category name is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                category = Category.objects.get(name__iexact=category_name)
                stores = Store.objects.filter(categories=category)
                
                # Simplified store response without products
                store_data = stores.values(
                    'id',
                    'name',
                    'description',
                    'logo',
                    'section__name'
                )
                
                return Response({
                    'category': {
                        'id': category.id,
                        'name': category.name,
                        'description': category.description
                    },
                    'stores': store_data
                }, status=status.HTTP_200_OK)

            except Category.DoesNotExist:
                return Response(
                    {'error': f'Category "{category_name}" not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        except Exception as e:
            logger.error(f"Category filter error: {str(e)}")
            return Response(
                {'error': 'An error occurred while filtering by category'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SectionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStoreManagerOrNormalUser]

    def get(self, request, section_id=None):
        """Get all sections or a specific section"""
        try:
            if section_id:
                section = get_object_or_404(Section, id=section_id)
                serializer = SectionSerializer(section)
            else:
                sections = Section.objects.all()
                serializer = SectionSerializer(sections, many=True)
            
            return Response({
                "status": "success",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting sections: {str(e)}")
            return Response({
                "status": "error",
                "message": "An error occurred while fetching sections"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Create a new section"""
        try:
            if request.user.role != 'ADMIN':
                return Response({
                    "status": "error",
                    "message": "Only admins can create sections"
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = SectionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Section created successfully",
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                "status": "error",
                "message": "Invalid data",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error creating section: {str(e)}")
            return Response({
                "status": "error",
                "message": "An error occurred while creating the section"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, section_id):
        """Update a section"""
        try:
            if request.user.role != 'ADMIN':
                return Response({
                    "status": "error",
                    "message": "Only admins can update sections"
                }, status=status.HTTP_403_FORBIDDEN)
            
            section = get_object_or_404(Section, id=section_id)
            serializer = SectionSerializer(section, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Section updated successfully",
                    "data": serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response({
                "status": "error",
                "message": "Invalid data",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Section.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Section not found"
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Error updating section: {str(e)}")
            return Response({
                "status": "error",
                "message": "An error occurred while updating the section"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, section_id):
        """Delete a section"""
        try:
            if request.user.role != 'ADMIN':
                return Response({
                    "status": "error",
                    "message": "Only admins can delete sections"
                }, status=status.HTTP_403_FORBIDDEN)
            
            section = get_object_or_404(Section, id=section_id)
            section.delete()
            
            return Response({
                "status": "success",
                "message": "Section deleted successfully"
            }, status=status.HTTP_204_NO_CONTENT)
            
        except Section.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Section not found"
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Error deleting section: {str(e)}")
            return Response({
                "status": "error",
                "message": "An error occurred while deleting the section"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StoreUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerOrAdmin]
    parser_classes = (MultiPartParser, FormParser)

    def put(self, request):
        try:
            store = Store.objects.get(owner=request.user)
            
            # Check if user is store manager or admin
            if request.user.role == 'STORE_MANAGER' or request.user.is_staff:
                serializer = StoreCreateSerializer(
                    store,
                    data=request.data,
                    partial=True,
                    context={'request': request}
                )
                
                if serializer.is_valid():
                    store = serializer.save()
                    return Response(
                        StoreCreateSerializer(store).data,
                        status=status.HTTP_200_OK
                    )
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {"Details": "You must be a store manager or admin to modify stores"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
        except Store.DoesNotExist:
            return Response(
                {"Details": "Store not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class StoreDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerOrAdmin]

    def delete(self, request):
        try:
            store = Store.objects.get(owner=request.user)
            
            # Check if user is store manager or admin
            if request.user.role == 'STORE_MANAGER' or request.user.is_staff:
                store.delete()
                return Response(
                    {"message": "Store deleted successfully"},
                    status=status.HTTP_204_NO_CONTENT
                )
            else:
                return Response(
                    {"Details": "You must be a store manager or admin to delete stores"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
        except Store.DoesNotExist:
            return Response(
                {"Details": "Store not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class StoreProductsView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManager]

    def get(self, request):
        try:
            page = int(request.query_params.get('page', 1))
            per_page = int(request.query_params.get('per_page', 10))
            
            store = Store.objects.get(owner=request.user)
            products = store.products.filter(is_active=True).order_by('-created_at')
            
            paginator = Paginator(products, per_page)
            
            try:
                paginated_products = paginator.page(page)
            except EmptyPage:
                return Response(format_error_message("Page not found"), status=status.HTTP_404_NOT_FOUND)
                
            serializer = ProductListSerializer(
                paginated_products, 
                many=True,
                context={'request': request}
            )
            
            return Response({
                "status": "success",
                "store": {
                    "id": store.id,
                    "name": store.name,
                    "description": store.description
                },
                "products": {
                    "items": serializer.data,
                    "total_items": paginator.count,
                    "total_pages": paginator.num_pages,
                    "current_page": page,
                    "per_page": per_page,
                    "has_next": paginated_products.has_next(),
                    "has_previous": paginated_products.has_previous()
                }
            }, status=status.HTTP_200_OK)
            
        except Store.DoesNotExist:
            return Response(format_error_message("Store not found"), status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response(format_error_message("Invalid page number"), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AllCategoriesView(APIView):
    permission_classes = [AllowAny]  # Adjust based on your requirements

    def get(self, request):
        """Get all categories without pagination"""
        try:
            categories = Category.objects.all().order_by('name')
            serializer = CategorySerializer(categories, many=True)
            return Response({
                "status": "success",
                "categories": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(format_error_message(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProductUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerOrAdmin]
    parser_classes = (MultiPartParser, FormParser)

    def put(self, request, product_id):
        try:
            # Get the store manager's store
            store = Store.objects.get(owner=request.user)
            
            # Get the product and verify it belongs to the store manager's store
            product = Product.objects.get(id=product_id, store=store)
            
            serializer = ProductCreateSerializer(
                product,
                data=request.data,
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                product = serializer.save()
                return Response({
                    "status": "success",
                    "message": "Product updated successfully",
                    "product": serializer.data
                }, status=status.HTTP_200_OK)
                
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Store.DoesNotExist:
            return Response({
                "Details": "You don't have a store assigned"
            }, status=status.HTTP_404_NOT_FOUND)
        except Product.DoesNotExist:
            return Response({
                "Details": "Product not found or doesn't belong to your store"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                "Details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProductDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerOrAdmin]

    def delete(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
            
            # Check if user is store manager or admin
            if request.user.role == 'STORE_MANAGER' or request.user.is_staff:
                product.delete()
                return Response({
                    "status": "success",
                    "message": "Product deleted successfully"
                }, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({
                    "Details": "You must be a store manager or admin to delete products"
                }, status=status.HTTP_403_FORBIDDEN)
            
        except Product.DoesNotExist:
            return Response({
                "Details": "Product not found"
            }, status=status.HTTP_404_NOT_FOUND)

class StoreDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, store_id):
        """Get store details by ID"""
        try:
            store = Store.objects.get(id=store_id)
            
            # Check if diamonds should be included
            include_diamonds = request.query_params.get('include_diamonds', 'false').lower() == 'true'
            
            if include_diamonds:
                from MallAPI.serializers.Loyalty_Serializers import StoreWithDiamondsSerializer
                serializer = StoreWithDiamondsSerializer(store, context={'request': request})
            else:
                serializer = StoreSerializer(store, context={'request': request})
                
            return Response({
                "status": "success",
                "store": serializer.data
            }, status=status.HTTP_200_OK)
        except Store.DoesNotExist:
            return Response(
                format_error_message("Store not found"),
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error getting store details: {str(e)}")
            return Response(
                format_error_message("An error occurred while fetching store details"),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        """Get product details by ID, including average rating and user's rating."""
        try:
            # Annotate product with average rating
            product = Product.objects.select_related('store', 'category') \
                                     .annotate(average_rating=Avg('ratings__rating')) \
                                     .get(id=product_id)

            # Get current user's rating for this product, if authenticated
            user_rating = None
            if request.user.is_authenticated and request.user.role == 'CUSTOMER': # Only customers can rate
                try:
                    rating_obj = ProductRating.objects.get(product=product, user=request.user)
                    user_rating = rating_obj.rating
                except ProductRating.DoesNotExist:
                    pass # User hasn't rated this product

            # Prepare context for the serializer
            context = {
                'request': request,
                'average_rating': product.average_rating, # Pass the calculated average
                'user_rating': user_rating # Pass the user's rating (or None)
            }

            serializer = ProductListSerializer(product, context=context)

            # Manually add store info as ProductListSerializer doesn't include it
            response_data = {
                **serializer.data,
                "store": {
                    'id': product.store.id,
                    'name': product.store.name
                } if product.store else None,
                "category_id": product.category.id if product.category else None
            }

            return Response({
                "status": "success",
                "product": response_data
            }, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({
                "Details": "Product not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting product details: {str(e)}")
            return Response({
                "Details": "An error occurred while fetching product details"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StoresByCategoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, category_id):
        """Get all stores in a specific category"""
        try:
            # Verify category exists
            category = get_object_or_404(Category, id=category_id)
            
            # Get pagination parameters
            page = int(request.query_params.get('page', 1))
            per_page = int(request.query_params.get('per_page', 10))
            
            # Get stores for this category
            stores = Store.objects.filter(categories=category).distinct()
            
            # Apply pagination
            paginator = Paginator(stores, per_page)
            
            try:
                paginated_stores = paginator.page(page)
            except EmptyPage:
                return Response({
                    "Details": "Page not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = StoreSerializer(paginated_stores, many=True, context={'request': request})
            
            return Response({
                "status": "success",
                "category": {
                    "id": category.id,
                    "name": category.name
                },
                "pagination": {
                    "count": paginator.count,
                    "total_pages": paginator.num_pages,
                    "current_page": page,
                    "per_page": per_page,
                    "has_next": paginated_stores.has_next(),
                    "has_previous": paginated_stores.has_previous()
                },
                "stores": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Category.DoesNotExist:
            return Response({
                "Details": "Category not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting stores by category: {str(e)}")
            return Response({
                "Details": "An error occurred while fetching stores"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StoreProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, store_id, product_id):
        """Get specific product from specific store"""
        try:
            # Get product that belongs to the specified store
            product = get_object_or_404(
                Product.objects.select_related('store', 'category'),
                id=product_id,
                store_id=store_id
            )
            
            serializer = ProductListSerializer(product, context={'request': request})
            
            return Response({
                "status": "success",
                "store": {
                    "id": product.store.id,
                    "name": product.store.name
                },
                "product": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Product.DoesNotExist:
            return Response({
                "Details": "Product not found in this store"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting product details: {str(e)}")
            return Response({
                "Details": "An error occurred while fetching product details"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StoresPaginatedView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Get all stores with pagination and search"""
        try:
            # Get pagination parameters and search query
            page = int(request.query_params.get('page', 1))
            per_page = int(request.query_params.get('per_page', 10))
            search_query = request.query_params.get('q', '')
            include_diamonds = request.query_params.get('include_diamonds', 'false').lower() == 'true'
            
            # Debug print
            print(f"StoresPaginatedView: include_diamonds={include_diamonds}")
            
            # Get all stores ordered by name
            stores = Store.objects.all().order_by('name')
            
            # Apply search filter if query parameter exists
            if search_query:
                stores = stores.filter(
                    Q(name__icontains=search_query) |
                    Q(description__icontains=search_query) |
                    Q(categories__name__icontains=search_query) |  # Search in category names
                    Q(section__name__icontains=search_query)  # Search in section names
                ).distinct()  # Use distinct to avoid duplicate stores
            
            # Apply pagination
            paginator = Paginator(stores, per_page)
            
            try:
                paginated_stores = paginator.page(page)
            except EmptyPage:
                return Response({
                    "status": "error",
                    "message": "Page not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            try:
                serializer = StorePaginatedSerializer(
                    paginated_stores, 
                    many=True,
                    context={'request': request}
                )
                
                response_data = {
                    "status": "success",
                    "stores": {
                        "items": serializer.data,
                        "total_items": paginator.count,
                        "total_pages": paginator.num_pages,
                        "current_page": page,
                        "per_page": per_page,
                        "has_next": paginated_stores.has_next(),
                        "has_previous": paginated_stores.has_previous()
                    }
                }
            except Exception as e:
                # Debug print for serialization error
                print(f"Serialization error: {str(e)}")
                logger.error(f"Serialization error: {str(e)}")
                raise e

            # Add search query to response if it exists
            if search_query:
                response_data['search_query'] = search_query
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response({
                "status": "error",
                "message": "Invalid page or per_page parameter"
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Debug print for general error
            print(f"Error in StoresPaginatedView: {str(e)}")
            logger.error(f"Error getting paginated stores: {str(e)}")
            return Response({
                "status": "error",
                "message": "An error occurred while fetching stores"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AllSectionsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStoreManagerOrNormalUser]  # Updated permissions

    def get(self, request):
        """Get all sections with pagination"""
        try:
            # Get pagination parameters
            page = int(request.query_params.get('page', 1))
            per_page = int(request.query_params.get('per_page', 10))
            
            # Get all sections ordered by name
            sections = Section.objects.all().order_by('name')
            
            # Apply pagination
            paginator = Paginator(sections, per_page)
            
            try:
                paginated_sections = paginator.page(page)
            except EmptyPage:
                return Response({
                    "Details": "Page not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = SectionSerializer(
                paginated_sections, 
                many=True,
                context={'request': request}
            )
            
            return Response({
                "status": "success",
                "user_role": request.user.role,  # Include user role in response
                "pagination": {
                    "total_items": paginator.count,
                    "total_pages": paginator.num_pages,
                    "current_page": page,
                    "per_page": per_page,
                    "has_next": paginated_sections.has_next(),
                    "has_previous": paginated_sections.has_previous()
                },
                "sections": serializer.data
            }, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response({
                "Details": "Invalid page or per_page parameter"
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error getting paginated sections: {str(e)}")
            return Response({
                "Details": "An error occurred while fetching sections"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AllProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            # Get pagination parameters and search query
            page = int(request.query_params.get('page', 1))
            per_page = int(request.query_params.get('per_page', 10))
            search_query = request.query_params.get('q', '')
            
            # Get all ACTIVE products with their related store info
            products = Product.objects.select_related('store').filter(is_active=True).order_by('-created_at')
            
            # Apply search filter if query parameter exists
            if search_query:
                products = products.filter(
                    Q(name__icontains=search_query) |
                    Q(description__icontains=search_query)
                )
            
            # Apply pagination
            paginator = Paginator(products, per_page)
            
            try:
                paginated_products = paginator.page(page)
            except EmptyPage:
                return Response({
                    'Details': 'Page not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = ProductWithStoreSerializer(
                paginated_products,
                many=True,
                context={'request': request}
            )
            
            response_data = {
                'status': 'success',
                'products': {
                    'items': serializer.data,
                    'total_items': paginator.count,
                    'total_pages': paginator.num_pages,
                    'current_page': page,
                    'per_page': per_page,
                    'has_next': paginated_products.has_next(),
                    'has_previous': paginated_products.has_previous()
                }
            }
            
            # Add search query to response if it exists
            if search_query:
                response_data['search_query'] = search_query
            
            return Response(response_data, status=status.HTTP_200_OK)
                    
        except ValueError:
            return Response({
                'Details': 'Invalid page or per_page parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error getting all products: {str(e)}")
            return Response({
                'Details': 'An error occurred while fetching products'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StorePaginatedProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, store_id):
        try:
            # Get pagination and search parameters
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            search_query = request.query_params.get('q', '')

            # Get the store
            store = get_object_or_404(Store, id=store_id)
            
            # Get all ACTIVE products for the store with search filter
            products = Product.objects.filter(store=store, is_active=True)
            if search_query:
                products = products.filter(
                    Q(name__icontains=search_query) |
                    Q(description__icontains=search_query)
                )
            products = products.order_by('id')
            
            # Create paginator
            paginator = Paginator(products, page_size)
            
            try:
                paginated_products = paginator.page(page)
            except EmptyPage:
                paginated_products = paginator.page(paginator.num_pages)
            
            # Serialize the products
            serializer = ProductWithStoreSerializer(paginated_products, many=True, context={'request': request})
            
            response_data = {
                'status': 'success',
                'products': {
                    'items': serializer.data,
                    'total_items': paginator.count,
                    'total_pages': paginator.num_pages,
                    'current_page': page,
                    'per_page': page_size,
                    'has_next': paginated_products.has_next(),
                    'has_previous': paginated_products.has_previous()
                }
            }

            # Add search query to response if it exists
            if search_query:
                response_data['search_query'] = search_query
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response({
                'status': 'error',
                'message': 'Invalid page or page_size parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Comment Views ---

class ProductCommentListCreateView(APIView):
    permission_classes = [IsAuthenticated] # Allow authenticated users to list/create
    serializer_class = ProductCommentSerializer

    def get(self, request, product_id):
        """Get all top-level comments for a specific product with pagination."""
        product = get_object_or_404(Product, id=product_id)
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 10))

        # Fetch only top-level comments (parent is None)
        comments = ProductComment.objects.filter(product=product, parent__isnull=True).select_related('user').prefetch_related('replies')

        paginator = Paginator(comments, per_page)
        try:
            paginated_comments = paginator.page(page)
        except EmptyPage:
            return Response(format_error_message("Page not found"), status=status.HTTP_404_NOT_FOUND)

        serializer = self.serializer_class(paginated_comments, many=True, context={'request': request})

        return Response({
            "status": "success",
            "pagination": {
                "total_items": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page,
                "per_page": per_page,
                "has_next": paginated_comments.has_next(),
                "has_previous": paginated_comments.has_previous()
            },
            "comments": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, product_id):
        """Create a new comment or reply for a specific product."""
        product = get_object_or_404(Product, id=product_id)
        serializer = self.serializer_class(data=request.data, context={'request': request})

        if serializer.is_valid():
            # Ensure the comment is associated with the correct product from the URL
            if serializer.validated_data['product'] != product:
                 return Response(format_error_message("Mismatch between URL product ID and payload product ID."), status=status.HTTP_400_BAD_REQUEST)

            # Check if replying to a comment that belongs to the same product
            parent_comment_id = request.data.get('parent')
            if parent_comment_id:
                parent_comment = get_object_or_404(ProductComment, id=parent_comment_id)
                if parent_comment.product != product:
                    return Response(format_error_message("Cannot reply to a comment from a different product."), status=status.HTTP_400_BAD_REQUEST)

            serializer.save(user=request.user, product=product)
            return Response({"status": "success", "comment": serializer.data}, status=status.HTTP_201_CREATED)
        else:
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)

class ProductCommentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    serializer_class = ProductCommentSerializer

    def get_object(self, pk):
        try:
            obj = ProductComment.objects.select_related('user', 'product').get(pk=pk)
            self.check_object_permissions(self.request, obj)
            return obj
        except ProductComment.DoesNotExist:
            raise NotFound(detail="Comment not found")

    def get(self, request, product_id, comment_id):
        """Get a specific comment."""
        comment = self.get_object(comment_id)
        # Ensure comment belongs to the product in the URL
        if comment.product.id != product_id:
            raise NotFound(detail="Comment not found for this product")
        serializer = self.serializer_class(comment, context={'request': request})
        return Response({"status": "success", "comment": serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, product_id, comment_id):
        """Update a specific comment (only by owner or admin)."""
        comment = self.get_object(comment_id)
        if comment.product.id != product_id:
            raise NotFound(detail="Comment not found for this product")
        serializer = self.serializer_class(comment, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            # Prevent changing the product or parent via PUT
            serializer.validated_data.pop('product', None)
            serializer.validated_data.pop('parent', None)
            serializer.save()
            return Response({"status": "success", "comment": serializer.data}, status=status.HTTP_200_OK)
        else:
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, product_id, comment_id):
        """Delete a specific comment (only by owner or admin)."""
        comment = self.get_object(comment_id)
        if comment.product.id != product_id:
            raise NotFound(detail="Comment not found for this product")
        comment.delete()
        return Response({"status": "success", "message": "Comment deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


# --- Interaction Views ---

class ProductInteractionView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductInteractionSerializer

    def post(self, request, product_id):
        """Create or update a like/dislike interaction for a product."""
        product = get_object_or_404(Product, id=product_id)
        interaction_type = request.data.get('interaction_type')

        if not interaction_type or interaction_type not in [ProductInteraction.LIKE, ProductInteraction.DISLIKE]:
            return Response(format_error_message(f"Invalid or missing interaction_type. Must be '{ProductInteraction.LIKE}' or '{ProductInteraction.DISLIKE}'."), status=status.HTTP_400_BAD_REQUEST)

        # Check if interaction already exists
        interaction, created = ProductInteraction.objects.update_or_create(
            user=request.user,
            product=product,
            defaults={'interaction_type': interaction_type}
        )

        serializer = self.serializer_class(interaction)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        message = "Interaction created successfully" if created else "Interaction updated successfully"

        return Response({"status": "success", "message": message, "interaction": serializer.data}, status=status_code)

    def delete(self, request, product_id):
        """Remove a like/dislike interaction (unlike/undislike)."""
        product = get_object_or_404(Product, id=product_id)
        try:
            interaction = ProductInteraction.objects.get(user=request.user, product=product)
            interaction.delete()
            return Response({"status": "success", "message": "Interaction removed successfully"}, status=status.HTTP_204_NO_CONTENT)
        except ProductInteraction.DoesNotExist:
            return Response(format_error_message("No interaction found for this user and product."), status=status.HTTP_404_NOT_FOUND)

class ProductInteractionStatsView(APIView):
    permission_classes = [AllowAny] # Anyone can view stats

    def get(self, request, product_id):
        """Get like/dislike counts for a product."""
        product = get_object_or_404(Product, id=product_id)

        # Efficiently count likes and dislikes
        stats = product.interactions.aggregate(
            likes_count=Count('id', filter=Q(interaction_type=ProductInteraction.LIKE)),
            dislikes_count=Count('id', filter=Q(interaction_type=ProductInteraction.DISLIKE))
        )

        # Check current user's interaction
        user_interaction = None
        if request.user.is_authenticated:
            try:
                interaction = ProductInteraction.objects.get(user=request.user, product=product)
                user_interaction = interaction.interaction_type
            except ProductInteraction.DoesNotExist:
                pass # User hasn't interacted

        return Response({
            "status": "success",
            "product_id": product_id,
            "likes_count": stats['likes_count'],
            "dislikes_count": stats['dislikes_count'],
            "user_interaction": user_interaction # Indicates if the current user liked, disliked, or null
        }, status=status.HTTP_200_OK)

# --- Comment Interaction Views ---

class CommentInteractionView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommentInteractionSerializer # Use the new serializer

    def post(self, request, product_id, comment_id):
        """ Like a comment. """
        comment = get_object_or_404(ProductComment, id=comment_id, product_id=product_id)
        user = request.user

        # Check if already liked
        if CommentInteraction.objects.filter(comment=comment, user=user).exists():
            return Response({"status": "error", "message": "You have already liked this comment."}, status=status.HTTP_400_BAD_REQUEST)

        # Create the like interaction
        interaction = CommentInteraction.objects.create(comment=comment, user=user)
        serializer = self.serializer_class(interaction)
        return Response({"status": "success", "message": "Comment liked successfully", "interaction": serializer.data}, status=status.HTTP_201_CREATED)

    def delete(self, request, product_id, comment_id):
        """ Unlike a comment. """
        comment = get_object_or_404(ProductComment, id=comment_id, product_id=product_id)
        user = request.user

        # Find and delete the interaction
        try:
            interaction = CommentInteraction.objects.get(comment=comment, user=user)
            interaction.delete()
            return Response({"status": "success", "message": "Comment unliked successfully"}, status=status.HTTP_204_NO_CONTENT)
        except CommentInteraction.DoesNotExist:
            return Response({"status": "error", "message": "You have not liked this comment."}, status=status.HTTP_404_NOT_FOUND)

# --- Product Rating Views ---

class ProductRatingSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser] # Only authenticated customers
    serializer_class = ProductRatingSerializer

    def post(self, request, product_id):
        """ Create or update a rating for a product. """
        product = get_object_or_404(Product, id=product_id)
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            rating_value = serializer.validated_data['rating']
            # Use update_or_create to handle both creating and updating
            rating_obj, created = ProductRating.objects.update_or_create(
                user=request.user,
                product=product,
                defaults={'rating': rating_value}
            )
            status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
            message = "Rating submitted successfully" if created else "Rating updated successfully"
            # Return the updated object using the serializer
            return Response({
                "status": "success",
                "message": message,
                "rating": self.serializer_class(rating_obj).data
            }, status=status_code)
        else:
            error_msg = next(iter(serializer.errors.values()))[0]
            return Response(format_error_message(error_msg), status=status.HTTP_400_BAD_REQUEST)

class ProductRatingDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser] # Only authenticated customers

    def delete(self, request, product_id):
        """ Delete the user's rating for a product. """
        product = get_object_or_404(Product, id=product_id)
        try:
            rating_obj = ProductRating.objects.get(user=request.user, product=product)
            rating_obj.delete()
            return Response({"status": "success", "message": "Rating deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except ProductRating.DoesNotExist:
            return Response({"status": "error", "message": "You have not rated this product."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
             logger.error(f"Error deleting rating: {str(e)}")
             return Response({"status": "error", "message": "An error occurred while deleting the rating."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Favorite Views ---

class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated, IsNormalUser] # Only customers can view their favorites

    def get_queryset(self):
        """ Return a list of all the favorite products for the current user. """
        user = self.request.user
        # Eager load related product and its store for efficiency
        return Favorite.objects.filter(user=user).select_related('product__store', 'product__category').order_by('-added_at')

class FavoriteAddRemoveView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser] # Only customers can add/remove favorites

    def post(self, request, product_id):
        """ Add a product to the user's favorites. """
        product = get_object_or_404(Product, id=product_id)
        user = request.user

        # Use get_or_create to add only if it doesn't exist
        favorite, created = Favorite.objects.get_or_create(user=user, product=product)

        if created:
            serializer = FavoriteSerializer(favorite, context={'request': request})
            return Response({"status": "success", "message": "Product added to favorites.", "favorite": serializer.data}, status=status.HTTP_201_CREATED)
        else:
            return Response({"status": "info", "message": "Product was already in favorites."}, status=status.HTTP_200_OK)

    def delete(self, request, product_id):
        """ Remove a product from the user's favorites. """
        product = get_object_or_404(Product, id=product_id)
        user = request.user

        try:
            favorite = Favorite.objects.get(user=user, product=product)
            favorite.delete()
            return Response({"status": "success", "message": "Product removed from favorites."}, status=status.HTTP_204_NO_CONTENT)
        except Favorite.DoesNotExist:
            return Response({"status": "error", "message": "Product not found in favorites."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error removing favorite: {str(e)}")
            return Response({"status": "error", "message": "An error occurred while removing the favorite."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)