from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_csvimportjob'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='category',
            field=models.CharField(
                blank=True,
                choices=[
                    ('Electronics', 'Electronics'),
                    ('Clothing', 'Clothing'),
                    ('Food & Beverage', 'Food & Beverage'),
                    ('Home & Garden', 'Home & Garden'),
                    ('Sports & Outdoors', 'Sports & Outdoors'),
                    ('Health & Beauty', 'Health & Beauty'),
                    ('Toys & Games', 'Toys & Games'),
                    ('Office Supplies', 'Office Supplies'),
                    ('Automotive', 'Automotive'),
                    ('Books & Media', 'Books & Media'),
                ],
                max_length=100,
                null=True,
            ),
        ),
    ]
