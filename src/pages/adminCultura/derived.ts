import { Bell, CalendarClock, FilePlus2, Newspaper, Users, type LucideIcon } from 'lucide-react';

import type {
  InfoCulturaAdminNotification,
  InfoCulturaBook,
  InfoCulturaCategory,
  InfoCulturaClub,
  InfoCulturaDashboardStats,
  InfoCulturaEvent,
  InfoCulturaNews,
  InfoCulturaSession,
  InfoCulturaUser,
} from '../../api/infoculturaApi.js';
import {
  adminSectionGroups,
  adminSections,
  activityTabBySection,
} from './constants.js';
import type { ActivityTab, AdminContextLink, AdminSection, UserPage } from './types.js';
import {
  formatAdminDateTime,
  getActivityRoute,
  getContentRoute,
  getEventbriteRoute,
  getNewsRoute,
  getPhotoRoute,
  getWorkflowStatusLabel,
  normalizeWorkflowStatus,
  getAdminSectionHref,
} from './utils.js';
import { getLocaleText, type Locale } from '../../i18n/locale';

export type AdminOverviewStat = { label: string; value: string | number };

export type DashboardHighlight = {
  label: string;
  value: string | number;
  tone: 'slate' | 'amber' | 'blue' | 'rose';
  icon: LucideIcon;
};

export type DashboardAlert = {
  id: string;
  title: string;
  detail: string;
  href: string;
  level: string;
  is_read: boolean;
  created_at: string | null;
};

export type DashboardAction = {
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
};

export type DashboardAgendaEntry = {
  label: string;
  title: string;
  meta: string;
  date: string;
  href: string;
};

export function getVisibleSections(canManageUsers: boolean, allowedActivityTabs: ActivityTab[]) {
  return adminSections.filter((section) => {
    if (section.id === 'logs' || section.id === 'utilizadores' || section.id === 'clubes') {
      return canManageUsers;
    }

    if (section.id === 'livros' || section.id === 'sessoes' || section.id === 'eventos') {
      return allowedActivityTabs.includes(activityTabBySection[section.id]);
    }

    return true;
  });
}

export function getVisibleSectionGroups(visibleSections: typeof adminSections) {
  return adminSectionGroups
    .map((group) => ({
      ...group,
      sections: visibleSections.filter((section) => group.ids.includes(section.id)),
    }))
    .filter((group) => group.sections.length > 0);
}

export function getActivitySectionCopy(activityTab: ActivityTab, locale: Locale) {
  if (activityTab === 'books') {
    return {
      label: getLocaleText(locale, 'Livros', 'Books'),
      description: getLocaleText(locale, 'Gestão editorial dos livros associados aos clubes.', 'Editorial management of books associated with clubs.'),
    };
  }

  if (activityTab === 'sessions') {
    return {
      label: getLocaleText(locale, 'Sessões', 'Sessions'),
      description: getLocaleText(locale, 'Planeamento e acompanhamento das sessões de cada clube.', 'Planning and monitoring of each club session.'),
    };
  }

  return {
    label: getLocaleText(locale, 'Eventos', 'Events'),
    description: getLocaleText(locale, 'Programação e workflow editorial dos eventos culturais.', 'Programming and editorial workflow for cultural events.'),
  };
}

export function getNewsPageLinks(editingNewsId: number | null, locale: Locale): AdminContextLink[] {
  return [
    { label: editingNewsId ? getLocaleText(locale, 'Editar Notícia', 'Edit News') : getLocaleText(locale, 'Nova Notícia', 'New News'), href: getNewsRoute('form') },
    { label: getLocaleText(locale, 'Notícias Registadas', 'Registered News'), href: getNewsRoute('list') },
  ];
}

