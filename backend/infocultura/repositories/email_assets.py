from __future__ import annotations

from pathlib import Path

from django.conf import settings


def get_ispgaya_logo_path() -> Path | None:
    repo_root = Path(settings.BASE_DIR).parent
    candidate_paths = [
        repo_root / 'src' / 'assets' / 'ispgaya-logo-negative.svg',
        repo_root / 'src' / 'assets' / 'ispgaya-logo.svg',
    ]

    for candidate in candidate_paths:
        if candidate.exists():
            return candidate

    return None
