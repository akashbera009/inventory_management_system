import os
import tempfile

from base.permissions import IsManagerOrAdmin
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django_filters.rest_framework import DjangoFilterBackend

from products.models import Product, CSVImportJob
from .serializers import ProductSerializer, CSVImportJobSerializer
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


class CSVImportView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request):
        """Accept a CSV file, save to a temp file, and queue the import task."""
        from products.tasks import import_products_from_csv

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if not file.name.endswith('.csv'):
            return Response({'error': 'Only CSV files are accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save to a named temp file so the Celery worker can read it
        suffix = '.csv'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        job = CSVImportJob.objects.create(user=request.user, file_path=tmp_path)
        import_products_from_csv.delay(job.id)

        serializer = CSVImportJobSerializer(job)
        return Response(
            {'message': 'Import job queued.', 'data': serializer.data},
            status=status.HTTP_202_ACCEPTED,
        )


class CSVImportStatusView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request, job_id):
        """Return the current status and progress of a CSV import job."""
        try:
            job = CSVImportJob.objects.get(id=job_id, user=request.user)
        except CSVImportJob.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CSVImportJobSerializer(job)
        return Response({'data': serializer.data})