export function getActivityPageLinks(
  activityTab: ActivityTab,
  editingBookId: number | null,
  editingSessionId: number | null,
  editingEventId: number | null,
  locale: Locale
): AdminContextLink[] {
  if (activityTab === 'books') {
    return [
      { label: editingBookId ? getLocaleText(locale, 'Editar Livro', 'Edit Book') : getLocaleText(locale, 'Novo Livro', 'New Book'), href: getActivityRoute(activityTab, 'form') },
      { label: getLocaleText(locale, 'Livros Registados', 'Registered Books'), href: getActivityRoute(activityTab, 'list') },
    ];
  }

  if (activityTab === 'sessions') {
    return [
      { label: editingSessionId ? getLocaleText(locale, 'Editar Sessão', 'Edit Session') : getLocaleText(locale, 'Nova Sessão', 'New Session'), href: getActivityRoute(activityTab, 'form') },
      { label: getLocaleText(locale, 'Sessões Registadas', 'Registered Sessions'), href: getActivityRoute(activityTab, 'list') },
    ];
  }

  return [
    { label: editingEventId ? getLocaleText(locale, 'Editar Evento', 'Edit Event') : getLocaleText(locale, 'Novo Evento', 'New Event'), href: getActivityRoute(activityTab, 'form') },
    { label: getLocaleText(locale, 'Eventos Registados', 'Registered Events'), href: getActivityRoute(activityTab, 'list') },
    { label: getLocaleText(locale, 'Categorias de Eventos', 'Event Categories'), href: getActivityRoute(activityTab, 'categories') },
  ];
}

export function getContentPageLinks(editingId: string | null, locale: Locale): AdminContextLink[] {
  return [
    { label: editingId ? getLocaleText(locale, 'Editar Conteúdo', 'Edit Content') : getLocaleText(locale, 'Novo Conteúdo', 'New Content'), href: getContentRoute('form') },
    { label: getLocaleText(locale, 'Conteúdos Registados', 'Registered Content'), href: getContentRoute('list') },
  ];
}

export function getPhotoPageLinks(editingId: string | null, locale: Locale): AdminContextLink[] {
  return [
    { label: editingId ? getLocaleText(locale, 'Editar Foto', 'Edit Photo') : getLocaleText(locale, 'Nova Foto', 'New Photo'), href: getPhotoRoute('form') },
    { label: getLocaleText(locale, 'Fotos Registadas', 'Registered Photos'), href: getPhotoRoute('list') },
  ];
}

export function getUserPageLinks(userPage: UserPage | null, locale: Locale): AdminContextLink[] {
  const links: AdminContextLink[] = [
    {
      label: userPage?.mode === 'create' ? getLocaleText(locale, 'Criar Utilizador', 'Create User') : getLocaleText(locale, 'Novo Utilizador', 'New User'),
      href: '/infocultura/utilizadores/novo',
    },
    {
      label: getLocaleText(locale, 'Utilizadores Registados', 'Registered Users'),
      href: '/infocultura/utilizadores',
    },
  ];

  if (userPage?.mode === 'deactivate') {
    links.push({
      label: getLocaleText(locale, 'Desativar Conta', 'Deactivate Account'),
      href: `/infocultura/utilizadores/${userPage.userId}/desativar`,
    });
  }

  if (userPage?.mode === 'activate') {
    links.push({
      label: getLocaleText(locale, 'Ativar Conta', 'Activate Account'),
      href: `/infocultura/utilizadores/${userPage.userId}/ativar`,
    });
  }

  return links;
}

export function getEventbritePageLinks(locale: Locale): AdminContextLink[] {
  return [
    { label: getLocaleText(locale, 'Visão Geral', 'Overview'), href: getEventbriteRoute('overview') },
    { label: getLocaleText(locale, 'Salas', 'Venues'), href: getEventbriteRoute('venues') },
    { label: getLocaleText(locale, 'Lugares', 'Seating'), href: getEventbriteRoute('seating') },
    { label: 'Tickets', href: getEventbriteRoute('tickets') },
  ];
}

