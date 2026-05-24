from rest_framework import serializers
from products.models import Product, CSVImportJob


class ProductSerializer(serializers.ModelSerializer):
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'description', 'price', 'weight',
            'category', 'is_active', 'total_stock', 'created_at', 'updated_at'
        ]

    def get_total_stock(self, obj):
        # Retrieve all inventory records for this product and sum them up
        return sum(item.quantity_available for item in obj.inventory.all())


class CSVImportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = CSVImportJob
        fields = ['id', 'status', 'total_rows', 'processed_rows', 'errors', 'created_at']
        read_only_fields = fields
