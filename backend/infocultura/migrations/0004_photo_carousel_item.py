import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('infocultura', '0003_metric_views'),
    ]

    operations = [
        migrations.CreateModel(
            name='PhotoCarouselItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('section', models.CharField(default='homepage', max_length=80)),
                ('title', models.CharField(max_length=180)),
                ('caption', models.TextField(blank=True, default='')),
                ('image', models.CharField(max_length=500)),
                ('alt_text', models.CharField(blank=True, default='', max_length=255)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'infocultura_photo_carousel_item',
                'ordering': ['section', 'display_order', '-updated_at'],
            },
        ),
    ]
