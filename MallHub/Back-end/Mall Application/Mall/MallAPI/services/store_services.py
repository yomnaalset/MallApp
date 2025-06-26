from django.core.cache import cache
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q
from MallAPI.models.store_model import Store, Product, Category, StoreDiscount
from django.conf import settings
import logging 

logger = logging.getLogger(__name__)

class StoreService:
    PRODUCTS_PER_PAGE = 20  # Default number of products per page

    @staticmethod
    def get_all_stores():
        return Store.objects.all()

    @staticmethod
    def get_stores_by_user(user):
        return Store.objects.filter(owner=user)

    @staticmethod
    def apply_store_discount(store, percentage):
        """Apply a store-wide discount percentage to all products"""
        try:
            # Get or create store discount
            discount, created = StoreDiscount.objects.get_or_create(
                store=store,
                defaults={
                    'percentage': float(percentage),
                    'is_active': True
                }
            )
            
            if not created:
                discount.percentage = float(percentage)
                discount.is_active = True
                discount.save()
                
            return discount, None
        except Exception as e:
            logger.error(f"Error applying store discount: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def remove_store_discount(store):
        """Remove store-wide discount"""
        try:
            # Try to get store discount
            discount = StoreDiscount.objects.filter(store=store).first()
            
            if discount:
                # Option 1: Delete the discount
                # discount.delete()
                
                # Option 2: Just deactivate it (keeping the history)
                discount.is_active = False
                discount.save()
                
            return True, None
        except Exception as e:
            logger.error(f"Error removing store discount: {str(e)}")
            return False, str(e)
    
    @staticmethod
    def get_store_discount(store):
        """Get the current store discount if any"""
        try:
            discount = StoreDiscount.objects.filter(store=store, is_active=True).first()
            return discount
        except Exception:
            return None

    @classmethod
    def get_store_products(cls, store_id, page=1, per_page=None):
        try:
            # Get store and its products
            store = Store.objects.get(id=store_id)
            products = Product.objects.filter(store=store).select_related('category')
            
            # Use specified per_page or default
            products_per_page = per_page or cls.PRODUCTS_PER_PAGE
            paginator = Paginator(products, products_per_page)
            
            try:
                page_obj = paginator.page(page)
            except EmptyPage:
                return None

            # Format response
            results = {
                'store': {
                    'id': store.id,
                    'name': store.name,
                    'description': store.description,
                    'logo': store.logo.url if store.logo else None,
                },
                'products': {
                    'items': list(page_obj.object_list.values(
                        'id', 'name', 'description', 'price',
                        'category__name', 'image'
                    )),
                    'total_pages': paginator.num_pages,
                    'current_page': page,
                    'total_items': paginator.count,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous(),
                }
            }
            
            return results
            
        except Store.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting store products: {str(e)}")
            return None

    @classmethod
    def get_all_categories(cls, page=1, per_page=10):
        categories = Category.objects.all().order_by('name')
        paginator = Paginator(categories, per_page)
        
        try:
            paginated_categories = paginator.page(page)
        except EmptyPage:
            return None

        return {
            'items': list(paginated_categories.object_list.values('id', 'name', 'description')),
            'total_pages': paginator.num_pages,
            'current_page': page,
            'total_items': paginator.count,
            'has_next': paginated_categories.has_next(),
            'has_previous': paginated_categories.has_previous(),
        }

class SearchService:
    CACHE_TTL = 3600  # Cache timeout in seconds (1 hour)
    RESULTS_PER_PAGE = 10

    @staticmethod
    def _get_cache_key(query_type, query, page=1):
        return f"search_{query_type}_{query}_{page}"

    @classmethod
    def search_products(cls, query, page=1, category_id=None):
        cache_key = cls._get_cache_key('products', f"{query}_{category_id}", page)
        results = cache.get(cache_key)

        if results is None:
            products = Product.objects.select_related('store', 'category').filter(is_active=True)
            
            if category_id:
                products = products.filter(category_id=category_id)
            
            if query:
                products = products.filter(
                    Q(name__icontains=query) |
                    Q(description__icontains=query)
                )

            paginator = Paginator(products, cls.RESULTS_PER_PAGE)
            results = {
                'items': list(paginator.page(page).object_list.values(
                    'id', 'name', 'description', 'price',
                    'store__name', 'category__name'
                )),
                'total_pages': paginator.num_pages,
                'total_items': paginator.count
            }
            
            cache.set(cache_key, results, cls.CACHE_TTL)
            
            # Log search analytics
            logger.info(f"Product search - Query: {query}, Results: {results['total_items']}")

        return results

    @classmethod
    def search_stores(cls, query, page=1, category_id=None):
        cache_key = cls._get_cache_key('stores', f"{query}_{category_id}", page)
        results = cache.get(cache_key)

        if results is None:
            stores = Store.objects.all()
            
            if category_id:
                stores = stores.filter(categories__id=category_id)
            
            if query:
                stores = stores.filter(
                    Q(name__icontains=query) |
                    Q(description__icontains=query)
                )

            paginator = Paginator(stores.distinct(), cls.RESULTS_PER_PAGE)
            results = {
                'items': list(paginator.page(page).object_list.values(
                    'id', 'name', 'description', 'logo'
                )),
                'total_pages': paginator.num_pages,
                'total_items': paginator.count
            }
            
            cache.set(cache_key, results, cls.CACHE_TTL)
            
            # Log search analytics
            logger.info(f"Store search - Query: {query}, Results: {results['total_items']}")

        return results

    @classmethod
    def get_category_items(cls, category_id, item_type='all', page=1):
        cache_key = cls._get_cache_key('category', f"{category_id}_{item_type}", page)
        results = cache.get(cache_key)

        if results is None:
            if item_type == 'products':
                items = Product.objects.filter(category_id=category_id)
                values_to_get = ['id', 'name', 'description', 'price', 'store__name']
            elif item_type == 'stores':
                items = Store.objects.filter(categories__id=category_id)
                values_to_get = ['id', 'name', 'description', 'logo']
            else:
                # Return both products and stores
                return {
                    'products': cls.get_category_items(category_id, 'products', page),
                    'stores': cls.get_category_items(category_id, 'stores', page)
                }

            paginator = Paginator(items.distinct(), cls.RESULTS_PER_PAGE)
            results = {
                'items': list(paginator.page(page).object_list.values(*values_to_get)),
                'total_pages': paginator.num_pages,
                'total_items': paginator.count
            }
            
            cache.set(cache_key, results, cls.CACHE_TTL)

        return results

    @staticmethod
    def search_store(store_name):
        try:
            store = Store.objects.get(name__iexact=store_name)
            return {
                'id': store.id,
                'name': store.name,
                'description': store.description,
                'logo': store.logo.url if store.logo else None
            }
        except Store.DoesNotExist:
            return None
