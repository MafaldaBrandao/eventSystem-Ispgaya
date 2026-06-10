import os
import sys
from datetime import timedelta
from pathlib import Path
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.utils import timezone

from infocultura.repositories.audit import list_admin_activity_logs


class _FakeQuerySet(list):
    def filter(self, *args, **kwargs):
        return self


class RepositoryAuditTests(TestCase):
    def test_activity_feed_merges_audit_and_editorial_logs(self):
        now = timezone.now()
        audit_logs = _FakeQuerySet(
            [
                SimpleNamespace(
                    action='create',
                    content_type='news',
                    object_id=1,
                    summary='Criada noticia',
                    actor_user_id=7,
                    actor_name='Admin',
                    club_id=2,
                    metadata_json='{}',
                    created_at=now,
                )
            ]
        )
        editorial_logs = _FakeQuerySet(
            [
                SimpleNamespace(
                    content_type='news',
                    object_id=1,
                    from_status='draft',
                    to_status='published',
                    actor_user_id=7,
                    actor_name='Admin',
                    club_id=2,
                    created_at=now - timedelta(minutes=5),
                )
            ]
        )

        with (
            patch('infocultura.repositories.audit.AdminAuditLog.objects.all', return_value=audit_logs),
            patch('infocultura.repositories.audit.EditorialAction.objects.all', return_value=editorial_logs),
        ):
            logs = list_admin_activity_logs(limit=10)

        self.assertEqual(len(logs), 2)
        self.assertEqual(logs[0].source, 'audit')
        self.assertEqual(logs[1].source, 'editorial')
        self.assertEqual(logs[0].summary, 'Criada noticia')
        self.assertIn('published', logs[1].summary)
