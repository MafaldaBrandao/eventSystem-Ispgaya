import os
import sys
from pathlib import Path
from contextlib import nullcontext
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import RequestFactory
from unittest import TestCase

from infocultura.api.serializers_users import AdminUserWriteSerializer
from infocultura.api.serializers_admin import AdminBulkIdsSerializer
from infocultura.api.serializers_auth import LoginSerializer


class LoginSerializerTests(TestCase):
    def test_valid_login_identifier_is_trimmed(self):
        serializer = LoginSerializer(
            data={
                "username": "  maria@example.com  ",
                "password": "Secret123!",
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["username"], "maria@example.com")

    def test_login_identifier_rejects_control_characters(self):
        serializer = LoginSerializer(
            data={
                "username": "bad\nvalue",
                "password": "Secret123!",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("invalidos", str(serializer.errors["username"][0]).lower())


class AdminBulkIdsSerializerTests(TestCase):
    def test_ids_are_deduplicated_preserving_order(self):
        serializer = AdminBulkIdsSerializer(data={"ids": [3, 1, 3, 2, 1]})

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["ids"], [3, 1, 2])

    def test_empty_ids_are_rejected(self):
        serializer = AdminBulkIdsSerializer(data={"ids": []})

        self.assertFalse(serializer.is_valid())
        self.assertIn("vazia", str(serializer.errors["ids"][0]).lower())


class AdminUserWriteSerializerTests(TestCase):
    def setUp(self):
        self.role = SimpleNamespace(name='club_admin')
        self.club = SimpleNamespace(id=12)

    def test_create_generates_temporary_password_when_not_provided(self):
        serializer = AdminUserWriteSerializer()
        created_user = SimpleNamespace(
            id=7,
            name='Ana Silva',
            email='ana@example.com',
            role=self.role,
            club=self.club,
            is_active=True,
        )

        with patch('infocultura.api.serializers_users.generate_temporary_password', return_value='TmpPass123!'), \
            patch('infocultura.api.serializers_users.hash_password', return_value='hashed-password'), \
            patch('infocultura.api.serializers_users.send_user_credentials_email') as send_email, \
            patch('infocultura.api.serializers_users.AppUser.objects.create', return_value=created_user) as create_mock, \
            patch('infocultura.api.serializers_users.transaction.atomic', return_value=nullcontext()):
            result = serializer.create(
                {
                    'name': 'Ana Silva',
                    'email': 'ana@example.com',
                    'role': self.role,
                    'club': self.club,
                    'is_active': True,
                }
            )

        create_kwargs = create_mock.call_args.kwargs
        self.assertEqual(create_kwargs['password_hash'], 'hashed-password')
        self.assertTrue(create_kwargs['is_active'])
        send_email.assert_called_once_with(
            recipient_email='ana@example.com',
            recipient_name='Ana Silva',
            password='TmpPass123!',
        )
        self.assertEqual(result.generated_password, 'TmpPass123!')
        self.assertTrue(result.credentials_sent)

    def test_update_can_generate_and_send_new_password(self):
        serializer = AdminUserWriteSerializer()
        instance = SimpleNamespace(
            id=7,
            name='Ana Silva',
            email='ana@example.com',
            role=self.role,
            club=self.club,
            is_active=True,
            password_hash='old-hash',
            save=MagicMock(),
        )

        with patch('infocultura.api.serializers_users.generate_temporary_password', return_value='NewPass123!'), \
            patch('infocultura.api.serializers_users.hash_password', return_value='new-hash'), \
            patch('infocultura.api.serializers_users.send_user_credentials_email') as send_email, \
            patch('infocultura.api.serializers_users.transaction.atomic', return_value=nullcontext()):
            result = serializer.update(
                instance,
                {
                    'generate_password': True,
                }
            )

        self.assertEqual(instance.password_hash, 'new-hash')
        instance.save.assert_called_once()
        send_email.assert_called_once_with(
            recipient_email='ana@example.com',
            recipient_name='Ana Silva',
            password='NewPass123!',
        )
        self.assertEqual(result.generated_password, 'NewPass123!')
        self.assertTrue(result.credentials_sent)

    def test_update_keeps_password_when_not_requested(self):
        serializer = AdminUserWriteSerializer()
        instance = SimpleNamespace(
            id=7,
            name='Ana Silva',
            email='ana@example.com',
            role=self.role,
            club=self.club,
            is_active=True,
            password_hash='old-hash',
            save=MagicMock(),
        )

        with patch('infocultura.api.serializers_users.send_user_credentials_email') as send_email, \
            patch('infocultura.api.serializers_users.transaction.atomic', return_value=nullcontext()):
            result = serializer.update(
                instance,
                {
                    'name': 'Ana Silva',
                    'email': 'ana@example.com',
                    'role': self.role,
                }
            )

        self.assertEqual(instance.password_hash, 'old-hash')
        instance.save.assert_called_once()
        send_email.assert_not_called()
        self.assertIsNone(result.generated_password)
        self.assertFalse(result.credentials_sent)
