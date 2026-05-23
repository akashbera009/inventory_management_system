from rest_framework import serializers
from products.models import Product, CSVImportJob


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class CSVImportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = CSVImportJob
        fields = ['id', 'status', 'total_rows', 'processed_rows', 'errors', 'created_at']
        read_only_fields = fields
