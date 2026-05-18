from django.contrib import admin
from .models import Warehouse

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name','id', 'city', 'state', 'capacity', 'is_active')
    list_filter = ('is_active', 'state')
    search_fields = ('name', 'city')
