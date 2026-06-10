import { Bell } from 'lucide-react';

import type { InfoCulturaAdminNotification } from '../../../api/infoculturaApi';
import { getLocaleText, type Locale } from '../../../i18n/locale';
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminError,
  adminInfo,
  adminPanelCard,
} from '../../../styles/ui';
import AdminPageHero from '../components/AdminPageHero';
import { formatAdminDateTime } from '../utils';

type NotificationEntry = InfoCulturaAdminNotification & { isRead: boolean };

type NotificationsPageProps = {
  locale: Locale;
  notificationOverviewStats: Array<{ label: string; value: string | number }>;
  notifications: InfoCulturaAdminNotification[];
  latestNotifications: NotificationEntry[];
  isLoadingNotifications: boolean;
  notificationError: string;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onOpenNotification: (notification: InfoCulturaAdminNotification) => void;
};

function NotificationsPage({
  locale,
  notificationOverviewStats,
  notifications,
  latestNotifications,
  isLoadingNotifications,
  notificationError,
  onMarkAllAsRead,
  onMarkAsRead,
  onOpenNotification,
}: NotificationsPageProps) {
  return (
    <div className="space-y-6">
      <AdminPageHero
        icon={Bell}
        title={getLocaleText(locale, 'Centro de Notificações', 'Notification Center')}
        description={getLocaleText(locale, 'Alertas editoriais, operacionais e de agenda gerados a partir da atividade do sistema.', 'Editorial, operational and scheduling alerts generated from system activity.')}
        tone="amber"
        stats={notificationOverviewStats}
        actions={
          <button
            type="button"
            className={adminBtnSecondary}
            disabled={notifications.length === 0}
            onClick={onMarkAllAsRead}
          >
            {getLocaleText(locale, 'Marcar todas como lidas', 'Mark all as read')}
          </button>
        }
      />

      <section className={adminPanelCard}>
        {isLoadingNotifications ? (
          <p className={adminInfo}>{getLocaleText(locale, 'A carregar notificações...', 'Loading notifications...')}</p>
        ) : null}
        {notificationError ? <p className={adminError}>{notificationError}</p> : null}

        {!isLoadingNotifications && latestNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {getLocaleText(locale, 'Centro de notificações vazio', 'Notification center is empty')}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {getLocaleText(
                locale,
                'Ainda não existem alertas para mostrar. Quando houver atividade relevante no sistema, a informação aparece aqui.',
                'There are no alerts to show yet. When relevant activity happens in the system, the information will appear here.'
              )}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {getLocaleText(locale, 'Editorial', 'Editorial')}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {getLocaleText(
                    locale,
                    'Mudanças de estado, conteúdos em revisão e ações de publicação.',
                    'Status changes, content under review and publishing actions.'
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {getLocaleText(locale, 'Operacional', 'Operational')}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {getLocaleText(
                    locale,
                    'Erros, sincronizações, uploads e eventos administrativos do portal.',
                    'Errors, syncs, uploads and administrative portal events.'
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {getLocaleText(locale, 'Agenda', 'Schedule')}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {getLocaleText(
                    locale,
                    'Alertas ligados a sessões, eventos e tarefas com impacto na agenda.',
                    'Alerts related to sessions, events and tasks that affect the schedule.'
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {latestNotifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-2xl border p-5 shadow-sm ${
                notification.isRead
                  ? 'border-slate-200 bg-white'
                  : notification.level === 'warning'
                    ? 'border-amber-200 bg-amber-50'
                    : notification.level === 'success'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-sky-200 bg-sky-50'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{notification.title}</h3>
                    {!notification.isRead ? (
                      <span className="inline-flex items-center rounded-full bg-[#dd8609] px-2.5 py-1 text-xs font-semibold text-white">
                        {getLocaleText(locale, 'Nova', 'New')}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                      {notification.kind}
                    </span>
                  </div>
                  <p className="mt-3 leading-7 text-slate-700">{notification.message}</p>
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    {formatAdminDateTime(notification.created_at || '')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={adminBtnPrimary}
                    onClick={() => onOpenNotification(notification)}
                  >
                    {getLocaleText(locale, 'Abrir', 'Open')}
                  </button>
                  {!notification.isRead ? (
                    <button
                      type="button"
                      className={adminBtnSecondary}
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      {getLocaleText(locale, 'Marcar como lida', 'Mark as read')}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default NotificationsPage;
