from django.db import models
from django.conf import settings
from base.models.mixins import BaseModel
from django.core.validators import MinValueValidator

class Product(BaseModel):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    weight = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    CATEGORY_CHOICES = (
        ('Electronics', 'Electronics'),
        ('Clothing', 'Clothing'),
        ('Food & Beverage', 'Food & Beverage'),
        ('Home & Garden', 'Home & Garden'),
        ('Sports & Outdoors', 'Sports & Outdoors'),
        ('Health & Beauty', 'Health & Beauty'),
        ('Toys & Games', 'Toys & Games'),
        ('Office Supplies', 'Office Supplies'),
        ('Automotive', 'Automotive'),
        ('Books & Media', 'Books & Media'),
    )
    category = models.CharField(
        max_length=100,
        choices=CATEGORY_CHOICES,
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.sku})"


class CSVImportJob(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='csv_imports')
    file_path = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    errors = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"CSVImport #{self.id} by {self.user.username} ({self.status})"
