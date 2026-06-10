from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Aplica as alteracoes SQL necessarias para a funcionalidade de agendamento de forma segura.'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # 1. Verificar e atualizar a tabela 'event'
            self.stdout.write("A verificar tabela 'event'...")
            table_event = 'event'
            columns_event = [info.name for info in connection.introspection.get_table_description(cursor, table_event)]
            
            if 'start_date' not in columns_event:
                self.stdout.write("A adicionar 'start_date' a 'event'...")
                cursor.execute(f"ALTER TABLE {table_event} ADD COLUMN start_date DATETIME NULL")
            
            if 'end_date' not in columns_event:
                self.stdout.write("A adicionar 'end_date' a 'event'...")
                cursor.execute(f"ALTER TABLE {table_event} ADD COLUMN end_date DATETIME NULL")
            
            if 'created_at' not in columns_event:
                self.stdout.write("A adicionar 'created_at' a 'event'...")
                cursor.execute(f"ALTER TABLE {table_event} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            
            if 'updated_at' not in columns_event:
                self.stdout.write("A adicionar 'updated_at' a 'event'...")
                cursor.execute(f"ALTER TABLE {table_event} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")

            # 2. Verificar e atualizar a tabela 'sessions'
            self.stdout.write("\nA verificar tabela 'sessions'...")
            table_sessions = 'sessions'
            columns_sessions = [info.name for info in connection.introspection.get_table_description(cursor, table_sessions)]
            
            if 'start_date' not in columns_sessions:
                self.stdout.write("A adicionar 'start_date' a 'sessions'...")
                cursor.execute(f"ALTER TABLE {table_sessions} ADD COLUMN start_date DATETIME NULL")
            
            if 'end_date' not in columns_sessions:
                self.stdout.write("A adicionar 'end_date' a 'sessions'...")
                cursor.execute(f"ALTER TABLE {table_sessions} ADD COLUMN end_date DATETIME NULL")
            
            if 'status' not in columns_sessions:
                self.stdout.write("A adicionar 'status' a 'sessions'...")
                cursor.execute(f"ALTER TABLE {table_sessions} ADD COLUMN status VARCHAR(16) DEFAULT 'active'")
            
            if 'created_at' not in columns_sessions:
                self.stdout.write("A adicionar 'created_at' a 'sessions'...")
                cursor.execute(f"ALTER TABLE {table_sessions} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            
            if 'updated_at' not in columns_sessions:
                self.stdout.write("A adicionar 'updated_at' a 'sessions'...")
                cursor.execute(f"ALTER TABLE {table_sessions} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")

            # 3. Verificar e atualizar a tabela 'newsletters'
            self.stdout.write("\nA verificar tabela 'newsletters'...")
            table_newsletters = 'newsletters'
            try:
                columns_newsletters = [
                    info.name
                    for info in connection.introspection.get_table_description(cursor, table_newsletters)
                ]
            except Exception:
                columns_newsletters = []

            if columns_newsletters and 'image' not in columns_newsletters:
                self.stdout.write("A adicionar 'image' a 'newsletters'...")
                cursor.execute(
                    f"ALTER TABLE {table_newsletters} ADD COLUMN image VARCHAR(500) NOT NULL DEFAULT ''"
                )

            # 4. Adicionar indices se nao existirem
            self.stdout.write("\nA adicionar indices de performance...")
            try:
                cursor.execute("CREATE INDEX idx_event_dates ON event(start_date, end_date)")
                self.stdout.write("Indice idx_event_dates criado.")
            except Exception:
                self.stdout.write("Indice idx_event_dates ja existe ou nao pode ser criado.")

            try:
                cursor.execute("CREATE INDEX idx_session_dates ON sessions(start_date, end_date)")
                self.stdout.write("Indice idx_session_dates criado.")
            except Exception:
                self.stdout.write("Indice idx_session_dates ja existe ou nao pode ser criado.")

        self.stdout.write(self.style.SUCCESS('\nSQL aplicado com sucesso!'))
