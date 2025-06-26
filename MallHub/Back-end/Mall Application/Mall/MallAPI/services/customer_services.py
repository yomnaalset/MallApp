from django.db.models import Q
from MallAPI.models.store_model import Category, Store, Product

class CustomerService:
    @staticmethod
    def get_categories():
        return Category.objects.all()

    @staticmethod
    def get_stores_by_category(category_id):
        return Store.objects.filter(category_id=category_id, owner__is_active=True)

    @staticmethod
    def get_products_by_category(category_id):
        return Product.objects.filter(category_id=category_id)

    @staticmethod
    def get_store_details(store_id):
        return Store.objects.filter(id=store_id, owner__is_active=True).first()

    @staticmethod
    def search(query):
        return {
            'categories': Category.objects.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query)
            ),
            'stores': Store.objects.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query),
                owner__is_active=True
            ),
            'products': Product.objects.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query),
                store__owner__is_active=True
            )
        }