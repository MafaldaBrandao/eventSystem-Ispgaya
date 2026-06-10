import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from datetime import timedelta
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

from django.utils import timezone

from infocultura.repositories import registrations as repo
from infocultura.service_types import ActivityRegistrationSummary


class RegistrationRepositoryTests(TestCase):
    def test_activity_registration_exists_queries_join_the_registration_table(self):
        with patch(
            "infocultura.repositories.registrations.fetch_all_dict_rows",
            return_value=[],
        ) as fetch_mock:
            self.assertFalse(
                repo.event_registration_exists(event_id=17, email="Test@Email.com")
            )

        sql, params = fetch_mock.call_args.args
        self.assertIn("event_registrations", sql)
        self.assertIn("registrations", sql)
        self.assertIn("id_registrations", sql)
        self.assertEqual(params, (17, "test@email.com"))

        with patch(
            "infocultura.repositories.registrations.fetch_all_dict_rows",
            return_value=[],
        ) as fetch_mock:
            self.assertFalse(
                repo.session_registration_exists(session_id=23, email="Another@Email.com")
            )

        sql, params = fetch_mock.call_args.args
        self.assertIn("session_registrations", sql)
        self.assertIn("registrations", sql)
        self.assertIn("id_registrations", sql)
        self.assertEqual(params, (23, "another@email.com"))

    def test_registration_summary_counts_confirmed_and_waitlist(self):
        event = SimpleNamespace(
            id=11,
            registration_capacity=2,
            enable_registrations=True,
            end_date=timezone.now() + timedelta(days=1),
        )

        with patch(
            "infocultura.repositories.registrations.fetch_all_dict_rows",
            return_value=[
                {"resolved_status": "confirmed", "total_count": 2},
                {"resolved_status": "waitlist", "total_count": 1},
            ],
        ):
            summary = repo.get_event_registration_summary(event=event)

        self.assertIsInstance(summary, ActivityRegistrationSummary)
        self.assertEqual(summary.confirmed_count, 2)
        self.assertEqual(summary.waitlist_count, 1)
        self.assertEqual(summary.remaining_slots, 0)
        self.assertEqual(summary.registration_state, "waitlist")

    def test_admin_club_registration_query_uses_registration_id_projection(self):
        with patch(
            "infocultura.repositories.registrations.fetch_all_dict_rows",
            side_effect=[
                [{"total_count": 1}],
                [
                    {
                        "registration_id": 91,
                        "club_id": 7,
                        "club_name": "Teatro",
                        "registration_type": "club",
                        "target_title": "Teatro",
                        "name": "Ana",
                        "email": "ana@example.com",
                        "phone": None,
                        "message": None,
                        "status": "pending",
                        "created_at": None,
                    }
                ],
            ],
        ) as fetch_mock:
            page = repo.list_admin_club_registrations(
                allowed_club_id=7,
                page=2,
                page_size=25,
            )

        self.assertEqual(page.total, 1)
        self.assertEqual(page.page, 2)
        self.assertEqual(page.page_size, 25)
        self.assertEqual(page.total_pages, 1)
        self.assertEqual(page.items[0].registration_id, 91)

        count_sql = fetch_mock.call_args_list[0].args[0]
        select_sql = fetch_mock.call_args_list[1].args[0]
        self.assertIn("COUNT(*) AS total_count", count_sql)
        self.assertIn("r.id_registrations AS registration_id", select_sql)
        self.assertIn("cr.id_clubs AS club_id", select_sql)
        self.assertNotIn("r.id ", select_sql)

    @patch("infocultura.repositories.registrations.record_admin_audit_action")
    @patch("infocultura.repositories.registrations.notify_new_club_registration")
    @patch("infocultura.repositories.registrations.execute_sql")
    @patch("infocultura.repositories.registrations.Registration.objects.create")
    @patch("infocultura.repositories.registrations.transaction.atomic")
    @patch("infocultura.repositories.registrations.club_registration_exists", return_value=False)
    @patch("infocultura.repositories.registrations.enforce_club_registration_rate_limit")
    def test_create_club_registration_writes_audit_log(
        self,
        _rate_limit_mock,
        exists_mock,
        atomic_mock,
        create_mock,
        execute_mock,
        notify_mock,
        audit_mock,
    ):
        club = SimpleNamespace(id=7, name='Teatro')
        create_mock.return_value = SimpleNamespace(id=91, email='ana@example.com', name='Ana', phone=None, message=None)
        atomic_mock.return_value.__enter__.return_value = None
        atomic_mock.return_value.__exit__.return_value = None

        registration = repo.create_club_registration(
            club=club,
            payload=SimpleNamespace(name='Ana', email='ana@example.com', phone=None, message=None),
            client_ip='203.0.113.7',
        )

        self.assertEqual(registration.id, 91)
        audit_mock.assert_called_once()
        self.assertEqual(audit_mock.call_args.kwargs['content_type'], 'registration')
        self.assertEqual(audit_mock.call_args.kwargs['club_id'], 7)
        self.assertEqual(audit_mock.call_args.kwargs['actor_name'], 'Visitante')
        notify_mock.assert_called_once()


