from rest_framework import viewsets
from warehouses.models import Warehouse
from .serializers import WarehouseSerializer
from base.permissions import IsAuthenticatedOrReadOnly, IsManagerOrAdmin
from rest_framework.response import Response
from base.utils import LargeResultsSetPagination

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    pagination_class = LargeResultsSetPagination

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsManagerOrAdmin]
        else:
            permission_classes = [IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]

        # LIST
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        return Response(
            {
                "message": "Warehouses fetched successfully",
                "count": queryset.count(),
                "data": serializer.data
            }
        )