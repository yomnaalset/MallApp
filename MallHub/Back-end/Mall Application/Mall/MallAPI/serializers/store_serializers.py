from rest_framework import serializers
from MallAPI.models.store_model import Store, Product, Category,Section, ProductComment, ProductInteraction, CommentInteraction, ProductRating, Favorite, StoreDiscount
from MallAPI.utils import format_error_message
from django.db.models import Count, Avg

class StoreDiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreDiscount
        fields = ['id', 'store', 'percentage', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_name(self, value):
        # Case-insensitive validation
        if Section.objects.filter(name__iexact=value).exists():
            if self.instance and self.instance.name.lower() == value.lower():
                return value
            raise serializers.ValidationError("A section with this name already exists.")
        return value

    def validate(self, data):
        # Validate unique together constraint
        name = data.get('name')
        description = data.get('description')
        if name and description:
            if Section.objects.filter(
                name__iexact=name, 
                description=description
            ).exclude(pk=getattr(self.instance, 'pk', None)).exists():
                raise serializers.ValidationError(
                    "A section with this name and description already exists."
                )
        return data

class StoreBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

    def validate_name(self, value):
        # Case-insensitive validation
        if Category.objects.filter(name__iexact=value).exists():
            if self.instance and self.instance.name.lower() == value.lower():
                return value
            raise serializers.ValidationError("A category with this name already exists")
        return value

    def validate(self, data):
        # Validate unique together constraint
        name = data.get('name')
        description = data.get('description')
        if name and description:
            if Category.objects.filter(
                name__iexact=name, 
                description=description
            ).exclude(pk=getattr(self.instance, 'pk', None)).exists():
                raise serializers.ValidationError(
                    "A category with this name and description already exists."
                )
        return data

    def to_representation(self, instance):
        try:
            return super().to_representation(instance)
        except Exception as e:
            raise serializers.ValidationError(format_error_message(str(e)))

class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None

class StoreSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)
    categories = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    section = serializers.PrimaryKeyRelatedField(read_only=True)
    logo_url = serializers.SerializerMethodField()
    store_discount = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = ['id', 'name', 'description', 'categories', 'section', 'products', 'logo', 'logo_url', 'store_discount']

    def get_logo_url(self, obj):
        if obj.logo:
            return self.context['request'].build_absolute_uri(obj.logo.url)
        return None
        
    def get_store_discount(self, obj):
        try:
            discount = StoreDiscount.objects.filter(store=obj, is_active=True).first()
            if discount:
                return {
                    'percentage': discount.percentage,
                    'is_active': discount.is_active
                }
        except:
            pass
        return None

class ProductCreateSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category', 'image', 'is_pre_order']
        read_only_fields = ['id']

    def create(self, validated_data):
        store = self.context['store']
        return Product.objects.create(store=store, **validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class StoreCreateSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Category.objects.all()
    )
    section = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all()
    )

    class Meta:
        model = Store
        fields = ['id', 'name', 'description', 'categories', 'section', 'logo']
        read_only_fields = ['id']

    def validate(self, data):
        user = self.context['request'].user
        
        # Check if user is a store manager
        if user.role == 'STORE_MANAGER':
            # Only check for existing store during creation, not update
            if not self.instance and Store.objects.filter(owner=user).exists():
                raise serializers.ValidationError("Store manager can't create multiple stores!")
        # Check if user has permission to create stores
        elif not user.is_staff:
            raise serializers.ValidationError("You don't have permission to create a store")
            
        return data

    def to_representation(self, instance):
        """
        Customize the response format
        """
        return {
            'id': instance.id,
            'name': instance.name,
            'description': instance.description,
            'categories': [category.id for category in instance.categories.all()],
            'section': instance.section.id,
            'logo': instance.logo.url if instance.logo else None
        }

    def create(self, validated_data):
        categories = validated_data.pop('categories')
        store = Store.objects.create(
            owner=self.context['request'].user,
            **validated_data
        )
        store.categories.set(categories)
        return store

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if categories is not None:
            instance.categories.set(categories)
        
        return instance

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'description', 
            'price', 
            'category_name',
            'image',
            'image_url',
            'average_rating',
            'user_rating',
            'discounted_price',
            'is_pre_order'
        ]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None

    def get_average_rating(self, obj):
        return self.context.get('average_rating')

    def get_user_rating(self, obj):
        return self.context.get('user_rating')
        
    def get_discounted_price(self, obj):
        if not obj.store:
            return None
            
        try:
            discount = StoreDiscount.objects.filter(store=obj.store, is_active=True).first()
            if discount and discount.percentage > 0:
                discounted_price = float(obj.price) * (1 - (float(discount.percentage) / 100))
                return round(discounted_price, 2)
        except:
            pass
        return None

class StorePaginatedSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    section = SectionSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField()
    diamonds = serializers.SerializerMethodField()
    store_discount = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = ['id', 'name', 'description', 'categories', 'section', 'logo_url', 'diamonds', 'store_discount']

    def get_logo_url(self, obj):
        if obj.logo:
            return self.context['request'].build_absolute_uri(obj.logo.url)
        return None
        
    def get_diamonds(self, obj):
        # Check if include_diamonds parameter is present in the request
        include_diamonds = False
        if 'request' in self.context:
            include_diamonds = self.context['request'].query_params.get('include_diamonds', 'false').lower() == 'true'
        
        if include_diamonds:
            from MallAPI.models.Loyalty_models import Diamond
            from MallAPI.serializers.Loyalty_Serializers import DiamondSerializer
            
            # Get diamonds for this store
            diamonds = Diamond.objects.filter(store=obj)
            return DiamondSerializer(diamonds, many=True, context=self.context).data
        return []
        
    def get_store_discount(self, obj):
        try:
            discount = StoreDiscount.objects.filter(store=obj, is_active=True).first()
            if discount:
                return {
                    'percentage': discount.percentage,
                    'is_active': discount.is_active
                }
        except:
            pass
        return None

class ProductWithStoreSerializer(serializers.ModelSerializer):
    store_name = serializers.SerializerMethodField()
    store_logo = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    store_diamonds = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'price',
            'image_url',
            'store_name',
            'store_logo',
            'store_diamonds',
            'is_favorited',
            'discounted_price',
            'is_pre_order'
        ]

    def get_store_name(self, obj):
        # Return the store name if the store exists, otherwise return None or a default
        return obj.store.name if obj.store else None

    def get_store_logo(self, obj):
        if obj.store and obj.store.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.store.logo.url)
        return None

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None
        
    def get_store_diamonds(self, obj):
        # Check if include_store_diamonds parameter is present in the request
        include_diamonds = False
        if 'request' in self.context:
            include_diamonds = self.context['request'].query_params.get('include_store_diamonds', 'false').lower() == 'true'
        
        if include_diamonds:
            from MallAPI.models.Loyalty_models import Diamond
            
            # Get diamonds for this product's store
            diamonds = Diamond.objects.filter(store=obj.store)
            
            # Return simplified diamond data (just id, quantity, points_value)
            return [{'id': d.id, 'quantity': d.quantity, 'points_value': d.points_value} for d in diamonds]
        return []

    def get_is_favorited(self, obj):
        """ Check if the current user has favorited this product. """
        user = self.context['request'].user
        if user.is_authenticated:
            # Check if a Favorite entry exists for this user and product
            return Favorite.objects.filter(user=user, product=obj).exists()
        return False
        
    def get_discounted_price(self, obj):
        if not obj.store:
            return None
            
        try:
            discount = StoreDiscount.objects.filter(store=obj.store, is_active=True).first()
            if discount and discount.percentage > 0:
                discounted_price = float(obj.price) * (1 - (float(discount.percentage) / 100))
                return round(discounted_price, 2)
        except:
            pass
        return None

class ProductCommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    likes_count = serializers.SerializerMethodField()
    user_liked = serializers.SerializerMethodField()

    class Meta:
        model = ProductComment
        fields = [
            'id', 'product', 'user', 'text', 'parent',
            'created_at', 'updated_at', 'replies',
            'likes_count', 'user_liked'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'replies',
            'likes_count', 'user_liked'
        ]
        extra_kwargs = {
            'parent': {'write_only': True, 'required': False, 'allow_null': True}
        }

    def get_user(self, obj):
        # Explicitly return the name from the related user object
        if obj.user:
            return obj.user.name # Use the 'name' field instead of 'username'
        return None # Handle cases where user might be missing (though unlikely)

    def get_replies(self, obj):
        # Recursively serialize replies if they exist
        if obj.replies.exists():
            # Pass context and prefetch related user for efficiency
            replies_queryset = obj.replies.select_related('user').prefetch_related('interactions').all()
            return ProductCommentSerializer(replies_queryset, many=True, context=self.context).data
        return []

    def get_likes_count(self, obj):
        # Return the count of interactions (likes) for this comment
        # This count is often more efficiently calculated in the view using annotations,
        # but doing it here is simpler for now.
        return obj.interactions.count()

    def get_user_liked(self, obj):
        # Check if the current user (from context) has liked this comment
        user = self.context['request'].user
        if user.is_authenticated:
            return obj.interactions.filter(user=user).exists()
        return False

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Comment text cannot be empty.")
        return value

class ProductInteractionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    class Meta:
        model = ProductInteraction
        fields = ['id', 'product', 'user', 'interaction_type', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def validate_interaction_type(self, value):
        if value not in [ProductInteraction.LIKE, ProductInteraction.DISLIKE]:
            raise serializers.ValidationError(f"Invalid interaction type. Must be '{ProductInteraction.LIKE}' or '{ProductInteraction.DISLIKE}'.")
        return value

class CommentInteractionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.name')
    comment = serializers.PrimaryKeyRelatedField(queryset=ProductComment.objects.all())

    class Meta:
        model = CommentInteraction
        fields = ['id', 'comment', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class ProductRatingSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.name')
    product = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ProductRating
        fields = ['id', 'product', 'user', 'rating', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'product', 'created_at', 'updated_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

class FavoriteSerializer(serializers.ModelSerializer):
    # Nest the product details within the favorite
    product = ProductWithStoreSerializer(read_only=True)
    user = serializers.ReadOnlyField(source='user.name')

    class Meta:
        model = Favorite
        fields = ['id', 'user', 'product', 'added_at']
        read_only_fields = ['id', 'user', 'product', 'added_at']