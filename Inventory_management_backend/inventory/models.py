from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError

class Inventory(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='inventory')
    warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.CASCADE, related_name='inventory')
    quantity_available = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    reserved_quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Inventories"
        constraints = [
            models.UniqueConstraint(fields=['product', 'warehouse'], name='unique_product_warehouse')
        ]
        indexes = [
            models.Index(fields=['product', 'warehouse']),
        ]

    # Custom validation for reserved_quantity and quantity_available [ Runs before saving.] 
    def clean(self):
        if self.reserved_quantity > self.quantity_available:
            raise ValidationError("Reserved quantity cannot exceed available quantity.")
        if self.quantity_available < 0:
            raise ValidationError("Quantity available cannot be negative.")
        
    # Custom save method to ensure validation [ runs validators,clean(),field checks ]
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} at {self.warehouse.name}: {self.quantity_available}"
