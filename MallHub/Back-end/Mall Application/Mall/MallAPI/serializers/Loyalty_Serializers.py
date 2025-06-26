from rest_framework import serializers
from MallAPI.models.Loyalty_models import Diamond, UserPoints, Prize, PrizeRedemption, GlobalLoyaltySetting
from MallAPI.serializers.store_serializers import StoreSerializer
from MallAPI.serializers.user_serializers import UserSerializer

class GlobalLoyaltySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalLoyaltySetting
        fields = ['id', 'diamond_points_value', 'created_at', 'updated_at']

class DiamondSerializer(serializers.ModelSerializer):
    store_details = StoreSerializer(source='store', read_only=True)
    
    class Meta:
        model = Diamond
        fields = ['id', 'store', 'store_details', 'quantity', 'points_value', 'created_at', 'updated_at']
        
    def to_representation(self, instance):
        """
        Pass request context to nested serializers
        """
        representation = super().to_representation(instance)
        
        # Try to get request from different context structures
        request = None
        if self.context and 'request' in self.context:
            # Standard context
            request = self.context['request']
        elif hasattr(self, '_context') and 'context' in self._context and 'request' in self._context['context']:
            # Nested context
            request = self._context['context']['request']
            
        if request:
            representation['store_details'] = StoreSerializer(instance.store, context={'request': request}).data
            
        return representation

class StoreWithDiamondsSerializer(serializers.ModelSerializer):
    diamonds = DiamondSerializer(many=True, read_only=True)
    categories = serializers.StringRelatedField(many=True, read_only=True)
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Diamond.store.field.related_model  # Gets the Store model
        fields = ['id', 'logo', 'logo_url', 'name', 'categories', 'diamonds']
        
    def get_logo_url(self, obj):
        if obj.logo:
            request = None
            # Check both direct context and context within context (for nested serialization)
            if self.context and 'request' in self.context:
                request = self.context['request']
            # Try to get request from nested context
            elif self.context and 'context' in self.context and 'request' in self.context['context']:
                request = self.context['context']['request']
                
            if request:
                return request.build_absolute_uri(obj.logo.url)
        return None

class UserPointsSerializer(serializers.ModelSerializer):
    store_details = StoreSerializer(source='store', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = UserPoints
        fields = ['id', 'user', 'user_details', 'store', 'store_details', 'points', 'created_at', 'updated_at']
        
    def to_representation(self, instance):
        """
        Pass request context to nested serializers
        """
        representation = super().to_representation(instance)
        
        # Try to get request from context
        request = None
        if self.context and 'request' in self.context:
            request = self.context['request']
            
        if request:
            representation['store_details'] = StoreSerializer(instance.store, context={'request': request}).data
            representation['user_details'] = UserSerializer(instance.user, context={'request': request}).data
            
        return representation

class PrizeSerializer(serializers.ModelSerializer):
    store_details = StoreSerializer(source='store', read_only=True)
    redeemed_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Prize
        fields = ['id', 'name', 'description', 'points_required', 'store', 'store_details', 
                  'is_product', 'product_name', 'product_description', 'product_image',
                  'discount_percentage', 'image', 'available', 'created_at', 'updated_at',
                  'redeemed_by_user']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make store field optional for admin users
        if 'context' in kwargs and 'request' in kwargs['context']:
            user = kwargs['context']['request'].user
            if user.is_authenticated and user.role == 'ADMIN':
                self.fields['store'].required = False
                
    def get_redeemed_by_user(self, obj):
        """Check if the prize has been redeemed by the user in the request context."""
        user = None
        request = self.context.get('request')
        if request and hasattr(request, "user") and request.user.is_authenticated:
            user = request.user
        else:
            return False # Cannot determine without a logged-in user
            
        # Check if a redemption record exists for this user and prize
        return PrizeRedemption.objects.filter(user=user, prize=obj).exists()
                
    def to_representation(self, instance):
        """
        Pass request context to nested serializers
        """
        representation = super().to_representation(instance)
        
        # Try to get request from context
        request = None
        if self.context and 'request' in self.context:
            request = self.context['request']
            
        if request and instance.store:
            representation['store_details'] = StoreSerializer(instance.store, context={'request': request}).data
            
        # Handle image URLs
        if instance.image:
            if request:
                representation['image'] = request.build_absolute_uri(instance.image.url)
            else:
                representation['image'] = instance.image.url if instance.image else None
                
        if instance.product_image:
            if request:
                representation['product_image'] = request.build_absolute_uri(instance.product_image.url)
            else:
                representation['product_image'] = instance.product_image.url if instance.product_image else None
            
        return representation

class PrizeRedemptionSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    prize_details = PrizeSerializer(source='prize', read_only=True)
    
    class Meta:
        model = PrizeRedemption
        fields = ['id', 'user', 'user_details', 'prize', 'prize_details', 'redeemed_at', 'status', 'discount_code', 'used']
        
    def to_representation(self, instance):
        """
        Pass request context to nested serializers
        """
        representation = super().to_representation(instance)
        
        # Try to get request from context
        request = None
        if self.context and 'request' in self.context:
            request = self.context['request']
            
        if request:
            representation['user_details'] = UserSerializer(instance.user, context={'request': request}).data
            representation['prize_details'] = PrizeSerializer(instance.prize, context={'request': request}).data
            
        return representation

class PointsBreakdownSerializer(serializers.Serializer):
    store_id = serializers.IntegerField()
    store_name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    points = serializers.IntegerField()

class PointsPreviewSerializer(serializers.Serializer):
    total_points = serializers.IntegerField()
    breakdown = PointsBreakdownSerializer(many=True)

class DiscountApplicationSerializer(serializers.Serializer):
    original_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = serializers.IntegerField()
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    final_amount = serializers.DecimalField(max_digits=10, decimal_places=2)

class PointsConversionSerializer(serializers.Serializer):
    store_id = serializers.IntegerField(required=False)
    points_per_diamond = serializers.IntegerField()