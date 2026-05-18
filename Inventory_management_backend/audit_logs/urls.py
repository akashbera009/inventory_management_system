from django.urls import path, include

urlpatterns = [
    path('v1/', include('audit_logs.api.v1.urls')),
]
