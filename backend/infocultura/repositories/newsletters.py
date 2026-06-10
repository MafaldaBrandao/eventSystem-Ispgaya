from __future__ import annotations

from email import encoders
from email.mime.base import MIMEBase

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from ..models import NewsletterSubscriber
from .email_assets import get_ispgaya_logo_path


def list_active_newsletter_subscriber_emails() -> list[str]:
    return list(
        NewsletterSubscriber.objects.filter(is_active=True)
        .exclude(email__isnull=True)
        .exclude(email__exact='')
        .values_list('email', flat=True)
        .distinct()
    )


def send_newsletter_email(*, subject: str, body: str, recipient_list: list[str], image_url: str | None = None) -> None:
    if not recipient_list:
        return

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@ispgaya.pt')
    logo_cid = 'ispgaya-logo'
    context = {
        'subject': subject.strip(),
        'body': body.strip(),
        'preview_text': _build_preview_text(body),
        'from_name': _extract_sender_name(from_email),
        'from_email': _extract_sender_email(from_email),
        'logo_cid': logo_cid,
        'image_url': image_url,
    }
    text_message = render_to_string('emails/newsletters/newsletter.txt', context)
    html_message = render_to_string('emails/newsletters/newsletter.html', context)

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_message,
        from_email=from_email,
        to=recipient_list,
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


def _build_preview_text(body: str) -> str:
    lines = [line.strip() for line in body.splitlines() if line.strip()]
    if not lines:
        return ''
    return ' '.join(lines[:2])[:180]


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
