from django.db import models
from django.conf import settings
from django.utils import timezone
from .section_model import Section
import base64
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from MallAPI.utils import format_error_message

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

    def clean(self):
        try:
            if Category.objects.filter(name__iexact=self.name).exclude(pk=self.pk).exists():
                raise ValidationError(format_error_message("A category with this name already exists."))
        except ValidationError as e:
            raise ValidationError(format_error_message(str(e)))

class StoreDiscount(models.Model):
    """Model to handle store-wide discounts applied to all products"""
    store = models.OneToOneField('Store', on_delete=models.CASCADE, related_name='discount')
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.store.name} - {self.percentage}% discount"

class Store(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='stores/logos/', null=True, blank=True)
    categories = models.ManyToManyField(Category, related_name='stores')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stores')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='stores')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def set_image_from_base64(self, base64_string):
        if base64_string:
            # Extract the image data from base64 string
            format, imgstr = base64_string.split(';base64,')
            ext = format.split('/')[-1]
            
            # Generate filename
            filename = f"store_{self.id}_{self.name}.{ext}"
            
            # Convert base64 to file and save
            data = ContentFile(base64.b64decode(imgstr))
            self.store_image.save(filename, data, save=True)

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, related_name='products', null=True, blank=True)
    store = models.ForeignKey(Store, on_delete=models.SET_NULL, related_name='products', null=True, blank=True)
    image = models.ImageField(upload_to='products/images/', null=True, blank=True)
    is_prize_product = models.BooleanField(default=False, help_text="Identifies products created automatically for prizes.")
    is_active = models.BooleanField(default=True, help_text="Controls visibility in regular store listings.")
    is_pre_order = models.BooleanField(default=False, help_text="Indicates if the product is available for pre-order only.")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def set_image_from_base64(self, base64_string):
        if base64_string:
            format, imgstr = base64_string.split(';base64,')
            ext = format.split('/')[-1]
            filename = f"product_{self.id}_{self.name}.{ext}"
            data = ContentFile(base64.b64decode(imgstr))
            self.image.save(filename, data, save=True)

class ProductComment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='product_comments')
    text = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.product.name}"

class ProductInteraction(models.Model):
    LIKE = 'LIKE'
    DISLIKE = 'DISLIKE'
    INTERACTION_CHOICES = [
        (LIKE, 'Like'),
        (DISLIKE, 'Dislike'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='interactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='product_interactions')
    interaction_type = models.CharField(max_length=10, choices=INTERACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user') # User can only have one interaction per product
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} {self.interaction_type}d {self.product.name}"

class CommentInteraction(models.Model):
    """ Model to track likes on comments/replies. """
    LIKE = 'LIKE'
    INTERACTION_CHOICES = [
        (LIKE, 'Like'),
        # Add other types like DISLIKE if needed later
    ]

    comment = models.ForeignKey(ProductComment, on_delete=models.CASCADE, related_name='interactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comment_interactions')
    # interaction_type = models.CharField(max_length=10, choices=INTERACTION_CHOICES, default=LIKE)
    # For now, simply the existence of a row means a like.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('comment', 'user') # User can only like a comment once
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} liked comment {self.comment.id}"

class ProductRating(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='product_ratings')
    rating = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)]) # 1 to 5 stars
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'user') # User can only rate a product once
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.name} rated {self.product.name}: {self.rating} stars"

class Favorite(models.Model):
    """ Model to store user's favorite products. """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='favorited_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product') # Prevent duplicates
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.name} favorited {self.product.name}"