from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import timezone as dt_timezone
from html import escape
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.utils import timezone


class EventbriteConfigurationError(RuntimeError):
    pass


class EventbriteAPIError(RuntimeError):
    def __init__(self, message: str, *, status_code: int | None = None, payload: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload or {}


@dataclass(frozen=True)
class EventbriteSyncResult:
    event_id: str
    url: str
    status: str
    payload: dict
    venue_id: str = ''
    ticket_classes: list[dict] | None = None


def _require_setting(name: str) -> str:
    value = str(getattr(settings, name, '') or '').strip()
    if not value:
        raise EventbriteConfigurationError(f'Configura {name} no .env.')
    return value


def _eventbrite_request(method: str, path: str, payload: dict | None = None) -> dict:
    token = _require_setting('EVENTBRITE_PRIVATE_TOKEN')
    base_url = str(getattr(settings, 'EVENTBRITE_API_BASE_URL', 'https://www.eventbriteapi.com/v3')).rstrip('/')
    body = json.dumps(payload).encode('utf-8') if payload is not None else None
    request = Request(
        f'{base_url}{path}',
        data=body,
        method=method,
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    )

    try:
        with urlopen(request, timeout=20) as response:
            raw = response.read().decode('utf-8')
    except HTTPError as error:
        raw = error.read().decode('utf-8', errors='replace')
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {'raw': raw}
        message = parsed.get('error_description') or parsed.get('error') or 'Erro na API da Eventbrite.'
        raise EventbriteAPIError(message, status_code=error.code, payload=parsed) from error
    except URLError as error:
        raise EventbriteAPIError(f'Nao foi possivel contactar a Eventbrite: {error.reason}') from error

    return json.loads(raw) if raw else {}


def _to_eventbrite_datetime(value) -> dict:
    if timezone.is_naive(value):
        value = timezone.make_aware(value, timezone.get_current_timezone())
    return {
        'timezone': getattr(settings, 'EVENTBRITE_DEFAULT_TIMEZONE', settings.TIME_ZONE),
        'utc': value.astimezone(dt_timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z'),
    }


def _description_html(event) -> str:
    pieces = [f'<p>{escape(event.description)}</p>']
    location = ', '.join(part for part in [event.location, event.city] if part)
    if location:
        pieces.append(f'<p><strong>Local:</strong> {escape(location)}</p>')
    if event.club_name:
        pieces.append(f'<p><strong>Organizacao:</strong> {escape(event.club_name)}</p>')
    return ''.join(pieces)


def _clean_string(value) -> str:
    return str(value or '').strip()


def _configured_venue_id(event) -> str:
    return _clean_string(getattr(event, 'eventbrite_venue_id', '') or getattr(settings, 'EVENTBRITE_DEFAULT_VENUE_ID', ''))


def _eventbrite_venue_payload(event) -> dict | None:
    venue = getattr(event, 'eventbrite_venue', None) or {}
    if not isinstance(venue, dict) or not venue:
        return None

    name = _clean_string(venue.get('name') or event.location)
    address_1 = _clean_string(venue.get('address_1') or event.location)
    city = _clean_string(venue.get('city') or event.city)
    country = _clean_string(venue.get('country') or getattr(settings, 'EVENTBRITE_DEFAULT_COUNTRY', 'PT'))
    if not name or not address_1 or not city:
        return None

    address = {
        'address_1': address_1,
        'city': city,
        'country': country,
    }
    optional_address_fields = {
        'address_2': 'address_2',
        'region': 'region',
        'postal_code': 'postal_code',
        'latitude': 'latitude',
        'longitude': 'longitude',
    }
    for source_key, target_key in optional_address_fields.items():
        value = _clean_string(venue.get(source_key))
        if value:
            address[target_key] = value

    venue_payload = {
        'name': name,
        'address': address,
    }
    capacity = venue.get('capacity')
    try:
        if capacity not in (None, ''):
            venue_payload['capacity'] = int(capacity)
    except (TypeError, ValueError):
        pass
    age_restriction = _clean_string(venue.get('age_restriction'))
    if age_restriction:
        venue_payload['age_restriction'] = age_restriction

    return {'venue': venue_payload}


def create_eventbrite_venue(event) -> str:
    organization_id = _require_setting('EVENTBRITE_ORGANIZATION_ID')
    payload = _eventbrite_venue_payload(event)
    if not payload:
        return ''

    venue_payload = _eventbrite_request('POST', f'/organizations/{organization_id}/venues/', payload)
    return str(venue_payload.get('id') or '')


def _default_ticket_quantity(event) -> int:
    return int(event.registration_capacity or 100)


def _ticket_class_payloads(event) -> list[dict]:
    configured_tickets = getattr(event, 'eventbrite_ticket_classes', None) or []
    if not isinstance(configured_tickets, list) or not configured_tickets:
        return [
            {
                'ticket_class': {
                    'name': getattr(settings, 'EVENTBRITE_TICKET_NAME', 'Entrada geral'),
                    'free': True,
                    'quantity_total': _default_ticket_quantity(event),
                }
            }
        ]

    currency = getattr(settings, 'EVENTBRITE_DEFAULT_CURRENCY', 'EUR')
    payloads = []
    for ticket in configured_tickets:
        if not isinstance(ticket, dict):
            continue
        name = _clean_string(ticket.get('name'))
        if not name:
            continue
        quantity = ticket.get('quantity_total') or ticket.get('quantity') or _default_ticket_quantity(event)
        try:
            quantity_total = int(quantity)
        except (TypeError, ValueError):
            quantity_total = _default_ticket_quantity(event)
        ticket_payload = {
            'name': name,
            'quantity_total': max(quantity_total, 1),
        }
        ticket_type = _clean_string(ticket.get('type') or ('free' if ticket.get('free', True) else 'paid'))
        if ticket_type == 'donation':
            ticket_payload['donation'] = True
            ticket_payload['free'] = False
        elif ticket_type == 'paid':
            amount = ticket.get('cost') or ticket.get('price') or 0
            try:
                cents = int(round(float(amount) * 100))
            except (TypeError, ValueError):
                cents = 0
            ticket_payload['free'] = False
            ticket_payload['cost'] = f'{currency},{max(cents, 0)}'
        else:
            ticket_payload['free'] = True

        for optional_key in ('minimum_quantity', 'maximum_quantity', 'sales_start', 'sales_end'):
            if ticket.get(optional_key) not in (None, ''):
                ticket_payload[optional_key] = ticket[optional_key]

        payloads.append({'ticket_class': ticket_payload})

    return payloads or _ticket_class_payloads(type('EventProxy', (), {
        'registration_capacity': getattr(event, 'registration_capacity', None),
        'eventbrite_ticket_classes': [],
    })())


def build_eventbrite_payload(event) -> dict:
    capacity = event.registration_capacity if event.enable_registrations else None
    venue_id = _configured_venue_id(event)
    event_payload = {
        'name': {'html': event.title},
        'description': {'html': _description_html(event)},
        'start': _to_eventbrite_datetime(event.start_date),
        'end': _to_eventbrite_datetime(event.end_date),
        'currency': getattr(settings, 'EVENTBRITE_DEFAULT_CURRENCY', 'EUR'),
        'listed': event.status == 'published',
        'shareable': True,
        'invite_only': False,
        'show_remaining': bool(event.enable_registrations),
        'online_event': not bool(venue_id),
    }
    if capacity:
        event_payload['capacity'] = capacity
    if venue_id:
        event_payload['venue_id'] = venue_id

    return {'event': event_payload}


def create_or_update_eventbrite_event(event) -> EventbriteSyncResult:
    organization_id = _require_setting('EVENTBRITE_ORGANIZATION_ID')
    venue_id = _configured_venue_id(event)
    if not venue_id:
        venue_id = create_eventbrite_venue(event)
        if venue_id:
            event.eventbrite_venue_id = venue_id
    payload = build_eventbrite_payload(event)
    if venue_id:
        payload['event']['venue_id'] = venue_id
        payload['event']['online_event'] = False

    if event.eventbrite_event_id:
        eventbrite_payload = _eventbrite_request('POST', f'/events/{event.eventbrite_event_id}/', payload)
        ticket_classes = []
    else:
        eventbrite_payload = _eventbrite_request('POST', f'/organizations/{organization_id}/events/', payload)
        ticket_classes = [
            _eventbrite_request('POST', f'/events/{eventbrite_payload["id"]}/ticket_classes/', ticket_payload)
            for ticket_payload in _ticket_class_payloads(event)
        ]

    return EventbriteSyncResult(
        event_id=str(eventbrite_payload.get('id') or event.eventbrite_event_id),
        url=str(eventbrite_payload.get('url') or event.eventbrite_url or ''),
        status=str(eventbrite_payload.get('status') or ''),
        payload=eventbrite_payload,
        venue_id=venue_id,
        ticket_classes=ticket_classes,
    )


def get_eventbrite_connection_status() -> dict:
    organization_id = _require_setting('EVENTBRITE_ORGANIZATION_ID')
    try:
        payload = _eventbrite_request('GET', f'/organizations/{organization_id}/')
        return {
            'connected': True,
            'organization_id': str(payload.get('id') or organization_id),
            'organization_name': str(payload.get('name') or ''),
            'payload': payload,
        }
    except EventbriteAPIError as error:
        # If we get a 403 (feature restriction), the token is valid but org access is limited
        # Still return connected=true because we can proceed with event operations
        if error.status_code == 403:
            return {
                'connected': True,
                'organization_id': organization_id,
                'organization_name': '(Acesso limitado)',
                'message': 'Token válido, mas acesso à organização restringido. Pode criar/gerir eventos.',
                'payload': error.payload,
            }
        # Re-raise other API errors
        raise


def list_eventbrite_organization_events() -> list:
    """List all events in the Eventbrite organization."""
    organization_id = _require_setting('EVENTBRITE_ORGANIZATION_ID')
    try:
        response = _eventbrite_request('GET', f'/organizations/{organization_id}/events/')
        events = response.get('events', [])
        return [
            {
                'id': event.get('id'),
                'name': event.get('name', {}).get('text', ''),
                'status': event.get('status'),
                'url': event.get('url'),
                'created': event.get('created'),
                'start': event.get('start', {}).get('utc'),
                'end': event.get('end', {}).get('utc'),
            }
            for event in events
        ]
    except EventbriteAPIError as error:
        # If 403, return empty list (access limited but can still operate)
        if error.status_code == 403:
            return []
        raise


def get_eventbrite_event(eventbrite_event_id: str) -> dict:
    query = urlencode({'expand': 'ticket_classes,venue'})
    return _eventbrite_request('GET', f'/events/{eventbrite_event_id}/?{query}')


def create_eventbrite_ticket_class(eventbrite_event_id: str, ticket: dict) -> dict:
    class EventTicketProxy:
        registration_capacity = ticket.get('quantity_total') or ticket.get('quantity') or 100
        eventbrite_ticket_classes = [ticket]

    payloads = _ticket_class_payloads(EventTicketProxy())
    return _eventbrite_request('POST', f'/events/{eventbrite_event_id}/ticket_classes/', payloads[0])


def list_eventbrite_attendees(
    eventbrite_event_id: str,
    *,
    continuation: str = '',
) -> dict:
    query_params = {'expand': 'ticket_class,order'}
    if continuation:
        query_params['continuation'] = continuation

    return _eventbrite_request('GET', f'/events/{eventbrite_event_id}/attendees/?{urlencode(query_params)}')


def publish_eventbrite_event(eventbrite_event_id: str) -> dict:
    params = urlencode({'notify_email': 'false'})
    return _eventbrite_request('POST', f'/events/{eventbrite_event_id}/publish/?{params}')


def list_eventbrite_orders(
    eventbrite_event_id: str,
    *,
    refund_request_statuses: str = '',
    continuation: str = '',
) -> dict:
    query_params = {}
    if refund_request_statuses:
        query_params['refund_request_statuses'] = refund_request_statuses
    if continuation:
        query_params['continuation'] = continuation

    query = f'?{urlencode(query_params)}' if query_params else ''
    return _eventbrite_request('GET', f'/events/{eventbrite_event_id}/orders/{query}')


def delete_eventbrite_event(eventbrite_event_id: str) -> dict:
    return _eventbrite_request('DELETE', f'/events/{eventbrite_event_id}/')


def unpublish_eventbrite_event(eventbrite_event_id: str) -> dict:
    return _eventbrite_request('POST', f'/events/{eventbrite_event_id}/unpublish/')

def sync_event_to_eventbrite(event) -> bool:
    """
    Automatically synchronize an InfoCultura event to Eventbrite.
    
    - If event.eventbrite_event_id is not set, creates a new event on Eventbrite.
    - If event.eventbrite_event_id is set, updates the existing event.
    - Stores the Eventbrite ID and URL for future operations.
    
    Returns True if sync was successful, False if it failed or Eventbrite is not configured.
    """
    try:
        # Check if Eventbrite is configured
        _require_setting('EVENTBRITE_PRIVATE_TOKEN')
        _require_setting('EVENTBRITE_ORGANIZATION_ID')
    except EventbriteConfigurationError:
        # Eventbrite not configured, silently skip
        return False
    
    try:
        result = create_or_update_eventbrite_event(event)
        
        # Update event with Eventbrite information
        event.eventbrite_event_id = result.event_id
        event.eventbrite_url = result.url
        event.eventbrite_status = result.status
        event.eventbrite_venue_id = result.venue_id
        event.eventbrite_last_synced_at = timezone.now()
        event.eventbrite_last_error = None
        event.save(
            update_fields=[
                'eventbrite_event_id',
                'eventbrite_url',
                'eventbrite_status',
                'eventbrite_venue_id',
                'eventbrite_last_synced_at',
                'eventbrite_last_error',
            ]
        )
        return True
    except (EventbriteAPIError, EventbriteConfigurationError) as error:
        # Log error but don't prevent event creation
        error_message = str(error)
        event.eventbrite_last_error = error_message
        event.eventbrite_last_synced_at = timezone.now()
        event.save(update_fields=['eventbrite_last_error', 'eventbrite_last_synced_at'])
        return False


def clean_str(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def clean_str_or_none(value) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned if cleaned else None


def normalize_eventbrite_attendee(attendee_payload: dict) -> dict:
    profile = attendee_payload.get('profile') or {}
    ticket_class = attendee_payload.get('ticket_class') or {}

    section_label = ""
    row_label = ""
    seat_number = None
    seat_label = ""
    eventbrite_seat_id = clean_str_or_none(attendee_payload.get('eventbrite_seat_id'))

    # 1. ORDEM DE PRECEDÊNCIA PRINCIPAL: Estruturas explícitas de Reserved Seating
    reserved_seating = attendee_payload.get('reserved_seating') or attendee_payload.get('seat')
    if isinstance(reserved_seating, dict):
        row_label = clean_str(reserved_seating.get('row'))
        seat_label = clean_str(reserved_seating.get('seat'))
        eventbrite_seat_id = clean_str_or_none(reserved_seating.get('seat_id')) or eventbrite_seat_id
        section_label = clean_str(reserved_seating.get('section'))
        try:
            seat_number = int(seat_label)
        except (TypeError, ValueError):
            pass

    # 2. FALLBACK SECUNDÁRIO E OPCIONAL: Se não encontrou dados e existe assigned_number
    if not row_label and not seat_label:
        assigned_number = attendee_payload.get('assigned_number')
        if assigned_number:
            temp_label = str(assigned_number).strip()
            if ',' in temp_label:
                parts = [p.strip() for p in temp_label.split(',')]
                for part in parts:
                    if part.lower().startswith('row '):
                        row_label = part[4:].strip()
                    elif part.lower().startswith('seat '):
                        seat_label = part[5:].strip()
                        try:
                            seat_number = int(seat_label)
                        except (TypeError, ValueError):
                            pass
            elif '-' in temp_label:
                r_part, s_part = temp_label.split('-', 1)
                row_label = r_part.strip()
                seat_label = s_part.strip()
                try:
                    seat_number = int(seat_label)
                except (TypeError, ValueError):
                    pass

    # Construção defensiva do nome
    first_name = clean_str(profile.get('first_name'))
    last_name = clean_str(profile.get('last_name'))
    full_name = clean_str(profile.get('name'))
    if not full_name:
        full_name = f"{first_name} {last_name}".strip()
    else:
        full_name = full_name.strip()

    return {
        "eventbrite_attendee_id": clean_str_or_none(attendee_payload.get('id')),
        "eventbrite_order_id": clean_str_or_none(attendee_payload.get('order_id')),
        "attendee_name": full_name,
        "attendee_email": clean_str(profile.get('email')),
        "ticket_class_id": clean_str_or_none(attendee_payload.get('ticket_class_id')),
        "ticket_class_name": clean_str(attendee_payload.get('ticket_class_name') or ticket_class.get('name') or ''),
        "section_label": section_label,
        "row_label": row_label,
        "seat_number": seat_number,
        "seat_label": seat_label,
        "eventbrite_seat_id": eventbrite_seat_id
    }


def get_eventbrite_seat_map(eventbrite_event_id: str) -> list[dict]:
    """
    Fetches the seat map from Eventbrite API.
    Since the standard Eventbrite REST API has restricted public seat map endpoints,
    we implement a robust fetch that tries to get seat map details from '/events/{event_id}/seat_map/',
    and falls back to extracting seat structures from attendee payloads.
    """
    try:
        res = _eventbrite_request('GET', f'/events/{eventbrite_event_id}/seat_map/')
        if isinstance(res, dict) and 'seats' in res:
            return res['seats']
    except EventbriteAPIError:
        pass

    # Fallback: Fetch attendees to harvest seats from reserved seating payloads
    seats = []
    try:
        attendees_data = list_eventbrite_attendees(eventbrite_event_id)
        attendees = attendees_data.get('attendees', [])
        seen_seat_ids = set()
        for att in attendees:
            reserved_seating = att.get('reserved_seating') or att.get('seat')
            if isinstance(reserved_seating, dict):
                seat_id = clean_str_or_none(reserved_seating.get('seat_id'))
                if seat_id and seat_id not in seen_seat_ids:
                    seen_seat_ids.add(seat_id)
                    seats.append({
                        'id': seat_id,
                        'section': clean_str(reserved_seating.get('section')),
                        'row': clean_str(reserved_seating.get('row')),
                        'seat': clean_str(reserved_seating.get('seat')),
                    })
    except Exception:
        pass
    return seats