export function buildSidebarContextNav(
  newsPageLinks: AdminContextLink[],
  bookPageLinks: AdminContextLink[],
  sessionPageLinks: AdminContextLink[],
  eventPageLinks: AdminContextLink[],
  contentPageLinks: AdminContextLink[],
  photoPageLinks: AdminContextLink[],
  eventbritePageLinks: AdminContextLink[],
  userPageLinks: AdminContextLink[],
  newsPageHref: string | null,
  bookPageHref: string | null,
  sessionPageHref: string | null,
  eventPageHref: string | null,
  contentPageHref: string | null,
  photoPageHref: string | null,
  eventbritePageHref: string | null,
  userPageHref: string | null
): Partial<Record<AdminSection, { links: AdminContextLink[]; activeHref?: string | null }>> {
  return {
    noticias: {
      links: newsPageLinks,
      activeHref: newsPageHref,
    },
    livros: {
      links: bookPageLinks,
      activeHref: bookPageHref,
    },
    sessoes: {
      links: sessionPageLinks,
      activeHref: sessionPageHref,
    },
    eventos: {
      links: [...eventPageLinks, ...eventbritePageLinks],
      activeHref: eventPageHref ?? eventbritePageHref,
    },
    conteudos: {
      links: contentPageLinks,
      activeHref: contentPageHref,
    },
    galeria: {
      links: photoPageLinks,
      activeHref: photoPageHref,
    },
    utilizadores: {
      links: userPageLinks,
      activeHref: userPageHref,
    },
  };
}

export function buildDashboardCards(
  dashboardStats: InfoCulturaDashboardStats | null,
  locale: Locale
): AdminOverviewStat[] {
  if (!dashboardStats) {
    return [];
  }

  return [
    { label: getLocaleText(locale, 'Utilizadores ativos', 'Active users'), value: dashboardStats.active_users },
    { label: getLocaleText(locale, 'Notícias publicadas', 'Published news'), value: dashboardStats.news_published },
    { label: getLocaleText(locale, 'Notícias em revisão', 'News in review'), value: dashboardStats.news_review },
    { label: getLocaleText(locale, 'Eventos em revisão', 'Events in review'), value: dashboardStats.events_review },
    { label: getLocaleText(locale, 'Livros em destaque', 'Featured books'), value: dashboardStats.featured_books },
    { label: getLocaleText(locale, 'Sessões próximas', 'Upcoming sessions'), value: dashboardStats.upcoming_sessions },
    { label: getLocaleText(locale, 'Inscrições pendentes', 'Pending registrations'), value: dashboardStats.registrations_pending },
    { label: getLocaleText(locale, 'Clubes com inscrições abertas', 'Clubs with open registrations'), value: dashboardStats.clubs_with_registrations_open },
  ];
}

export function buildDashboardHighlights(
  dashboardStats: InfoCulturaDashboardStats | null,
  activeUsers: number,
  publishedItems: number,
  pendingRegistrations: number,
  sessionsLength: number,
  locale: Locale
): DashboardHighlight[] {
  return [
    {
      label: getLocaleText(locale, 'Utilizadores ativos', 'Active users'),
      value: dashboardStats?.active_users ?? activeUsers,
      tone: 'slate',
      icon: Users,
    },
    {
      label: getLocaleText(locale, 'Notícias publicadas', 'Published news'),
      value: dashboardStats?.news_published ?? publishedItems,
      tone: 'amber',
      icon: Newspaper,
    },
    {
      label: getLocaleText(locale, 'Sessões próximas', 'Upcoming sessions'),
      value: dashboardStats?.upcoming_sessions ?? sessionsLength,
      tone: 'blue',
      icon: CalendarClock,
    },
    {
      label: getLocaleText(locale, 'Inscrições pendentes', 'Pending registrations'),
      value: dashboardStats?.registrations_pending ?? pendingRegistrations,
      tone: 'rose',
      icon: Bell,
    },
  ];
}

