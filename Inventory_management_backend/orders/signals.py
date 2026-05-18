from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Order
from notifications.models import Notification
from audit_logs.models import AuditLog

@receiver(pre_save, sender=Order , dispatch_uid="track_order_status_change")
def track_order_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Order.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Order , dispatch_uid="create_audit_log_and_notification")
def create_audit_log_and_notification(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    new_status = instance.status

    if not created and old_status != new_status:
        # Create Audit Log
        AuditLog.objects.create(
            order=instance,
            old_status=old_status,
            new_status=new_status
        )

        # Create Notification
        Notification.objects.create(
            user=instance.user,
            message=f"Your order {instance.order_number} status has been updated from {old_status} to {new_status}."
        )
