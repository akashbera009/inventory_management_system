from django.urls import path, include

urlpatterns = [
    path('v1/', include('warehouses.api.v1.urls')),
]