export function buildDashboardAlerts(
  notifications: InfoCulturaAdminNotification[],
  readNotificationIdSet: Set<string>,
  dashboardStats: InfoCulturaDashboardStats | null,
  pendingRegistrations: number,
  locale: Locale
): DashboardAlert[] {
  if (notifications.length > 0) {
    return notifications.slice(0, 4).map((notification) => ({
      id: notification.id,
      title: notification.title,
      detail: notification.message,
      href: notification.href,
      level: notification.level,
      is_read: readNotificationIdSet.has(notification.id),
      created_at: notification.created_at || null,
    }));
  }

  return [
    {
      id: 'editorial-review',
      title: getLocaleText(locale, 'Revisão editorial', 'Editorial review'),
      detail: getLocaleText(
        locale,
        `${dashboardStats?.news_review ?? 0} notícias e ${dashboardStats?.events_review ?? 0} eventos aguardam revisão.`,
        `${dashboardStats?.news_review ?? 0} news items and ${dashboardStats?.events_review ?? 0} events are waiting for review.`
      ),
      href: getNewsRoute('list'),
      level: 'warning',
      is_read: false,
      created_at: null,
    },
    {
      id: 'registrations-pending',
      title: getLocaleText(locale, 'Inscrições por validar', 'Registrations to review'),
      detail: getLocaleText(
        locale,
        `${dashboardStats?.registrations_pending ?? pendingRegistrations} inscrições pendentes de decisão.`,
        `${dashboardStats?.registrations_pending ?? pendingRegistrations} registrations are awaiting a decision.`
      ),
      href: getAdminSectionHref('inscricoes'),
      level: 'warning',
      is_read: false,
      created_at: null,
    },
    {
      id: 'clubs-open',
      title: getLocaleText(locale, 'Clubes com atividade aberta', 'Clubs with open activity'),
      detail: getLocaleText(
        locale,
        `${dashboardStats?.clubs_with_registrations_open ?? 0} clubes com inscrições atualmente ativas.`,
        `${dashboardStats?.clubs_with_registrations_open ?? 0} clubs currently have registrations open.`
      ),
      href: getAdminSectionHref('clubes'),
      level: 'info',
      is_read: false,
      created_at: null,
    },
  ];
}

export function buildDashboardAgenda(dashboardStats: InfoCulturaDashboardStats | null, locale: Locale): DashboardAgendaEntry[] {
  return [
    dashboardStats?.latest_news
      ? {
          label: getLocaleText(locale, 'Última notícia', 'Latest news'),
          title: dashboardStats.latest_news.title,
          meta: `${dashboardStats.latest_news.club_name || getLocaleText(locale, 'Sem clube', 'No club')} · ${
            dashboardStats.latest_news.status
              ? getWorkflowStatusLabel(dashboardStats.latest_news.status)
              : getLocaleText(locale, 'Sem estado', 'No status')
          }`,
          date: formatAdminDateTime(dashboardStats.latest_news.date || ''),
          href: getNewsRoute('list'),
        }
      : null,
    dashboardStats?.next_session
      ? {
          label: getLocaleText(locale, 'Próxima sessão', 'Next session'),
          title: dashboardStats.next_session.title,
          meta: dashboardStats.next_session.club_name || getLocaleText(locale, 'Sem clube', 'No club'),
          date: formatAdminDateTime(dashboardStats.next_session.date || ''),
          href: getActivityRoute('sessions', 'list'),
        }
      : null,
    dashboardStats?.next_event
      ? {
          label: getLocaleText(locale, 'Próximo evento', 'Next event'),
          title: dashboardStats.next_event.title,
          meta: `${dashboardStats.next_event.club_name || getLocaleText(locale, 'Sem clube', 'No club')}${
            dashboardStats.next_event.status ? ` · ${getWorkflowStatusLabel(dashboardStats.next_event.status)}` : ''
          }`,
          date: formatAdminDateTime(dashboardStats.next_event.date || ''),
          href: getActivityRoute('events', 'list'),
        }
      : null,
  ].filter(Boolean) as DashboardAgendaEntry[];
}

