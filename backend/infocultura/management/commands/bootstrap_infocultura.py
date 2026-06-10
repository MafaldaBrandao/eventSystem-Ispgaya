from datetime import date
from django.conf import settings
from django.core.management.base import BaseCommand

from infocultura.models import AppUser, CulturalContent, Role
from infocultura.security import hash_password


class Command(BaseCommand):
    help = 'Cria role/user admin na tabela users e dados seed de conteudo.'

    def handle(self, *args, **options):
        name = settings.INFOCULTURA_ADMIN_USER
        email = settings.INFOCULTURA_ADMIN_EMAIL
        password = settings.INFOCULTURA_ADMIN_PASS

        superadmin_role, _ = Role.objects.get_or_create(
            name='superadmin',
            defaults={'description': 'Administrador principal do sistema'},
        )
        Role.objects.get_or_create(
            name='club_admin',
            defaults={'description': 'Administrador de um clube'},
        )

        user, created = AppUser.objects.get_or_create(
            email=email,
            defaults={
                'name': name,
                'password_hash': hash_password(password),
                'role': superadmin_role,
                'is_active': True,
            },
        )

        user.name = name
        user.password_hash = hash_password(password)
        user.role = superadmin_role
        user.is_active = True
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f'Admin criado: {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin atualizado: {email}'))

        seeds = [
            {
                'area': 'tuna',
                'title': 'Ensaios Semanais da Tuna',
                'description': 'Inscricoes abertas para novos elementos. Ensaios todas as quartas-feiras.',
                'date': date(2026, 3, 20),
                'status': 'publicado',
            },
            {
                'area': 'clube-leitura',
                'title': 'Livro do Mes: Literatura Portuguesa',
                'description': 'Sessao dedicada a autores contemporaneos com debate orientado.',
                'date': date(2026, 3, 25),
                'status': 'publicado',
            },
            {
                'area': 'teatro',
                'title': 'Audicoes para Grupo de Teatro',
                'description': 'Candidaturas abertas para atores e equipa tecnica.',
                'date': date(2026, 3, 28),
                'status': 'publicado',
            },
        ]

        for payload in seeds:
            CulturalContent.objects.get_or_create(
                area=payload['area'],
                title=payload['title'],
                defaults=payload,
            )

        self.stdout.write(self.style.SUCCESS('Dados seed garantidos.'))
        self.stdout.write(
            self.style.SUCCESS(
                f'Login admin pronto com email "{email}" e a password definida em INFOCULTURA_ADMIN_PASS.'
            )
        )
