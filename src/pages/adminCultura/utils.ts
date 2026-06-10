import { InfoCulturaClub, InfoCulturaUser } from '../../api/infoculturaApi.js';
import {
  activitySectionByTab,
  allActivityTabs,
  NOTIFICATION_READ_KEY,
  WORKFLOW_LABELS
} from './constants.js';
import {
  ActivitySection,
  ActivitySubpage,
  ActivityTab,
  AdminSection,
  ContentSubpage,
  EventbriteSubpage,
  NewsSubpage,
  PhotoSubpage,
  UserPage
} from './types.js';

export function getDefaultActivityOrdering(tab: ActivityTab): string {
  if (tab === 'books') return 'featured';
  if (tab === 'sessions') return 'date_asc';
  return 'date_asc';
}

export function normalizeWorkflowStatus(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'rascunho') return 'draft';
  if (normalized === 'publicado') return 'published';
  return normalized;
}

export function getWorkflowStatusLabel(value: string): string {
  return WORKFLOW_LABELS[normalizeWorkflowStatus(value)] || value;
}

export function getWorkflowStatusOptions(order: string[], currentValue: string): string[] {
  const normalizedCurrent = normalizeWorkflowStatus(currentValue || '');
  const nextValues = [...order];

  if (normalizedCurrent && !nextValues.includes(normalizedCurrent)) {
    nextValues.push(normalizedCurrent);
  }

  return nextValues;
}

export function downloadBlobFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function getStoredReadNotificationIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_READ_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

export function isWithinDateRange(value: string | null | undefined, fromDate: string, toDate: string): boolean {
  const target = value ? value.slice(0, 10) : '';

  if (fromDate && (!target || target < fromDate)) {
    return false;
  }

  if (toDate && (!target || target > toDate)) {
    return false;
  }

  return true;
}

