from rest_framework import serializers
from audit_logs.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    order = serializers.CharField(source='order.order_number', read_only=True)
    class Meta:
        model = AuditLog
        fields = '__all__'