class RegistrationEmailTemplateTests(TestCase):
    def test_activity_registration_template_renders_correctly(self):
        from django.template.loader import render_to_string
        html = render_to_string(
            'emails/registrations/activity_registration.html',
            {
                'attendee_name': 'Ana Silva',
                'label': 'Evento',
                'activity_title': 'Workshop de Teatro',
                'club_name': 'Teatro ISPGAYA',
                'location': 'Auditório A',
                'start_date_str': '25/12/2026 18:00',
                'status': 'confirmed',
                'logo_cid': 'ispgaya-logo',
            },
        )
        self.assertIn('Ana Silva', html)
        self.assertIn('Workshop de Teatro', html)
        self.assertIn('Teatro ISPGAYA', html)
        self.assertIn('Auditório A', html)
        self.assertIn('25/12/2026 18:00', html)
        self.assertIn('Inscrição confirmada', html)
        self.assertIn('cid:ispgaya-logo', html)

    def test_admin_registration_notification_template_renders_correctly(self):
        from django.template.loader import render_to_string
        html = render_to_string(
            'emails/registrations/admin_registration_notification.html',
            {
                'subject': 'Nova inscricao no clube Teatro',
                'attendee_name': 'Carlos Pedro',
                'attendee_email': 'carlos@example.com',
                'phone': '912345678',
                'message': 'Gostaria de me inscrever.',
                'scope_label': 'Teatro',
                'logo_cid': 'ispgaya-logo',
            },
        )
        self.assertIn('Carlos Pedro', html)
        self.assertIn('carlos@example.com', html)
        self.assertIn('912345678', html)
        self.assertIn('Gostaria de me inscrever.', html)
        self.assertIn('Teatro', html)
        self.assertIn('cid:ispgaya-logo', html)

    def test_registration_status_update_template_renders_correctly(self):
        from django.template.loader import render_to_string
        html = render_to_string(
            'emails/registrations/registration_status_update.html',
            {
                'subject': 'Inscricao atualizada em Teatro',
                'attendee_name': 'Ana',
                'club_name': 'Teatro',
                'status': 'confirmed',
                'logo_cid': 'ispgaya-logo',
            },
        )
        self.assertIn('Ana', html)
        self.assertIn('Teatro', html)
        self.assertIn('Confirmada', html)
        self.assertIn('cid:ispgaya-logo', html)

    @patch('infocultura.repositories.registrations.EmailMultiAlternatives')
    def test_notify_new_club_registration_sends_multipart_email(self, email_mock):
        club = SimpleNamespace(id=7, name='Teatro')
        registration = SimpleNamespace(name='Ana', email='ana@example.com', phone='912345678', message='Olá')
        
        with patch('infocultura.repositories.registrations._get_club_recipient_emails', return_value=['admin@example.com']):
            repo.notify_new_club_registration(club=club, registration=registration)
            
        email_mock.assert_called_once()
        msg_instance = email_mock.return_value
        msg_instance.attach_alternative.assert_called_once()
        msg_instance.send.assert_called_once()

