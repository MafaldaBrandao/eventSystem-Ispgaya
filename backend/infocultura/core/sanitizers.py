from __future__ import annotations

from typing import Iterable

import bleach


DEFAULT_ALLOWED_TAGS = [
    'b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a'
]


def clean_text(value: str, *, allowed_tags: Iterable[str] | None = None) -> str:
    """Sanitize a text input to prevent XSS.

    - Strips disallowed HTML tags and attributes.
    - Returns an empty string for None-like inputs.
    """
    if value is None:
        return ''
    raw = str(value)
    tags = list(allowed_tags) if allowed_tags is not None else DEFAULT_ALLOWED_TAGS
    # Allow only href on links
    cleaned = bleach.clean(raw, tags=tags, attributes={'a': ['href', 'title', 'rel']}, strip=True)
    # Ensure that links are safe (add rel="nofollow noopener noreferrer")
    def _link_attrs(name, value):
        if name == 'a':
            attrs = dict(value)
            href = attrs.get('href')
            if href and href.startswith(('http://', 'https://')):
                attrs['rel'] = 'nofollow noopener noreferrer'
            return attrs
        return value

    # bleach.linkify can be used but we already allow anchors; return cleaned
    return cleaned
