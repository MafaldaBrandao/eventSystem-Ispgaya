import json
import os
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from infocultura.repositories.universities import search_universities


class _FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return json.dumps(self.payload).encode('utf-8')


class UniversityRepositoryTests(TestCase):
    def test_search_universities_normalizes_domains_and_pages(self):
        payload = [
            {
                'name': 'Instituto Politecnico de Lisboa',
                'country': 'Portugal',
                'domain': 'ipl.pt',
                'web_page': 'https://www.ipl.pt/',
            }
        ]

        with patch('infocultura.repositories.universities.urlopen', return_value=_FakeResponse(payload)):
            results = search_universities(country='Portugal', limit=1)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Instituto Politecnico de Lisboa')
        self.assertEqual(results[0]['country'], 'Portugal')
        self.assertEqual(results[0]['domains'], ['ipl.pt'])
        self.assertEqual(results[0]['web_pages'], ['https://www.ipl.pt/'])

    def test_search_universities_defaults_to_portugal(self):
        payload = []

        with patch('infocultura.repositories.universities.urlopen', return_value=_FakeResponse(payload)) as mock_urlopen:
            search_universities()

        called_url = mock_urlopen.call_args.args[0].full_url
        self.assertIn('country=Portugal', called_url)

    def test_search_universities_falls_back_when_remote_fails(self):
        with patch('infocultura.repositories.universities.urlopen', side_effect=Exception('offline')):
            results = search_universities(country='Portugal', limit=3)

        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]['country'], 'Portugal')
