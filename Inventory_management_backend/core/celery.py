import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('inventory')

app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-low-stock-every-hour': {
        'task': 'inventory.tasks.check_low_stock',
        'schedule': crontab(minute=0),
    },
}
