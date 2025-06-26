from django.contrib import admin
from .models import Category, Store, Product, User, Section
# Import Loyalty Models
from .models.Loyalty_models import Diamond, UserPoints, Prize, PrizeRedemption, GlobalLoyaltySetting

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'get_categories', 'created_at')
    list_filter = ('categories', )
    search_fields = ('name', 'owner__email')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('categories',)

    def get_categories(self, obj):
        return ", ".join([category.name for category in obj.categories.all()])
    get_categories.short_description = 'Categories'

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'store', 'category', 'is_prize_product', 'is_active')
    list_filter = ('category', 'store', 'is_prize_product', 'is_active')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')

admin.site.register(User)

# Register Loyalty Models

@admin.register(GlobalLoyaltySetting)
class GlobalLoyaltySettingAdmin(admin.ModelAdmin):
    list_display = ('id', 'diamond_points_value', 'updated_at')
    # Prevent adding more than one instance
    def has_add_permission(self, request):
        return not GlobalLoyaltySetting.objects.exists()

@admin.register(Diamond)
class DiamondAdmin(admin.ModelAdmin):
    list_display = ('store', 'quantity', 'points_value', 'updated_at')
    list_filter = ('store',)
    search_fields = ('store__name',)

@admin.register(UserPoints)
class UserPointsAdmin(admin.ModelAdmin):
    list_display = ('user', 'store', 'points', 'updated_at')
    list_filter = ('store',)
    search_fields = ('user__email', 'store__name')
    readonly_fields = ('user', 'store', 'points', 'created_at', 'updated_at') # Usually managed by system

@admin.register(Prize)
class PrizeAdmin(admin.ModelAdmin):
    list_display = ('name', 'points_required', 'store', 'is_product', 'available')
    list_filter = ('store', 'is_product', 'available')
    search_fields = ('name', 'description', 'product__name', 'store__name')
    # Make the linked product easier to select
    raw_id_fields = ('product',)

@admin.register(PrizeRedemption)
class PrizeRedemptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'prize', 'redeemed_at', 'status', 'discount_code', 'used')
    list_filter = ('status', 'prize__store', 'used')
    search_fields = ('user__email', 'prize__name', 'discount_code')
    readonly_fields = ('user', 'prize', 'redeemed_at', 'discount_code') # Usually managed by system