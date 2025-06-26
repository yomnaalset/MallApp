from rest_framework import serializers
from MallAPI.models.store_model import Category, Store, Product
from MallAPI.models.user_model import User

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'email', 
            'name', 
            'phone_number', 
            'address', 
            'shipping_address',
            'preferences'
        ]
        read_only_fields = ['email']
        error_messages = {
            'phone_number': {
                'invalid': 'Please enter a valid phone number'
            },
            'name': {
                'required': 'Name is required',
                'blank': 'Name cannot be blank'
            }
        }

    def validate_phone_number(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits")
        return value

class CustomerCategorySerializer(serializers.ModelSerializer):
    store_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'store_count']
        error_messages = {
            'name': {
                'required': 'Category name is required',
                'blank': 'Category name cannot be blank'
            }
        }
    
    def get_store_count(self, obj):
        return obj.stores.count()

class CustomerStoreSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = ['id', 'name', 'description', 'category_name', 'product_count']
        error_messages = {
            'name': {
                'required': 'Store name is required',
                'blank': 'Store name cannot be blank'
            }
        }
    
    def get_product_count(self, obj):
        return obj.products.count()

class CustomerProductSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'description', 
            'price', 
            'store_name',
            'category_name'
        ]
        error_messages = {
            'name': {
                'required': 'Product name is required',
                'blank': 'Product name cannot be blank'
            },
            'price': {
                'required': 'Price is required',
                'invalid': 'Please enter a valid price',
                'min_value': 'Price must be greater than 0'
            }
        }