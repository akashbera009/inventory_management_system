from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name','id', 'sku', 'price','category', 'weight', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'sku')
    readonly_fields = ('created_at', 'updated_at')
