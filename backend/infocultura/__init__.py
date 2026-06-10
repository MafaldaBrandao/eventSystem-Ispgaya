"""
InfoCultura backend package.

Typed model layers available in this package:
- `infocultura.domain_models`
- `infocultura.pydantic_models`
- `infocultura.sqlalchemy_live_models`
- `infocultura.sqlalchemy_models`

They are not imported here on purpose, so Django can start even before the
optional dependencies for Pydantic and SQLAlchemy are installed.
"""
