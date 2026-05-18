from django.urls import path, include

app_name = 'accounts'

urlpatterns = [
    # Version 1 APIs
    path('v1/', include('accounts.api.v1.urls')),

    # You can add non-API urls here if needed
    # path('some-non-api-url/', some_view, name='some-name'),

    # When you add v2 APIs in the future:
    # path('v2/', include('accounts.api.v2.urls')),
]