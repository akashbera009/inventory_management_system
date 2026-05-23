from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CSVImportView, CSVImportStatusView

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
    path('products/import/', CSVImportView.as_view(), name='product-csv-import'),
    path('products/import/<int:job_id>/status/', CSVImportStatusView.as_view(), name='product-csv-import-status'),
]
