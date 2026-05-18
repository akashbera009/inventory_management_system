from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from base.permissions import IsManagerOrAdmin

from audit_logs.models import AuditLog
from .serializers import AuditLogSerializer
from base.utils import LargeResultsSetPagination

class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['old_status', 'new_status']
    search_fields = ['order__order_number']
    ordering_fields = ['changed_at']
    pagination_class = LargeResultsSetPagination

    def get_queryset(self):
        # return AuditLog.objects.filter(order__user=self.request.user)
        # return AuditLog.objects.select_related('order').all()
        return AuditLog.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        return Response({
            "message": "Audit logs fetched successfully",
            "count": queryset.count(),
            "data": serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            "message": "Audit log fetched successfully",
            "data": serializer.data
        })
