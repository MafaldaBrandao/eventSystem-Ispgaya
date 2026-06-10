from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

DEFAULT_UNIVERSITY_COUNTRY = 'Portugal'
UNIVERSITY_SEARCH_BASE_URL = 'http://universities.hipolabs.com/search'

PORTUGUESE_UNIVERSITY_FALLBACKS: list[dict[str, Any]] = [
    {
        'name': 'Universidade de Lisboa',
        'country': 'Portugal',
        'domains': ['ulisboa.pt'],
        'web_pages': ['https://www.ulisboa.pt/'],
    },
    {
        'name': 'Universidade do Porto',
        'country': 'Portugal',
        'domains': ['up.pt'],
        'web_pages': ['https://www.up.pt/'],
    },
    {
        'name': 'Universidade de Coimbra',
        'country': 'Portugal',
        'domains': ['uc.pt'],
        'web_pages': ['https://www.uc.pt/'],
    },
    {
        'name': 'Universidade do Minho',
        'country': 'Portugal',
        'domains': ['uminho.pt'],
        'web_pages': ['https://www.uminho.pt/'],
    },
    {
        'name': 'Universidade de Aveiro',
        'country': 'Portugal',
        'domains': ['ua.pt'],
        'web_pages': ['https://www.ua.pt/'],
    },
    {
        'name': 'Universidade Nova de Lisboa',
        'country': 'Portugal',
        'domains': ['unl.pt'],
        'web_pages': ['https://www.unl.pt/'],
    },
    {
        'name': 'Instituto Politecnico de Lisboa',
        'country': 'Portugal',
        'domains': ['ipolisboa.pt'],
        'web_pages': ['https://www.ipl.pt/'],
    },
    {
        'name': 'Instituto Politecnico do Porto',
        'country': 'Portugal',
        'domains': ['ipp.pt'],
        'web_pages': ['https://www.ipp.pt/'],
    },
]


@dataclass(frozen=True)
class UniversitySearchResult:
    name: str
    country: str
    domains: list[str]
    web_pages: list[str]


def search_universities(
    *,
    name: str = '',
    country: str = DEFAULT_UNIVERSITY_COUNTRY,
    limit: int = 25,
    offset: int = 0,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {}
    normalized_name = name.strip()
    normalized_country = country.strip()

    if normalized_name:
        params['name'] = normalized_name

    if normalized_country and normalized_country.lower() not in {'all', '*'}:
        params['country'] = normalized_country

    if limit > 0:
        params['limit'] = str(limit)
    if offset > 0:
        params['offset'] = str(offset)

    request = Request(
        f"{UNIVERSITY_SEARCH_BASE_URL}?{urlencode(params)}",
        headers={'User-Agent': 'InfoCultura/1.0'},
        method='GET',
    )

    payload: list[dict[str, Any]] | None = None

    try:
        with urlopen(request, timeout=8) as response:
            raw_payload = json.loads(response.read().decode('utf-8'))
        if isinstance(raw_payload, list):
            payload = [item for item in raw_payload if isinstance(item, dict)]
    except (Exception,):
        payload = None

    results = [_normalize_university_item(item) for item in (payload or PORTUGUESE_UNIVERSITY_FALLBACKS)]
    results = _filter_university_results(results, name=normalized_name, country=normalized_country)
    results.sort(key=lambda item: (item['country'].lower() != 'portugal', item['name'].lower()))
    return results[:limit] if limit > 0 else results


def _normalize_university_item(item: dict[str, Any]) -> dict[str, Any]:
    raw_domains = item.get('domains') or item.get('domain') or []
    raw_web_pages = item.get('web_pages') or item.get('web_page') or []

    domains = _normalize_string_list(raw_domains)
    web_pages = _normalize_string_list(raw_web_pages)

    return {
        'name': str(item.get('name') or '').strip(),
        'country': str(item.get('country') or '').strip(),
        'domains': domains,
        'web_pages': web_pages,
    }


def _normalize_string_list(value: Any) -> list[str]:
    if isinstance(value, list):
        items = value
    elif isinstance(value, str):
        items = [value]
    elif value is None:
        items = []
    else:
        items = [str(value)]

    return [str(item).strip() for item in items if str(item).strip()]


def _filter_university_results(
    results: list[dict[str, Any]],
    *,
    name: str,
    country: str,
) -> list[dict[str, Any]]:
    filtered = results

    if country and country.lower() not in {'all', '*'}:
        filtered = [item for item in filtered if item['country'].lower() == country.lower()]

    if name:
        normalized_name = name.lower()
        filtered = [
            item
            for item in filtered
            if normalized_name in item['name'].lower()
            or any(normalized_name in domain.lower() for domain in item['domains'])
        ]

    return filtered
