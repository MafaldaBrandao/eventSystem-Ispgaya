import type { MetricViewPayload } from '../api/types.js';

const VISITOR_KEY_STORAGE_KEY = 'ispgaya_cultura_visitor_key';

type MetricRouteContext = {
  section: string;
  title: string;
  content_type?: string;
  object_id?: number | null;
};

function makeVisitorKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `visitor_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getOrCreateInfoCulturaVisitorKey(): string {
  if (typeof window === 'undefined') return '';

  try {
    const existing = window.localStorage.getItem(VISITOR_KEY_STORAGE_KEY);
    if (existing) return existing;

    const nextKey = makeVisitorKey();
    window.localStorage.setItem(VISITOR_KEY_STORAGE_KEY, nextKey);
    return nextKey;
  } catch {
    return '';
  }
}

function buildContext(pathname: string): MetricRouteContext | null {
  if (pathname === '/' || pathname === '') {
    return { section: 'home', title: 'Home' };
  }

  if (pathname === '/vida-academica/noticias') {
    return { section: 'news', title: 'Notícias' };
  }

  if (/^\/vida-academica\/noticias\/\d+\/?$/.test(pathname)) {
    return { section: 'news', title: 'Notícia', content_type: 'news' };
  }

  if (pathname === '/vida-academica/eventos') {
    return { section: 'events', title: 'Eventos' };
  }

  if (/^\/vida-academica\/eventos\/\d+\/?$/.test(pathname)) {
    return { section: 'events', title: 'Evento', content_type: 'event' };
  }

  if (pathname === '/investigacao/publicacoes-cientificas') {
    return { section: 'research', title: 'Publicações Científicas' };
  }

  if (pathname === '/laboratorio-cultural') {
    return { section: 'laboratory', title: 'Laboratório Cultural' };
  }

  if (pathname === '/laboratorio-cultural/agenda') {
    return { section: 'agenda', title: 'Agenda' };
  }

  if (pathname === '/laboratorio-cultural/clube-leitura') {
    return { section: 'clubs', title: 'Clube de Leitura' };
  }

  if (pathname === '/laboratorio-cultural/tuna') {
    return { section: 'clubs', title: 'Tuna Académica' };
  }

  if (pathname === '/laboratorio-cultural/teatro') {
    return { section: 'clubs', title: 'Teatro' };
  }

  if (/^\/laboratorio-cultural\/clubes\/\d+\/?$/.test(pathname)) {
    return { section: 'clubs', title: 'Clube Cultural', content_type: 'club' };
  }

  if (/^\/laboratorio-cultural\/livros\/\d+\/?$/.test(pathname)) {
    return { section: 'books', title: 'Livro', content_type: 'book' };
  }

  if (/^\/laboratorio-cultural\/sessoes\/\d+\/?$/.test(pathname)) {
    return { section: 'sessions', title: 'Sessão', content_type: 'session' };
  }

  if (/^\/laboratorio-cultural\/eventos\/\d+\/?$/.test(pathname)) {
    return { section: 'events', title: 'Evento Cultural', content_type: 'event' };
  }

  return null;
}

export function buildInfoCulturaMetricViewPayload(pathname: string): MetricViewPayload | null {
  if (pathname.startsWith('/infocultura')) {
    return null;
  }

  const context = buildContext(pathname);
  if (!context) return null;

  const title = context.title;
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || '' : '';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const referrer = typeof document !== 'undefined' ? document.referrer || '' : '';

  return {
    kind: 'page_view',
    section: context.section,
    content_type: context.content_type || 'page',
    object_id: context.object_id ?? null,
    title,
    page_path: pathname,
    locale,
    referrer,
    user_agent: userAgent,
    visitor_key: getOrCreateInfoCulturaVisitorKey()
  };
}
