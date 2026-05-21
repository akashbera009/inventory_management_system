from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'old_status', 'new_status', 'changed_at')
    list_filter = ('changed_at',)
    search_fields = ('order__order_number',)
    readonly_fields = ('order', 'old_status', 'new_status', 'changed_at')