export function buildDashboardQuickActions(
  canManageUsers: boolean,
  defaultActivityHref: string,
  locale: Locale
): DashboardAction[] {
  const actions: DashboardAction[] = [
    {
      label: getLocaleText(locale, 'Nova notícia', 'New news'),
      hint: getLocaleText(locale, 'Abrir publicação editorial', 'Open editorial publication'),
      href: getNewsRoute('list'),
      icon: Newspaper,
    },
    {
      label: getLocaleText(locale, 'Nova atividade', 'New activity'),
      hint: getLocaleText(locale, 'Gerir livros, sessões e eventos', 'Manage books, sessions and events'),
      href: defaultActivityHref,
      icon: CalendarClock,
    },
    {
      label: getLocaleText(locale, 'Conteúdos culturais', 'Cultural content'),
      hint: getLocaleText(locale, 'Atualizar Tuna, Leitura e Teatro', 'Update Tuna, Reading and Theatre'),
      href: getAdminSectionHref('conteudos'),
      icon: FilePlus2,
    },
    {
      label: getLocaleText(locale, 'Inscrições', 'Registrations'),
      hint: getLocaleText(locale, 'Validar pedidos pendentes', 'Validate pending requests'),
      href: getAdminSectionHref('inscricoes'),
      icon: Bell,
    },
  ];

  if (canManageUsers) {
    actions.unshift({
      label: getLocaleText(locale, 'Utilizadores', 'Users'),
      hint: getLocaleText(locale, 'Criar ou editar acessos', 'Create or edit access'),
      href: getAdminSectionHref('utilizadores'),
      icon: Users,
    });
  }

  return actions;
}

export function buildNotificationOverviewStats(
  notifications: InfoCulturaAdminNotification[],
  unreadCount: number,
  locale: Locale
): AdminOverviewStat[] {
  return [
    { label: getLocaleText(locale, 'Total', 'Total'), value: notifications.length },
    { label: getLocaleText(locale, 'Por ler', 'Unread'), value: unreadCount },
    {
      label: getLocaleText(locale, 'Editoriais', 'Editorial'),
      value: notifications.filter((notification) => notification.kind === 'editorial').length,
    },
    {
      label: getLocaleText(locale, 'Agenda', 'Agenda'),
      value: notifications.filter((notification) => notification.kind === 'schedule').length,
    },
  ];
}

export function buildUserOverviewStats(users: InfoCulturaUser[], locale: Locale): AdminOverviewStat[] {
  return [
    { label: getLocaleText(locale, 'Total', 'Total'), value: users.length },
    { label: getLocaleText(locale, 'Ativos', 'Active'), value: users.filter((user) => user.is_active).length },
    { label: getLocaleText(locale, 'Inativos', 'Inactive'), value: users.filter((user) => !user.is_active).length },
    { label: getLocaleText(locale, 'Admins de clube', 'Club admins'), value: users.filter((user) => user.role === 'club_admin').length },
  ];
}

export function buildClubOverviewStats(clubs: InfoCulturaClub[], locale: Locale): AdminOverviewStat[] {
  return [
    { label: getLocaleText(locale, 'Total', 'Total'), value: clubs.length },
    { label: getLocaleText(locale, 'Ativos', 'Active'), value: clubs.filter((club) => club.is_active).length },
    { label: getLocaleText(locale, 'Inscrições abertas', 'Open registrations'), value: clubs.filter((club) => club.enable_registrations).length },
    { label: getLocaleText(locale, 'Com imagem', 'With image'), value: clubs.filter((club) => Boolean(club.image)).length },
  ];
}

