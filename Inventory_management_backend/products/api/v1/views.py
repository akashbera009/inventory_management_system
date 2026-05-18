from base.permissions import IsManagerOrAdmin
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django_filters.rest_framework import DjangoFilterBackend

from products.models import Product
from .serializers import ProductSerializer
from base.permissions import IsAuthenticatedOrReadOnly

from base.utils import LargeResultsSetPagination

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsManagerOrAdmin]
        else:
            permission_classes = [IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]
        
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'is_active': ['exact'],
        'price': ['exact', 'gte', 'lte'],
        'weight': ['exact', 'gte', 'lte'],
    }
    search_fields = ['name', 'sku']
    ordering_fields = ['price', 'created_at']
    pagination_class = LargeResultsSetPagination  # required for pagination

    # CREATE
    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "message": "Product created successfully",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    # LIST
    @method_decorator(cache_page(60 * 2))  # Cache for 2 minutes
    def list(self, request, *args, **kwargs):
        print("VIEW EXECUTED [ not serving from redis cache ]")
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        return Response(
            {
                "message": "Products fetched successfully",
                "count": queryset.count(),
                "data": serializer.data
            }
        )

    # RETRIEVE SINGLE
    def retrieve(self, request, *args, **kwargs):

        instance = self.get_object()
        serializer = self.get_serializer(instance)

        return Response(
            {
                "message": "Product fetched successfully",
                "data": serializer.data
            }
        )

    # UPDATE
    def update(self, request, *args, **kwargs):

        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "message": "Product updated successfully",
                "data": serializer.data
            }
        )

    # DELETE
    def destroy(self, request, *args, **kwargs):

        instance = self.get_object()
        delete_id = instance.id
        instance.delete()

        return Response(
            {
                "message": "Product deleted successfully",
                "data": {
                    "id": delete_id,
                    "sku": instance.sku,
                    "name": instance.name,
                    "description": instance.description,
                    "price": instance.price,
                    "is_active": instance.is_active,
                    "created_at": instance.created_at,
                    "updated_at": instance.updated_at,
                    "weight": instance.weight,
                }
            },
            status=status.HTTP_204_NO_CONTENT
        )