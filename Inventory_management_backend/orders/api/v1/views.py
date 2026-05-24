from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.shortcuts import get_object_or_404

from products.models import Product
from inventory.models import Inventory
from orders.models import Order, OrderItem
from notifications.models import Notification
from accounts.models import User
from .serializers import OrderCreateSerializer, OrderDetailSerializer, OrderStatusUpdateSerializer
from base.utils import LargeResultsSetPagination
from base.permissions import IsManagerOrAdmin, IsBuyer

from django.db.models import Prefetch
from django.db import connection, reset_queries


def _items_summary(items_data, product_map):
    parts = []
    for i in items_data:
        pid = i['product_id']
        name = product_map.get(pid, f"Product #{pid}")
        parts.append(f"{name} \xd7{i['quantity']}")
    return ", ".join(parts)


STATUS_CUSTOMER_MESSAGES = {
    'confirmed': 'Your order has been confirmed and is being processed.',
    'completed': 'Your order has been delivered. Thank you for shopping with us!',
    'cancelled': 'Your order has been cancelled. Contact support if you have questions.',
}


class OrderViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['order_number']
    ordering_fields = ['created_at', 'total_price']
    pagination_class = LargeResultsSetPagination

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [IsBuyer]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsManagerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Optimized queryset using prefetch_related and select_related 
        to solve the N+1 problem.
        """
        if not self.request.user.is_authenticated:
            return Order.objects.none()

        base_qs = Order.objects.select_related('user').prefetch_related(
            Prefetch('items', queryset=OrderItem.objects.select_related('product'))
        )

        if self.request.user.role in ['ADMIN', 'MANAGER', 'STAFF']:
            queryset = base_qs.all()
        else:
            queryset = base_qs.filter(user=self.request.user)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(items__product__category=category).distinct()

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderStatusUpdateSerializer
        return OrderDetailSerializer

    # ── Create (BUYER only) ────────────────────────────────────────
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items_data = serializer.validated_data['items']

        try:
            with transaction.atomic():
                order = Order.objects.create(user=request.user)
                total_price = 0
                product_map = {}

                for item in items_data:
                    product_id = item['product_id']
                    quantity = item['quantity']

                    product = get_object_or_404(Product, id=product_id, is_active=True)
                    product_map[product_id] = product.name

                    inventory_items = Inventory.objects.filter(
                        product=product, quantity_available__gte=quantity
                    )
                    if not inventory_items.exists():
                        raise Exception(f"Insufficient stock for product: {product.name}")

                    inventory = inventory_items.first()
                    inventory.quantity_available -= quantity
                    inventory.reserved_quantity += quantity
                    inventory.save()

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        price_at_purchase=product.price,
                    )
                    total_price += product.price * quantity

                order.total_price = total_price
                order.save()

                summary = _items_summary(items_data, product_map)

                # Notify STAFF + MANAGER (operator format)
                staff_msg = (
                    f"🛒 New Order Received | #{order.order_number} | "
                    f"Customer: {request.user.username} | "
                    f"Items: {summary} | "
                    f"Total: ${total_price:.2f}"
                )
                recipients = User.objects.filter(role__in=['STAFF', 'MANAGER'])
                Notification.objects.bulk_create([
                    Notification(user=r, message=staff_msg) for r in recipients
                ])

                # Notify BUYER (customer format)
                Notification.objects.create(
                    user=request.user,
                    message=(
                        f"✅ Order Placed! | #{order.order_number} | "
                        f"Items: {summary} | "
                        f"Total: ${total_price:.2f} | "
                        f"We'll notify you on every status update."
                    ),
                )

                return Response(
                    {"message": "Order created successfully", "data": OrderDetailSerializer(order).data},
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ── Update (MANAGER / ADMIN only) — sends notification to buyer ─
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data.get('status', old_status)

        with transaction.atomic():
            serializer.save()

            if old_status != new_status:
                # Stock adjustments on transition
                if old_status == Order.StatusChoices.PENDING:
                    if new_status == Order.StatusChoices.CANCELLED:
                        # Cancelled: restore available and remove from reserved
                        for item in instance.items.select_related('product').all():
                            inv = Inventory.objects.filter(product=item.product).first()
                            if inv:
                                inv.quantity_available += item.quantity
                                inv.reserved_quantity = max(0, inv.reserved_quantity - item.quantity)
                                inv.save()
                    elif new_status in [Order.StatusChoices.CONFIRMED, Order.StatusChoices.COMPLETED]:
                        # Confirmed/Completed: remove from reserved (already deducted from available)
                        for item in instance.items.select_related('product').all():
                            inv = Inventory.objects.filter(product=item.product).first()
                            if inv:
                                inv.reserved_quantity = max(0, inv.reserved_quantity - item.quantity)
                                inv.save()

                detail = STATUS_CUSTOMER_MESSAGES.get(
                    new_status, f"Status updated to {new_status.upper()}."
                )
                Notification.objects.create(
                    user=instance.user,
                    message=(
                        f"📦 Order Status Update | #{instance.order_number} | "
                        f"New Status: {new_status.upper()} | "
                        f"{detail}"
                    ),
                )

        return Response({
            "message": "Order status updated",
            "data": OrderDetailSerializer(instance).data,
        })

    # ── Cancel (BUYER only — restores inventory + notifies staff) ──
    @action(detail=True, methods=['post'], permission_classes=[IsBuyer])
    def cancel(self, request, pk=None):
        order = self.get_object()

        if order.user != request.user:
            return Response(
                {'error': 'You can only cancel your own orders.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if order.status != Order.StatusChoices.PENDING:
            return Response(
                {'error': 'Only pending orders can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Restore inventory for every item in the order
            for item in order.items.select_related('product').all():
                inv = Inventory.objects.filter(product=item.product).first()
                if inv:
                    inv.quantity_available += item.quantity
                    inv.reserved_quantity = max(0, inv.reserved_quantity - item.quantity)
                    inv.save()

            order.status = Order.StatusChoices.CANCELLED
            order.save()

        # Notify STAFF + MANAGER
        recipients = User.objects.filter(role__in=['STAFF', 'MANAGER'])
        Notification.objects.bulk_create([
            Notification(
                user=r,
                message=(
                    f"❌ Order Cancelled by Customer | #{order.order_number} | "
                    f"Customer: {request.user.username} | "
                    f"Total: ${order.total_price:.2f} | "
                    f"Inventory has been restored."
                ),
            )
            for r in recipients
        ])

        # Notify the buyer
        Notification.objects.create(
            user=request.user,
            message=(
                f"❌ Order Cancelled | #{order.order_number} | "
                f"Your order has been cancelled and stock has been restored."
            ),
        )

        return Response(
            {"message": "Order cancelled successfully"},
            status=status.HTTP_200_OK,
        )

    # ── List ───────────────────────────────────────────────────────
    def list(self, request, *args, **kwargs):
        reset_queries()
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = serializer.data
            print(f"🔥 Total Queries: {len(connection.queries)}")
            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Orders fetched successfully",
            "count": queryset.count(),
            "data": serializer.data,
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({"message": "Order fetched successfully", "data": serializer.data})