export function normalizeClubName(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function getAllowedActivityTabs(user: InfoCulturaUser | null): ActivityTab[] {
  if (!user) return allActivityTabs;
  if (user.role === 'superadmin') return allActivityTabs;

  const clubName = normalizeClubName(user.club_name);
  if (clubName.includes('teatro')) {
    return ['sessions', 'events'];
  }

  if (clubName.includes('tuna')) {
    return ['sessions', 'events'];
  }

  if (clubName.includes('leitura')) {
    return allActivityTabs;
  }

  return allActivityTabs;
}

export function getDefaultActivityTab(user: InfoCulturaUser | null): ActivityTab {
  return getAllowedActivityTabs(user)[0] || 'sessions';
}

export function getNewsSubpage(pathname: string): NewsSubpage | null {
  if (pathname === '/infocultura/noticias/nova') return 'form';
  if (pathname === '/infocultura/noticias/registadas') return 'list';
  return null;
}

export function getActivitySubpage(pathname: string): ActivitySubpage | null {
  if (pathname.endsWith('/novo')) return 'form';
  if (pathname.endsWith('/registados')) return 'list';
  if (pathname.endsWith('/categorias')) return 'categories';
  return null;
}

export function getContentSubpage(pathname: string): ContentSubpage | null {
  if (pathname === '/infocultura/conteudos/novo') return 'form';
  if (pathname === '/infocultura/conteudos/registados') return 'list';
  return null;
}

export function getPhotoSubpage(pathname: string): PhotoSubpage | null {
  if (pathname === '/infocultura/galeria/nova') return 'form';
  if (pathname === '/infocultura/galeria/registadas') return 'list';
  return null;
}

export function getEventbriteSubpage(pathname: string): EventbriteSubpage | null {
  const clean = pathname.replace(/\/$/, '');
  if (clean === '/infocultura/eventbrite/salas') return 'venues';
  if (clean === '/infocultura/eventbrite/lugares') return 'seating';
  if (clean === '/infocultura/eventbrite/tickets') return 'tickets';
  if (clean === '/infocultura/eventbrite') return 'overview';
  return null;
}


export function getNewsRoute(page: NewsSubpage): string {
  return page === 'form' ? '/infocultura/noticias/nova' : '/infocultura/noticias/registadas';
}

export function getActivityRoute(tab: ActivityTab, page: ActivitySubpage): string {
  if (page === 'categories') {
    return '/infocultura/eventos/categorias';
  }

  return `/infocultura/${activitySectionByTab[tab]}/${page === 'form' ? 'novo' : 'registados'}`;
}

export function getContentRoute(page: ContentSubpage): string {
  return page === 'form' ? '/infocultura/conteudos/novo' : '/infocultura/conteudos/registados';
}

export function getPhotoRoute(page: PhotoSubpage): string {
  return page === 'form' ? '/infocultura/galeria/nova' : '/infocultura/galeria/registadas';
}

export function getEventbriteRoute(page: EventbriteSubpage): string {
  switch (page) {
    case 'venues':
      return '/infocultura/eventbrite/salas';
    case 'seating':
      return '/infocultura/eventbrite/lugares';
    case 'tickets':
      return '/infocultura/eventbrite/tickets';
    default:
      return '/infocultura/eventbrite';
  }
}

export function getAdminSectionHref(section: AdminSection): string {
  switch (section) {
    case 'resumo':
      return '/infocultura/resumo';
    case 'metricas':
      return '/infocultura/metricas';
    case 'logs':
      return '/infocultura/logs';
    case 'notificacoes':
      return '/infocultura/notificacoes';
    case 'newsletters':
      return '/infocultura/newsletters';
    case 'galeria':
      return '/infocultura/galeria';
    case 'utilizadores':
      return '/infocultura/utilizadores';
    case 'conteudos':
      return '/infocultura/conteudos';
    case 'noticias':
      return '/infocultura/noticias';
    case 'livros':
      return '/infocultura/livros';
    case 'sessoes':
      return '/infocultura/sessoes';
    case 'eventos':
      return '/infocultura/eventos';
    case 'eventbrite':
      return '/infocultura/eventbrite';
    case 'atividades':
      return '/infocultura/atividades';
    case 'inscricoes':
      return '/infocultura/inscricoes';
    case 'clubes':
      return '/infocultura/clubes';
  }
}

export function isActivitySection(section: AdminSection | null): section is ActivitySection | 'atividades' {
  return section === 'livros' || section === 'sessoes' || section === 'eventos' || section === 'atividades';
}

export function getAdminSection(pathname: string): AdminSection | null {
  if (pathname === '/infocultura' || pathname === '/infocultura/' || pathname === '/infocultura/resumo') {
    return 'resumo';
  }

  if (pathname === '/infocultura/metricas' || pathname.startsWith('/infocultura/metricas/')) {
    return 'metricas';
  }

  if (pathname === '/infocultura/logs' || pathname.startsWith('/infocultura/logs/')) {
    return 'logs';
  }

  if (
    pathname === '/infocultura/utilizadores' ||
    pathname.startsWith('/infocultura/utilizadores/')
  ) {
    return 'utilizadores';
  }

  if (pathname === '/infocultura/conteudos' || pathname.startsWith('/infocultura/conteudos/')) {
    return 'conteudos';
  }

  if (pathname === '/infocultura/noticias' || pathname.startsWith('/infocultura/noticias/')) {
    return 'noticias';
  }

  if (pathname === '/infocultura/notificacoes') {
    return 'notificacoes';
  }

  if (pathname === '/infocultura/newsletters' || pathname.startsWith('/infocultura/newsletters/')) {
    return 'newsletters';
  }

  if (pathname === '/infocultura/galeria' || pathname.startsWith('/infocultura/galeria/')) {
    return 'galeria';
  }

  if (pathname === '/infocultura/livros' || pathname.startsWith('/infocultura/livros/')) {
    return 'livros';
  }

  if (pathname === '/infocultura/sessoes' || pathname.startsWith('/infocultura/sessoes/')) {
    return 'sessoes';
  }

  if (pathname === '/infocultura/eventos' || pathname.startsWith('/infocultura/eventos/')) {
    return 'eventos';
  }

  if (pathname === '/infocultura/eventbrite' || pathname.startsWith('/infocultura/eventbrite/')) {
    return 'eventbrite';
  }

  if (pathname === '/infocultura/atividades') {
    return 'atividades';
  }

  if (pathname === '/infocultura/inscricoes') {
    return 'inscricoes';
  }

  if (pathname === '/infocultura/clubes') {
    return 'clubes';
  }

  return null;
}

export function getUserPage(pathname: string): UserPage | null {
  if (pathname === '/infocultura/utilizadores') {
    return { mode: 'list' };
  }

  if (pathname === '/infocultura/utilizadores/novo') {
    return { mode: 'create' };
  }

  const profileMatch = pathname.match(/^\/infocultura\/utilizadores\/(\d+)\/perfil\/?$/);
  if (profileMatch) {
    return { mode: 'profile', userId: Number(profileMatch[1]) };
  }

  const editMatch = pathname.match(/^\/infocultura\/utilizadores\/(\d+)\/editar\/?$/);
  if (editMatch) {
    return { mode: 'edit', userId: Number(editMatch[1]) };
  }

  const deactivateMatch = pathname.match(
    /^\/infocultura\/utilizadores\/(\d+)\/desativar\/?$/
  );
  if (deactivateMatch) {
    return { mode: 'deactivate', userId: Number(deactivateMatch[1]) };
  }

  const activateMatch = pathname.match(
    /^\/infocultura\/utilizadores\/(\d+)\/ativar\/?$/
  );
  if (activateMatch) {
    return { mode: 'activate', userId: Number(activateMatch[1]) };
  }

  return null;
}

export function sortUsers(list: InfoCulturaUser[]): InfoCulturaUser[] {
  return [...list].sort((a, b) => {
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1;
    }

    return a.name.localeCompare(b.name) || a.email.localeCompare(b.email);
  });
}

export function sortUsersByOrder(list: InfoCulturaUser[], ordering: string): InfoCulturaUser[] {
  const sorted = [...list];

  switch (ordering) {
    case 'newest':
      return sorted.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    case 'oldest':
      return sorted.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name) || b.email.localeCompare(a.email));
    case 'email_asc':
      return sorted.sort((a, b) => a.email.localeCompare(b.email) || a.name.localeCompare(b.name));
    case 'email_desc':
      return sorted.sort((a, b) => b.email.localeCompare(a.email) || b.name.localeCompare(a.name));
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
    default:
      return sortUsers(sorted);
  }
}

export function sortClubs(list: InfoCulturaClub[]): InfoCulturaClub[] {
  return [...list].sort((a, b) => {
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

export function sortClubsByOrder(list: InfoCulturaClub[], ordering: string): InfoCulturaClub[] {
  const sorted = [...list];

  switch (ordering) {
    case 'newest':
      return sorted.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    case 'oldest':
      return sorted.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'registrations_open':
      return sorted.sort(
        (a, b) =>
          Number(Boolean(b.enable_registrations)) - Number(Boolean(a.enable_registrations)) ||
          a.name.localeCompare(b.name)
      );
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sortClubs(sorted);
  }
}

export function formatAdminDateTime(value?: string | null): string {
  if (!value) return 'Sem data';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 16);
}
