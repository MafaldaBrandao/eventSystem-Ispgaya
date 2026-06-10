import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

from django.test import RequestFactory

from infocultura.api.serializers_registrations import (
    ClubRegistrationCreateSerializer,
    EventRegistrationCreateSerializer,
    SessionRegistrationCreateSerializer,
)
from infocultura.service_types import ActivityRegistrationSummary, ClubRegistrationInput


class PublicRegistrationSerializerTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def _request(self, ip: str = "203.0.113.7"):
        request = self.factory.post("/api/registrations/")
        request.META["REMOTE_ADDR"] = ip
        return request

    def test_club_registration_requires_open_club(self):
        club = SimpleNamespace(id=7, is_active=False, enable_registrations=True)
        serializer = ClubRegistrationCreateSerializer(
            data={
                "name": " Ana ",
                "email": "ana@example.com",
                "phone": "",
                "message": "",
            },
            context={"club": club, "request": self._request()},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("encerradas", str(serializer.errors["message"][0]).lower())

    @patch("infocultura.api.serializers_registrations.create_club_registration")
    def test_club_registration_create_calls_service_with_normalized_payload(self, create_mock):
        club = SimpleNamespace(id=7, is_active=True, enable_registrations=True)
        serializer = ClubRegistrationCreateSerializer(
            data={
                "name": " Ana ",
                "email": "ana@example.com",
                "phone": " 912345678 ",
                "message": " Quero participar ",
            },
            context={"club": club, "request": self._request()},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        create_mock.assert_called_once_with(
            club=club,
            payload=ClubRegistrationInput(
                name="Ana",
                email="ana@example.com",
                phone="912345678",
                message="Quero participar",
            ),
            client_ip="203.0.113.7",
        )

    @patch(
        "infocultura.api.serializers_registrations.get_event_registration_summary",
        return_value=ActivityRegistrationSummary(
            confirmed_count=0,
            waitlist_count=0,
            remaining_slots=None,
            registration_state="closed",
        ),
    )
    def test_event_registration_requires_open_summary(self, _summary_mock):
        event = SimpleNamespace(id=11)
        serializer = EventRegistrationCreateSerializer(
            data={
                "name": "Ana",
                "email": "ana@example.com",
            },
            context={"event": event, "request": self._request()},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("encerradas", str(serializer.errors["message"][0]).lower())

    @patch(
        "infocultura.api.serializers_registrations.get_event_registration_summary",
        return_value=ActivityRegistrationSummary(
            confirmed_count=1,
            waitlist_count=0,
            remaining_slots=3,
            registration_state="open",
        ),
    )
    @patch("infocultura.api.serializers_registrations.create_event_registration")
    def test_event_registration_create_calls_service(self, create_mock, _summary_mock):
        event = SimpleNamespace(id=11)
        serializer = EventRegistrationCreateSerializer(
            data={
                "name": " Ana ",
                "email": "ana@example.com",
                "phone": " 912345678 ",
                "message": " Quero participar ",
            },
            context={"event": event, "request": self._request()},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        create_mock.assert_called_once_with(
            event=event,
            payload=ClubRegistrationInput(
                name="Ana",
                email="ana@example.com",
                phone="912345678",
                message="Quero participar",
            ),
            client_ip="203.0.113.7",
        )

    @patch(
        "infocultura.api.serializers_registrations.get_session_registration_summary",
        return_value=ActivityRegistrationSummary(
            confirmed_count=0,
            waitlist_count=0,
            remaining_slots=None,
            registration_state="open",
        ),
    )
    @patch("infocultura.api.serializers_registrations.create_session_registration")
    def test_session_registration_create_calls_service(self, create_mock, _summary_mock):
        session = SimpleNamespace(id=21)
        serializer = SessionRegistrationCreateSerializer(
            data={
                "name": " Rui ",
                "email": "rui@example.com",
                "phone": "",
                "message": "",
            },
            context={"session": session, "request": self._request()},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        create_mock.assert_called_once_with(
            session=session,
            payload=ClubRegistrationInput(
                name="Rui",
                email="rui@example.com",
                phone="",
                message="",
            ),
            client_ip="203.0.113.7",
        )
