from django.db import models

class DiscountCode(models.Model):
    code = models.CharField(max_length=50, unique=True)
    value = models.DecimalField(max_digits=5, decimal_places=2, help_text="Discount percentage")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    used = models.BooleanField(default=False, help_text="Whether discount code has been used")
    expiration_date = models.DateTimeField(blank=True, null=True, help_text="Date when this discount code expires")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.value}%" 