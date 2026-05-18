from django.db import models

class AuditLog(models.Model):
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='audit_logs')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.order.order_number}: {self.old_status} -> {self.new_status}"
