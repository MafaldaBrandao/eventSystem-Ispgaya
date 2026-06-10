import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='CulturalContent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('area', models.CharField(choices=[('tuna', 'Tuna Academica'), ('clube-leitura', 'Clube de Leitura'), ('teatro', 'Teatro')], max_length=32)),
                ('title', models.CharField(max_length=180)),
                ('description', models.TextField()),
                ('date', models.DateField()),
                ('status', models.CharField(choices=[('rascunho', 'Rascunho'), ('publicado', 'Publicado')], default='rascunho', max_length=16)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
    ]
