import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger('file_logs')

LOW_STOCK_THRESHOLD = 10

@shared_task(bind=True, name='inventory.tasks.check_low_stock')
def check_low_stock(self, threshold: int = LOW_STOCK_THRESHOLD):
    """
    Check all inventory records for low stock and create notifications
    for ADMIN/MANAGER users. Deduplicates within a 24-hour window.
    """
    from inventory.models import Inventory
    from notifications.models import Notification
    from accounts.models import User

    low_items = Inventory.objects.filter(
        quantity_available__lte=threshold
    ).select_related('product', 'warehouse')

    if not low_items.exists():
        logger.info('Low stock check: no items below threshold.')
        return {'checked': 0, 'notified': 0}

    recipients = list(
        User.objects.filter(role__in=['ADMIN', 'MANAGER'], is_active=True)
    )
    cutoff = timezone.now() - timedelta(hours=24)

    notified_count = 0
    for item in low_items:
        message = (
            f"Low stock alert: '{item.product.name}' in '{item.warehouse.name}' "
            f"has only {item.quantity_available} unit(s) remaining."
        )
        for user in recipients:
            # Skip if a similar notification was sent in the last 24 hours
            already_sent = Notification.objects.filter(
                user=user,
                message=message,
                created_at__gte=cutoff,
            ).exists()
            if not already_sent:
                Notification.objects.create(user=user, message=message)
                notified_count += 1

    logger.info(
        f'Low stock check: {low_items.count()} items below threshold, '
        f'{notified_count} notifications created.'
    )
    return {'checked': low_items.count(), 'notified': notified_count}
