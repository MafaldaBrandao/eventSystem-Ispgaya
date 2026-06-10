import os
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from infocultura.api.serializers_newsletters import NewsletterSerializer, NewsletterSubscriberSerializer
from infocultura.repositories.newsletters import send_newsletter_email
from django.template.loader import render_to_string


class NewsletterSerializerTests(TestCase):
    def test_newsletter_status_is_normalized_and_rejected_if_invalid(self):
        serializer = NewsletterSerializer(
            data={
                'title': '  Boletim Mensal  ',
                'subject': '  Novidades  ',
                'content': ' Conteudo ',
                'status': 'Draft',
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['status'], 'draft')
        self.assertEqual(serializer.validated_data['title'], 'Boletim Mensal')

    def test_newsletter_subscriber_email_is_normalized(self):
        serializer = NewsletterSubscriberSerializer(data={'email': '  TEST@EXAMPLE.COM  ', 'is_active': True})

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['email'], 'test@example.com')


class NewsletterEmailTests(TestCase):
    def test_newsletter_html_template_renders_subject_and_body(self):
        html = render_to_string(
            'emails/newsletters/newsletter.html',
            {
                'subject': 'Boletim mensal',
                'body': 'Linha 1\n\nLinha 2',
                'preview_text': 'Linha 1 Linha 2',
                'from_name': 'InfoCultura',
                'from_email': 'noreply@ispgaya.pt',
                'logo_cid': 'ispgaya-logo',
            },
        )

        self.assertIn('Boletim mensal', html)
        self.assertIn('Linha 1', html)
        self.assertIn('Linha 2', html)
        self.assertIn('cid:ispgaya-logo', html)

    @patch('infocultura.repositories.newsletters.EmailMultiAlternatives')
    def test_send_newsletter_email_uses_multipart_message(self, message_cls):
        message = MagicMock()
        message_cls.return_value = message

        send_newsletter_email(subject='Subject', body='Body', recipient_list=['a@example.com'])

        message_cls.assert_called_once()
        message.attach_alternative.assert_called_once()
        message.send.assert_called_once()

    @patch('infocultura.repositories.newsletters.EmailMultiAlternatives')
    def test_send_newsletter_email_skips_empty_recipient_list(self, message_cls):
        send_newsletter_email(subject='Subject', body='Body', recipient_list=[])

        message_cls.assert_not_called()
