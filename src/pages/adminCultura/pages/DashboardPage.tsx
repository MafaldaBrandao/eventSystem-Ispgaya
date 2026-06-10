import { Bell, BookOpen, CalendarClock, LayoutDashboard, Sparkles, type LucideIcon } from 'lucide-react';

import { formatAdminDateTime } from '../utils';
import {
  adminBtnSecondary,
  adminInfo,
  adminStatCard,
  adminStatLabel,
  adminStatValue,
  adminUserStatusActive,
  adminUserStatusInactive,
} from '../../../styles/ui';
import type { InfoCulturaDashboardStats, InfoCulturaUser } from '../../../api/infoculturaApi';
import { getLocaleText, useLocale } from '../../../i18n/locale';

type DashboardHighlight = {
  label: string;
  value: string | number;
  tone: string;
  icon: LucideIcon;
};

type DashboardAlert = {
  id: string;
  title: string;
  detail: string;
  href: string;
  level: string;
  is_read: boolean;
  created_at: string | null;
};

type DashboardAction = {
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
};

type DashboardAgendaEntry = {
  label: string;
  title: string;
  meta: string;
  date: string;
  href: string;
};

type DashboardPageProps = {
  currentUser: InfoCulturaUser | null;
  isLoadingUsers: boolean;
  dashboardStats: InfoCulturaDashboardStats | null;
  isLoadingDashboard: boolean;
  dashboardError: string;
  unreadNotifications: number;
  isLoadingNotifications: boolean;
  notificationError: string;
  dashboardHighlights: DashboardHighlight[];
  dashboardAlerts: DashboardAlert[];
  dashboardQuickActions: DashboardAction[];
  dashboardCards: Array<{ label: string; value: string | number }>;
  dashboardAgenda: DashboardAgendaEntry[];
  onOpenNotification: (notification: DashboardAlert) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (href: string) => void;
};
function DashboardPage({
  currentUser,
  isLoadingUsers,
  dashboardStats,
  isLoadingDashboard,
  dashboardError,
  unreadNotifications,
  isLoadingNotifications,
  notificationError,
  dashboardHighlights,
  dashboardAlerts,
  dashboardQuickActions,
  dashboardCards,
  dashboardAgenda,
  onOpenNotification,
  onMarkAllAsRead,
  onNavigate,
}: DashboardPageProps) {
  const { locale } = useLocale();
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dd8609] text-white">
                <LayoutDashboard className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">{getLocaleText(locale, 'Dashboard', 'Dashboard')}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {getLocaleText(locale, 'Vista inicial com alertas, agenda e atalhos operacionais.', 'Initial view with alerts, agenda and operational shortcuts.')}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {getLocaleText(locale, 'Sessão atual', 'Current Session')}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {currentUser?.name || (isLoadingUsers ? getLocaleText(locale, 'A carregar...', 'Loading...') : getLocaleText(locale, 'Sem dados', 'No data'))}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {currentUser ? `${currentUser.email} · ${currentUser.role}` : getLocaleText(locale, 'InfoCultura', 'InfoCultura')}
            </p>
            {currentUser ? (
              <span
                className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  currentUser.is_active ? adminUserStatusActive : adminUserStatusInactive
                }`}
              >
                {currentUser.is_active ? getLocaleText(locale, 'Ativo', 'Active') : getLocaleText(locale, 'Inativo', 'Inactive')}
              </span>
            ) : null}
          </div>
        </div>

        {isLoadingDashboard ? <p className="mt-4 text-sm text-slate-500">{getLocaleText(locale, 'A carregar métricas...', 'Loading metrics...')}</p> : null}
        {dashboardError ? <p className="mt-4 text-sm text-red-600">{dashboardError}</p> : null}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {dashboardHighlights.map((item) => {
          const Icon = item.icon;
          const toneClass =
            item.tone === 'amber'
              ? 'bg-amber-100 text-amber-700'
              : item.tone === 'blue'
                ? 'bg-sky-100 text-sky-700'
                : item.tone === 'rose'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-700';

          return (
            <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Alertas', 'Alerts')}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {unreadNotifications > 0
                  ? `${unreadNotifications} ${getLocaleText(locale, 'notificações', 'notifications')} por ler.`
                  : getLocaleText(locale, 'Itens que merecem atenção imediata.', 'Items that require immediate attention.')}
              </p>
            </div>
            <button
              type="button"
              className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-slate-100 px-3 text-slate-700"
              onClick={() => onNavigate('/infocultura/notificacoes')}
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>

          {isLoadingNotifications ? (
            <p className="mt-4 text-sm text-slate-500">{getLocaleText(locale, 'A carregar notificações...', 'Loading notifications...')}</p>
          ) : null}
          {notificationError ? <p className="mt-4 text-sm text-red-600">{notificationError}</p> : null}

          <div className="mt-6 space-y-3">
            {dashboardAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors hover:border-[#dd8609] hover:bg-white ${
                  alert.is_read
                    ? 'border-slate-200 bg-slate-50'
                    : alert.level === 'warning'
                      ? 'border-amber-200 bg-amber-50'
                      : alert.level === 'success'
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-sky-200 bg-sky-50'
                }`}
                onClick={() => onOpenNotification(alert)}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                  {!alert.is_read ? <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#dd8609]" /> : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{alert.detail}</p>
                {alert.created_at ? (
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    {formatAdminDateTime(alert.created_at)}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Ações Rápidas', 'Quick Actions')}</h3>
              <p className="mt-1 text-sm text-slate-600">{getLocaleText(locale, 'Atalhos para as operações mais frequentes.', 'Shortcuts for the most frequent operations.')}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            {dashboardQuickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => onNavigate(action.href)}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition-colors hover:border-[#dd8609] hover:bg-white"
                >
                  <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#dd8609] shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{action.label}</span>
                    <span className="mt-1 block text-sm text-slate-600">{action.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Fluxo Editorial', 'Editorial Flow')}</h3>
              <p className="mt-1 text-sm text-slate-600">{getLocaleText(locale, 'Estado atual das publicações e atividades.', 'Current status of publications and activities.')}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={adminStatCard}>
              <p className={adminStatValue}>{dashboardStats?.news_draft ?? 0}</p>
              <p className={adminStatLabel}>{getLocaleText(locale, 'Notícias em rascunho', 'News in draft')}</p>
            </div>
            <div className={adminStatCard}>
              <p className={adminStatValue}>{dashboardStats?.news_review ?? 0}</p>
              <p className={adminStatLabel}>{getLocaleText(locale, 'Notícias em revisão', 'News in review')}</p>
            </div>
            <div className={adminStatCard}>
              <p className={adminStatValue}>{dashboardStats?.events_draft ?? 0}</p>
              <p className={adminStatLabel}>{getLocaleText(locale, 'Eventos em rascunho', 'Events in draft')}</p>
            </div>
            <div className={adminStatCard}>
              <p className={adminStatValue}>{dashboardStats?.events_review ?? 0}</p>
              <p className={adminStatLabel}>{getLocaleText(locale, 'Eventos em revisão', 'Events in review')}</p>
            </div>
          </div>

          {dashboardCards.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dashboardCards.slice(0, 6).map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Agenda e Destaques', 'Agenda and Highlights')}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {getLocaleText(locale, 'Próximos pontos relevantes do panorama cultural.', 'Next relevant points in the cultural landscape.')}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <CalendarClock className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {dashboardAgenda.length > 0 ? (
              dashboardAgenda.map((entry) => (
                <button
                  key={`${entry.label}-${entry.title}`}
                  type="button"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition-colors hover:border-[#dd8609] hover:bg-white"
                  onClick={() => onNavigate(entry.href)}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#dd8609]">
                    {entry.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{entry.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{entry.meta}</p>
                  <p className="mt-3 text-sm font-medium text-slate-500">{entry.date}</p>
                </button>
              ))
            ) : (
              <p className={adminInfo}>{getLocaleText(locale, 'Ainda não existem registos suficientes para mostrar.', 'There are no sufficient records to display.')}</p>
            )}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" className={adminBtnSecondary} onClick={onMarkAllAsRead}>
          {getLocaleText(locale, 'Marcar tudo como lido', 'Mark all as read')}
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
