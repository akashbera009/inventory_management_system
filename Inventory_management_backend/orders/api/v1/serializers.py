from rest_framework import serializers
from orders.models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField()
    
    class Meta:
        model = OrderItem
        fields = ['product_id', 'quantity']
#  ndnd 
class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

class OrderDetailSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'user', 'status', 'total_price', 'items', 'created_at', 'updated_at']

    def get_items(self, obj):
        items = obj.items.all()
        return [
            {
                'product_name': item.product.name,
                'quantity': item.quantity,
                'price_at_purchase': item.price_at_purchase
            } for item in items
        ]

class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']

    def validate_status(self, value):
        instance = self.instance
        if not instance:
            return value

        current_status = instance.status
        allowed_transitions = {
            Order.StatusChoices.PENDING: [Order.StatusChoices.CONFIRMED, Order.StatusChoices.CANCELLED],
            Order.StatusChoices.CONFIRMED: [Order.StatusChoices.COMPLETED],
        }

        if current_status not in allowed_transitions or value not in allowed_transitions[current_status]:
            raise serializers.ValidationError(f"Cannot transition from {current_status} to {value}.")
        
        return value
