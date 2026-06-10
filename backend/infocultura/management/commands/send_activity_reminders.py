from django.core.management.base import BaseCommand

from infocultura.services import send_upcoming_activity_reminders


class Command(BaseCommand):
    help = "Envia lembretes por email para eventos e sessoes com inicio proximo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours-ahead",
            type=int,
            default=24,
            help="Janela em horas para procurar atividades proximas.",
        )
        parser.add_argument(
            "--events-only",
            action="store_true",
            help="Envia lembretes apenas para eventos.",
        )

    def handle(self, *args, **options):
        summary = send_upcoming_activity_reminders(
            hours_ahead=options["hours_ahead"],
            include_sessions=not options["events_only"],
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Lembretes enviados: eventos={summary['events']} sessoes={summary['sessions']}"
            )
        )
