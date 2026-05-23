from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Q

from orders.models import Order
from inventory.models import Inventory
from warehouses.models import Warehouse

LOW_STOCK_THRESHOLD = 10


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin_or_manager = user.role in ['ADMIN', 'MANAGER']

        # Order counts — ADMIN/MANAGER see all, STAFF see own
        if is_admin_or_manager:
            order_qs = Order.objects.all()
        else:
            order_qs = Order.objects.filter(user=user)

        status_counts = (
            order_qs
            .values('status')
            .annotate(count=Count('id'))
        )
        counts_by_status = {row['status']: row['count'] for row in status_counts}

        active_orders = (
            counts_by_status.get('pending', 0) +
            counts_by_status.get('confirmed', 0)
        )

        data = {
            'active_orders': active_orders,
            'order_status_counts': {
                'pending': counts_by_status.get('pending', 0),
                'confirmed': counts_by_status.get('confirmed', 0),
                'completed': counts_by_status.get('completed', 0),
                'cancelled': counts_by_status.get('cancelled', 0),
            },
        }

        if is_admin_or_manager:
            revenue_result = (
                order_qs
                .filter(status='completed')
                .aggregate(total=Sum('total_price'))
            )
            data['total_revenue'] = str(revenue_result['total'] or '0.00')

            data['low_stock_count'] = Inventory.objects.filter(
                quantity_available__lte=LOW_STOCK_THRESHOLD
            ).count()

            data['warehouse_count'] = Warehouse.objects.filter(is_active=True).count()

        return Response({'data': data})
