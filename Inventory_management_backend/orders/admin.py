from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_purchase')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id','order_number', 'user', 'status', 'total_price', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('order_number', 'user__username')
    readonly_fields = ('order_number', 'total_price', 'created_at', 'updated_at')
    inlines = [OrderItemInline]
