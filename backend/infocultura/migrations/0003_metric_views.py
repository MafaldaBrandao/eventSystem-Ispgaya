from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('infocultura', '0002_appuser_role_club'),
    ]

    operations = [
        migrations.CreateModel(
            name='MetricView',
            fields=[
                (
                    'id',
                    models.AutoField(
                        db_column='id_metric_view',
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ('kind', models.CharField(choices=[('page_view', 'Page View')], default='page_view', max_length=32)),
                ('section', models.CharField(db_index=True, max_length=64)),
                ('content_type', models.CharField(blank=True, default='', max_length=64)),
                ('object_id', models.IntegerField(blank=True, db_index=True, null=True)),
                ('title', models.CharField(max_length=255)),
                ('page_path', models.CharField(db_index=True, max_length=255)),
                ('locale', models.CharField(blank=True, default='', max_length=8)),
                ('referrer', models.CharField(blank=True, default='', max_length=500)),
                ('user_agent', models.CharField(blank=True, default='', max_length=255)),
                ('visitor_key', models.CharField(blank=True, db_index=True, default='', max_length=64)),
                ('viewed_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'club',
                    models.ForeignKey(
                        blank=True,
                        db_column='id_club',
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='metric_views',
                        to='infocultura.club',
                    ),
                ),
            ],
            options={
                'db_table': 'metric_views',
                'ordering': ['-viewed_at', '-id'],
            },
        ),
    ]
