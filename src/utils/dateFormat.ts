import type { Locale } from '../i18n/locale.js';
import { getLocaleText } from '../i18n/locale.js';

export function formatPublicDate(value?: string | null, locale: Locale = 'pt'): string {
  if (!value) return getLocaleText(locale, 'Data por definir', 'Date to be defined');

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}
