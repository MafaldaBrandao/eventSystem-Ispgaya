from __future__ import annotations

from email import encoders
from email.mime.base import MIMEBase

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from .email_assets import get_ispgaya_logo_path


def send_user_credentials_email(*, recipient_email: str, recipient_name: str, password: str) -> None:
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@ispgaya.pt')
    logo_cid = 'ispgaya-logo'
    context = {
        'recipient_name': recipient_name.strip() or 'Utilizador',
        'recipient_email': recipient_email.strip(),
        'password': password,
        'from_name': _extract_sender_name(from_email),
        'from_email': _extract_sender_email(from_email),
        'logo_cid': logo_cid,
    }
    text_message = render_to_string('emails/users/user_credentials.txt', context)
    html_message = render_to_string('emails/users/user_credentials.html', context)

    message = EmailMultiAlternatives(
        subject='Acesso InfoCultura',
        body=text_message,
        from_email=from_email,
        to=[recipient_email],
    )

    logo_path = get_ispgaya_logo_path()
    if logo_path is not None:
        image_part = MIMEBase('image', 'svg+xml')
        image_part.set_payload(logo_path.read_bytes())
        encoders.encode_base64(image_part)
        image_part.add_header('Content-ID', f'<{logo_cid}>')
        image_part.add_header('Content-Disposition', 'inline', filename=logo_path.name)
        message.attach(image_part)

    message.attach_alternative(html_message, 'text/html')
    message.send(fail_silently=False)


def _extract_sender_name(value: str) -> str:
    cleaned = value.strip()
    if '<' in cleaned and '>' in cleaned:
        return cleaned.split('<', 1)[0].strip() or 'InfoCultura'
    return 'InfoCultura'


def _extract_sender_email(value: str) -> str:
    cleaned = value.strip()
    if '<' in cleaned and '>' in cleaned:
        return cleaned.split('<', 1)[1].split('>', 1)[0].strip()
    return cleaned
