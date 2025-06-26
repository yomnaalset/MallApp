from django.db import models
from django.conf import settings
from MallAPI.models.cart_model import ShoppingCart

class Payment(models.Model):
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    cart = models.OneToOneField(ShoppingCart, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.payment_id} - {self.status}"
