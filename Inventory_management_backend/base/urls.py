from django.urls import path, include

urlpatterns = [
    path('v1/', include('base.api.v1.urls')),
]
