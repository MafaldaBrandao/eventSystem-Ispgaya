import type { Locale } from './locale';

export function buildIspgayaUrl(locale: Locale, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://ispgaya.pt/${locale}${normalizedPath}`;
}

export function localizePath(locale: Locale, ptPath: string, enPath: string): string {
  return locale === 'en' ? enPath : ptPath;
}

