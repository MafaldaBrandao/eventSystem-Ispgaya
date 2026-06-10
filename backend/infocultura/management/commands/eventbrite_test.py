"""
Management command to test Eventbrite token and list organizations.
Usage:
  python manage.py eventbrite_test                 # Test current token + list orgs
  python manage.py eventbrite_test --token=<TOKEN> # Test specific token
  python manage.py eventbrite_test --org=<ORG_ID>  # Test specific organization
"""

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = 'Test Eventbrite token and list organizations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--token',
            type=str,
            default=None,
            help='Eventbrite OAuth token (defaults to EVENTBRITE_PRIVATE_TOKEN from .env)',
        )
        parser.add_argument(
            '--org',
            type=str,
            default=None,
            help='Test a specific organization ID',
        )

    def handle(self, *args, **options):
        token = options.get('token') or getattr(settings, 'EVENTBRITE_PRIVATE_TOKEN', '').strip()
        org_id = options.get('org') or getattr(settings, 'EVENTBRITE_ORGANIZATION_ID', '').strip()

        if not token:
            raise CommandError(
                '❌ Token not provided. Use --token=<TOKEN> or set EVENTBRITE_PRIVATE_TOKEN in .env'
            )

        self.stdout.write(self.style.SUCCESS('✓ Testing Eventbrite token...'))
        self.stdout.write(f'  Token (first 20 chars): {token[:20]}...')

        # Test token validity
        try:
            orgs = self._fetch_organizations(token)
            self.stdout.write(self.style.SUCCESS('✓ Token is VALID'))
            self.stdout.write(f'  Organizations accessible: {len(orgs)}')

            if not orgs:
                self.stdout.write(
                    self.style.WARNING(
                        '⚠ No organizations found. Check your Eventbrite account permissions.'
                    )
                )
                return

            # List all organizations
            self.stdout.write('\n📋 Available Organizations:')
            for org in orgs:
                org_name = org.get('name', 'Unknown')
                org_id_val = org.get('id', 'Unknown')
                status = '✓' if org_id and str(org_id_val) == str(org_id) else ' '
                self.stdout.write(f'  [{status}] ID: {org_id_val} | Name: {org_name}')

            # Test specific organization if provided
            if org_id:
                self.stdout.write(f'\n🔍 Testing organization {org_id}...')
                org_details = self._fetch_organization(token, org_id)
                self.stdout.write(self.style.SUCCESS(f'✓ Organization found: {org_details.get("name")}'))
                self.stdout.write(f'  ID: {org_details.get("id")}')
                self.stdout.write(f'  Status: {org_details.get("status")}')
            else:
                self.stdout.write(
                    self.style.WARNING(
                        '\n💡 Tip: Use --org=<ORG_ID> to test a specific organization.'
                    )
                )

        except HTTPError as e:
            if e.code == 401:
                self.stdout.write(
                    self.style.ERROR(
                        '❌ Token is INVALID or expired. Generate a new Personal OAuth Token on Eventbrite.'
                    )
                )
                self.stdout.write('  See: https://www.eventbrite.com/platform/api-keys')
            else:
                self.stdout.write(self.style.ERROR(f'❌ HTTP Error {e.code}: {e.reason}'))
            raise CommandError('Token test failed')
        except URLError as e:
            self.stdout.write(self.style.ERROR(f'❌ Connection error: {e.reason}'))
            raise CommandError('Could not reach Eventbrite API')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Unexpected error: {e}'))
            raise CommandError(str(e))

    def _fetch_organizations(self, token: str) -> list:
        """Fetch organizations accessible by the token."""
        url = 'https://www.eventbriteapi.com/v3/users/me/organizations/'
        response = self._eventbrite_request('GET', url, token)
        # Eventbrite wraps organizations in a 'organizations' key
        if isinstance(response, dict):
            return response.get('organizations', [])
        return response if isinstance(response, list) else []

    def _fetch_organization(self, token: str, org_id: str) -> dict:
        """Fetch a specific organization by ID."""
        url = f'https://www.eventbriteapi.com/v3/organizations/{org_id}/'
        result = self._eventbrite_request('GET', url, token)
        return result if isinstance(result, dict) else {}

    def _eventbrite_request(self, method: str, url: str, token: str):
        """Make a generic Eventbrite API request."""
        request = Request(
            url,
            method=method,
            headers={
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json',
            },
        )

        try:
            with urlopen(request, timeout=10) as response:
                raw = response.read().decode('utf-8')
                return json.loads(raw) if raw else {}
        except HTTPError as e:
            raw = e.read().decode('utf-8', errors='replace')
            try:
                parsed = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                parsed = {'raw': raw}
            raise e
