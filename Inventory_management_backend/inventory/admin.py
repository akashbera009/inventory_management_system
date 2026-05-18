from django.contrib import admin
from .models import Inventory

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = (
        'id', 
        'product', 
        'get_product_id', 
        'warehouse', 
        'get_warehouse_id', 
        'quantity_available', 
        'reserved_quantity', 
        'updated_at'
    )
    list_filter = ('warehouse', 'product')
    search_fields = ('product__name', 'product__sku', 'warehouse__name')
    readonly_fields = ('updated_at',)

    def get_product_id(self, obj):
        return obj.product.id
    get_product_id.short_description = 'Product ID'

    def get_warehouse_id(self, obj):
        return obj.warehouse.id
    get_warehouse_id.short_description = 'Warehouse ID'
