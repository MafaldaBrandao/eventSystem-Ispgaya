from django.db import migrations


def add_is_active_columns(apps, schema_editor):
    table_columns = {
        "news": "is_active",
        "books": "is_active",
        "sessions": "is_active",
        "event": "is_active",
    }
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        existing = {
            table: {column.name for column in connection.introspection.get_table_description(cursor, table)}
            for table in table_columns
        }

    for table, column in table_columns.items():
        if column in existing.get(table, set()):
            continue
        schema_editor.execute(
            f"ALTER TABLE `{table}` ADD COLUMN `{column}` BOOL NOT NULL DEFAULT 1"
        )


def remove_is_active_columns(apps, schema_editor):
    table_columns = {
        "news": "is_active",
        "books": "is_active",
        "sessions": "is_active",
        "event": "is_active",
    }
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        existing = {
            table: {column.name for column in connection.introspection.get_table_description(cursor, table)}
            for table in table_columns
        }

    for table, column in table_columns.items():
        if column not in existing.get(table, set()):
            continue
        schema_editor.execute(
            f"ALTER TABLE `{table}` DROP COLUMN `{column}`"
        )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("infocultura", "0004_photo_carousel_item"),
    ]

    operations = [
        migrations.RunPython(add_is_active_columns, remove_is_active_columns),
    ]
