import random
from django.core.management.base import BaseCommand
from products.models import Product

CATEGORIES = [
    'Electronics',
    'Clothing',
    'Food & Beverage',
    'Home & Garden',
    'Sports & Outdoors',
    'Health & Beauty',
    'Toys & Games',
    'Office Supplies',
    'Automotive',
    'Books & Media',
]


class Command(BaseCommand):
    help = 'Assign a random category to every product that has no category set'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Overwrite category even for products that already have one',
        )

    def handle(self, *args, **options):
        overwrite = options['all']
        qs = Product.objects.all() if overwrite else Product.objects.filter(category__isnull=True)
        total = qs.count()

        if total == 0:
            self.stdout.write(self.style.SUCCESS('All products already have a category. Use --all to overwrite.'))
            return

        updated = []
        for product in qs:
            product.category = random.choice(CATEGORIES)
            updated.append(product)

        Product.objects.bulk_update(updated, ['category'])
        self.stdout.write(
            self.style.SUCCESS(f'✓ Assigned random categories to {total} product(s).')
        )