export function buildNewsOverviewStats(
  newsTotal: number,
  dashboardStats: InfoCulturaDashboardStats | null,
  selectedNewsIds: number[],
  sortedNews: InfoCulturaNews[],
  locale: Locale
): AdminOverviewStat[] {
  return [
    { label: getLocaleText(locale, 'Total filtrado', 'Filtered total'), value: newsTotal },
    {
      label: getLocaleText(locale, 'Em revisão', 'In review'),
      value:
        dashboardStats?.news_review ??
        sortedNews.filter((item) => normalizeWorkflowStatus(item.news_status_name) === 'review').length,
    },
    { label: getLocaleText(locale, 'Selecionadas', 'Selected'), value: selectedNewsIds.length },
    {
      label: getLocaleText(locale, 'Publicadas', 'Published'),
      value:
        dashboardStats?.news_published ??
        sortedNews.filter((item) => normalizeWorkflowStatus(item.news_status_name) === 'published').length,
    },
  ];
}

export function buildActivityOverviewStats(
  activityTab: ActivityTab,
  activityTotal: number,
  selectedBookIds: number[],
  selectedEventIds: number[],
  sortedBooks: InfoCulturaBook[],
  sortedCategories: InfoCulturaCategory[],
  sortedEvents: InfoCulturaEvent[],
  sortedSessions: InfoCulturaSession[],
  locale: Locale
): AdminOverviewStat[] {
  if (activityTab === 'books') {
    return [
      { label: getLocaleText(locale, 'Total filtrado', 'Filtered total'), value: activityTotal },
      { label: getLocaleText(locale, 'Em destaque', 'Featured'), value: sortedBooks.filter((item) => item.is_featured).length },
      { label: getLocaleText(locale, 'Selecionados', 'Selected'), value: selectedBookIds.length },
      { label: getLocaleText(locale, 'Clubes na pagina', 'Clubs on page'), value: new Set(sortedBooks.map((item) => item.club_id)).size },
    ];
  }

  if (activityTab === 'sessions') {
    return [
      { label: getLocaleText(locale, 'Total filtrado', 'Filtered total'), value: activityTotal },
      {
        label: getLocaleText(locale, 'Próximas', 'Upcoming'),
        value: sortedSessions.filter((item) => new Date(item.start_date).getTime() >= Date.now())
          .length,
      },
      {
        label: getLocaleText(locale, 'Inscrições abertas', 'Open registrations'),
        value: sortedSessions.filter((item) => item.enable_registrations).length,
      },
      {
        label: getLocaleText(locale, 'Clubes na pagina', 'Clubs on page'),
        value: new Set(sortedSessions.map((item) => item.club_id)).size,
      },
    ];
  }

  return [
    { label: getLocaleText(locale, 'Total filtrado', 'Filtered total'), value: activityTotal },
    { label: getLocaleText(locale, 'Em revisão', 'In review'), value: sortedEvents.filter((item) => normalizeWorkflowStatus(item.status) === 'review').length },
    { label: getLocaleText(locale, 'Selecionados', 'Selected'), value: selectedEventIds.length },
    { label: getLocaleText(locale, 'Categorias', 'Categories'), value: sortedCategories.length },
  ];
}

export function buildRegistrationOverviewStats(
  registrationTotal: number,
  pendingRegistrations: number,
  approvedRegistrations: number,
  rejectedRegistrations: number
): AdminOverviewStat[] {
  return [
    { label: 'Total filtrado', value: registrationTotal },
    { label: 'Pendentes', value: pendingRegistrations },
    { label: 'Aprovadas', value: approvedRegistrations },
    { label: 'Rejeitadas', value: rejectedRegistrations },
  ];
}

export function buildContentOverviewStats(
  sortedItems: { area: string }[],
  publishedItems: number
): AdminOverviewStat[] {
  return [
    { label: 'Total', value: sortedItems.length },
    { label: 'Publicados', value: publishedItems },
    { label: 'Rascunhos', value: Math.max(0, sortedItems.length - publishedItems) },
    {
      label: 'Áreas',
      value: new Set(sortedItems.map((item) => item.area)).size,
    },
  ];
}
