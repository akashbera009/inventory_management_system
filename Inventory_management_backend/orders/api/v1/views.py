from rest_framework import viewsets, filters, status, permissions
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.shortcuts import get_object_or_404

from products.models import Product
from inventory.models import Inventory
from orders.models import Order, OrderItem
from .serializers import OrderCreateSerializer, OrderDetailSerializer, OrderStatusUpdateSerializer
from base.utils import LargeResultsSetPagination
from base.permissions import IsManagerOrAdmin

from django.db.models import Prefetch
from django.db import connection, reset_queries

class OrderViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['order_number']
    ordering_fields = ['created_at', 'total_price']
    pagination_class = LargeResultsSetPagination

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsManagerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Optimized queryset using prefetch_related and select_related 
        to solve the N+1 problem.
        """
        if self.request.user.is_authenticated:
            # Admins and Managers should be able to see ALL orders
            if self.request.user.role in ['ADMIN', 'MANAGER']:
                return Order.objects.prefetch_related(
                    Prefetch(
                        'items', 
                        queryset=OrderItem.objects.select_related('product')
                    )
                )
            # Standard users see only their own orders
            return Order.objects.filter(user=self.request.user).prefetch_related(
                Prefetch(
                    'items', 
                    queryset=OrderItem.objects.select_related('product')
                )
            )
        return Order.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderStatusUpdateSerializer
        return OrderDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items_data = serializer.validated_data['items']
        
        try:
            with transaction.atomic():
                order = Order.objects.create(user=request.user)
                total_price = 0

                for item in items_data:
                    product_id = item['product_id']
                    quantity = item['quantity']

                    # Validate product exists & is active
                    product = get_object_or_404(Product, id=product_id, is_active=True)

                    #Validate stock exists & enough stock available
                    inventory_items = Inventory.objects.filter(product=product, quantity_available__gte=quantity)

                    if not inventory_items.exists():
                        raise Exception(f"Insufficient stock for product: {product.name}")

                    inventory = inventory_items.first()
                    
                    # deduct inventory 
                    inventory.quantity_available -= quantity
                    inventory.save()

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        price_at_purchase=product.price
                    )
                    # calculate price
                    total_price += product.price * quantity

                order.total_price = total_price
                order.save()

                return Response({
                    "message": "Order created successfully",
                    "data": OrderDetailSerializer(order).data
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        reset_queries()

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = serializer.data
            print(f"🔥 Total Queries AFTER serialization in list orders: {len(connection.queries)}")
            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        print(f"🔥 Total Queries AFTER serialization in list orders: {len(connection.queries)}")

        return Response({
            "message": "Orders fetched successfully",
            "count": queryset.count(),
            "data": data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            "message": "Order fetched successfully",
            "data": serializer.data
        })
