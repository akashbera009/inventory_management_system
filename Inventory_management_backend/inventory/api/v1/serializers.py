from rest_framework import serializers
from inventory.models import Inventory
from products.api.v1.serializers import ProductSerializer
from warehouses.api.v1.serializers import WarehouseSerializer

class InventorySerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    warehouse_details = WarehouseSerializer(source='warehouse', read_only=True)

    class Meta:
        model = Inventory
        fields = [
            'id', 
            'product', 
            'product_details', 
            'warehouse', 
            'warehouse_details', 
            'quantity_available', 
            'reserved_quantity', 
            'updated_at'
        ]
