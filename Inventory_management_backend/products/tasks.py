import csv
import logging
from celery import shared_task

logger = logging.getLogger('file_logs')

REQUIRED_COLUMNS = {'name', 'sku', 'price', 'weight'}


@shared_task(bind=True, name='products.tasks.import_products_from_csv')
def import_products_from_csv(self, job_id: int):
    """
    Process a CSV product import job.

    Expected CSV columns: name, sku, price, weight, description (optional)
    Upserts products by SKU (create or update).
    """
    from products.models import Product, CSVImportJob

    try:
        job = CSVImportJob.objects.get(id=job_id)
    except CSVImportJob.DoesNotExist:
        logger.error(f'CSVImportJob #{job_id} not found.')
        return

    job.status = 'processing'
    job.save(update_fields=['status'])

    errors = []

    try:
        with open(job.file_path, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        # Validate header
        if not rows:
            job.status = 'failed'
            job.errors = ['CSV file is empty.']
            job.save(update_fields=['status', 'errors'])
            return

        columns = set(rows[0].keys())
        missing = REQUIRED_COLUMNS - columns
        if missing:
            job.status = 'failed'
            job.errors = [f'Missing required columns: {", ".join(missing)}']
            job.save(update_fields=['status', 'errors'])
            return

        job.total_rows = len(rows)
        job.save(update_fields=['total_rows'])

        for i, row in enumerate(rows, start=1):
            try:
                sku = row['sku'].strip()
                if not sku:
                    errors.append({'row': i, 'error': 'SKU is empty, skipping.'})
                    continue

                Product.objects.update_or_create(
                    sku=sku,
                    defaults={
                        'name': row['name'].strip(),
                        'price': float(row['price']),
                        'weight': float(row['weight']),
                        'description': row.get('description', '').strip() or None,
                        'is_active': True,
                    },
                )
            except Exception as e:
                errors.append({'row': i, 'error': str(e)})

            job.processed_rows = i
            job.save(update_fields=['processed_rows'])

        job.status = 'completed' if not errors or job.processed_rows > 0 else 'failed'
        job.errors = errors
        job.save(update_fields=['status', 'errors'])

        logger.info(
            f'CSV import job #{job_id}: {job.processed_rows}/{job.total_rows} rows processed, '
            f'{len(errors)} error(s).'
        )

    except Exception as e:
        logger.exception(f'CSV import job #{job_id} failed: {e}')
        job.status = 'failed'
        job.errors = [str(e)]
        job.save(update_fields=['status', 'errors'])
