from django.db import models
from .store_model import Store
from .user_model import User
from .store_model import Product, Category
from decimal import Decimal

class GlobalLoyaltySetting(models.Model):
    """Model for storing global loyalty program settings"""
    diamond_points_value = models.PositiveIntegerField(default=5000, help_text="Global value of points per diamond")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Global Loyalty Settings - {self.diamond_points_value} points per diamond"
    
    @classmethod
    def get_settings(cls):
        """Get or create global settings"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings

class Diamond(models.Model):
    """Model representing diamonds assigned to stores"""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='diamonds')
    quantity = models.PositiveIntegerField(default=1, help_text="Number of diamonds assigned to this store")
    points_value = models.PositiveIntegerField(default=0, help_text="Number of points each diamond represents")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.store.name} - {self.quantity} diamonds ({self.points_value} points each)"

class UserPoints(models.Model):
    """Model to track user points for each store"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='store_points')
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='user_points')
    points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'store')

    def __str__(self):
        return f"{self.user.username} - {self.store.name}: {self.points} points"

class Prize(models.Model):
    """Model for prizes that can be redeemed with points"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    points_required = models.PositiveIntegerField()
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='prizes', null=True, blank=True)
    is_product = models.BooleanField(default=False, help_text="Whether this prize is a physical product")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='prizes')
    # Fields for gift product (when product is null but is_product is True)
    product_name = models.CharField(max_length=255, null=True, blank=True, help_text="Name for gift product")
    product_description = models.TextField(null=True, blank=True, help_text="Description for gift product")
    product_image = models.ImageField(upload_to='gift_products/', null=True, blank=True, help_text="Image for gift product")
    discount_percentage = models.PositiveIntegerField(null=True, blank=True, help_text="Percentage discount for discount-type prizes")
    image = models.ImageField(upload_to='prize_images/', blank=True, null=True)
    available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.points_required} points)"

    def save(self, *args, **kwargs):
        """Override save to auto-create/link product if needed."""
        if self.is_product and not self.product:
            if not self.product_name:
                # Cannot create product without a name
                super().save(*args, **kwargs) # Save prize as is (will still show warning on redeem)
                print(f"Warning: Prize {self.id or '(new)'} is product but has no product_name. Cannot auto-create product.")
                return

            # Find default category (create if needed - simple version)
            prize_category, _ = Category.objects.get_or_create(name="Prizes")

            # Create/Update the associated hidden product
            # Use update_or_create based on name and prize flag to avoid duplicates if prize name reused?
            # For simplicity here, let's just create or get based on name + prize flag
            hidden_product, created = Product.objects.get_or_create(
                name=self.product_name,
                is_prize_product=True,
                defaults={
                    'description': self.product_description or 'Prize item',
                    'price': Decimal('0.00'),
                    'category': prize_category,
                    'store': self.store, # Link to same store as prize, if any
                    'image': self.product_image, # Use prize image if provided
                    'is_active': False # Hide from regular listings
                }
            )

            # If not created, maybe update fields?
            if not created:
                hidden_product.description = self.product_description or 'Prize item'
                hidden_product.price = Decimal('0.00') # Ensure price stays 0
                hidden_product.category = prize_category
                hidden_product.store = self.store
                if self.product_image:
                    hidden_product.image = self.product_image
                hidden_product.is_active = False
                hidden_product.save()

            # Link the prize to this product
            self.product = hidden_product
            print(f"Auto-created/linked Product ID {hidden_product.id} for Prize '{self.name}'")

        super().save(*args, **kwargs) # Call the original save method

class PrizeRedemption(models.Model):
    """Model to track prize redemptions by users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='redemptions')
    prize = models.ForeignKey(Prize, on_delete=models.CASCADE, related_name='redemptions')
    redeemed_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('delivered', 'Delivered')
    ], default='pending')
    discount_code = models.CharField(max_length=20, blank=True, null=True, help_text="Discount code for discount-type prizes")
    used = models.BooleanField(default=False, help_text="Whether discount code has been used")
    
    def __str__(self):
        return f"{self.user.username} - {self.prize.name}"