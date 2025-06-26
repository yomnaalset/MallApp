from django.db import models
from django.conf import settings
from MallAPI.models.payment_model import Payment
from django.utils import timezone

class DeliveryOrder(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Order not yet received'),
        ('IN_PROGRESS', 'Delivery in progress'),
        ('DELIVERED', 'Order delivered')
    ]

    payment = models.OneToOneField(Payment, on_delete=models.CASCADE)
    delivery_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='deliveries'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Delivery {self.id} - {self.status}"

class ReturnOrder(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Return requested'),
        ('APPROVED', 'Return approved'),
        ('REJECTED', 'Return rejected'),
        ('IN_PROGRESS', 'Return pickup in progress'),
        ('COMPLETED', 'Return completed')
    ]

    delivery_order = models.OneToOneField(DeliveryOrder, on_delete=models.CASCADE, related_name='return_order')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='return_orders'
    )
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    delivery_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='return_deliveries',
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Return {self.id} - {self.status}"
    
    @property
    def is_eligible(self):
        """Check if order is eligible for return (within 48 hours of delivery)"""
        if not self.delivery_order.delivered_at:
            return False
        
        time_since_delivery = timezone.now() - self.delivery_order.delivered_at
        return time_since_delivery.total_seconds() <= (48 * 3600)  # 48 hours in seconds 