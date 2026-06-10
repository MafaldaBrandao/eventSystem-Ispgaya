import { Dispatch, FormEvent, SetStateAction } from 'react';
import { Inbox } from 'lucide-react';

import AdminPageHero from './components/AdminPageHero.js';
import { formatAdminDateTime } from './utils';
import {
  adminActions,
  adminBtnDanger,
  adminBtnEdit,
  adminBtnPrimary,
  adminBtnSecondary,
  adminError,
  adminField,
  adminFieldSpaced,
  adminFormGridSpaced,
  adminInfo,
  adminInput,
  adminLabel,
  adminListTools,
  adminPanelCard,
  adminStatCard,
  adminStatLabel,
  adminStatValue,
  adminStatsGrid,
  adminUserEmail,
  adminUserItem,
  adminUserList,
  adminUserMeta,
  adminUserName,
  adminUserStatus,
  adminUserStatusActive,
  adminUserStatusInactive,
  blockText,
  blockTitle,
} from '../../styles/ui';
import {
  InfoCulturaClub,
  InfoCulturaRegistration,
  InfoCulturaRegistrationStatus,
} from '../../api/infoculturaApi';
import { getLocaleText, useLocale } from '../../i18n/locale';

type AdminHeroStat = { label: string; value: string | number };

type RegistrationsPageProps = {
  registrationOverviewStats: AdminHeroStat[];
  registrationTotal: number;
  pendingRegistrations: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  canManageUsers: boolean;
  clubs: InfoCulturaClub[];
  registrationClubFilter: string;
  setRegistrationClubFilter: Dispatch<SetStateAction<string>>;
  registrationStatusFilter: string;
  setRegistrationStatusFilter: Dispatch<SetStateAction<string>>;
  isLoadingRegistrationStatuses: boolean;
  registrationStatuses: InfoCulturaRegistrationStatus[];
  registrationDateFrom: string;
  setRegistrationDateFrom: Dispatch<SetStateAction<string>>;
  registrationDateTo: string;
  setRegistrationDateTo: Dispatch<SetStateAction<string>>;
  handleRegistrationSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  registrationSearchInput: string;
  setRegistrationSearchInput: Dispatch<SetStateAction<string>>;
  setRegistrationSearch: Dispatch<SetStateAction<string>>;
  setRegistrationPage: Dispatch<SetStateAction<number>>;
  registrationError: string;
  registrationOrder: string;
  setRegistrationOrder: Dispatch<SetStateAction<string>>;
  selectedRegistrationIds: number[];
  setSelectedRegistrationIds: Dispatch<SetStateAction<number[]>>;
  bulkRegistrationStatus: string;
  setBulkRegistrationStatus: Dispatch<SetStateAction<string>>;
  isApplyingBulkRegistrations: boolean;
  handleApplyBulkRegistrationStatus: () => void | Promise<void>;
  isLoadingRegistrations: boolean;
  registrationPage: number;
  registrationTotalPages: number;
  registrations: InfoCulturaRegistration[];
  updatingRegistrationId: number | null;
  handleUpdateRegistrationStatus: (registrationId: number, status: string) => void | Promise<void>;
  toggleSelectedId: (setter: Dispatch<SetStateAction<number[]>>, id: number) => void;
};

function getRegistrationStatusBadge(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized === 'approved') {
    return `${adminUserStatus} ${adminUserStatusActive}`;
  }

  if (normalized === 'rejected' || normalized === 'cancelled') {
    return `${adminUserStatus} ${adminUserStatusInactive}`;
  }

  return `${adminUserStatus} bg-amber-100 text-amber-700`;
}

function RegistrationsPage({
  registrationOverviewStats,
  registrationTotal,
  pendingRegistrations,
  approvedRegistrations,
  rejectedRegistrations,
  canManageUsers,
  clubs,
  registrationClubFilter,
  setRegistrationClubFilter,
  registrationStatusFilter,
  setRegistrationStatusFilter,
  isLoadingRegistrationStatuses,
  registrationStatuses,
  registrationDateFrom,
  setRegistrationDateFrom,
  registrationDateTo,
  setRegistrationDateTo,
  handleRegistrationSearchSubmit,
  registrationSearchInput,
  setRegistrationSearchInput,
  setRegistrationSearch,
  setRegistrationPage,
  registrationError,
  registrationOrder,
  setRegistrationOrder,
  selectedRegistrationIds,
  setSelectedRegistrationIds,
  bulkRegistrationStatus,
  setBulkRegistrationStatus,
  isApplyingBulkRegistrations,
  handleApplyBulkRegistrationStatus,
  isLoadingRegistrations,
  registrationPage,
  registrationTotalPages,
  registrations,
  updatingRegistrationId,
  handleUpdateRegistrationStatus,
  toggleSelectedId,
}: RegistrationsPageProps) {
  const { locale } = useLocale();

  return (
    <div className="space-y-6">
      <AdminPageHero
        icon={Inbox}
        title={getLocaleText(locale, 'Inscrições', 'Registrations')}
        description={getLocaleText(locale, 'Consulta, triagem e validação dos pedidos submetidos pelos clubes.', 'Review, triage and validate requests submitted by clubs.')}
        tone="rose"
        stats={registrationOverviewStats}
      />

      <section className={adminPanelCard}>
        <h2 className={blockTitle}>{getLocaleText(locale, 'Inscrições', 'Registrations')}</h2>
        <p className={blockText}>
          {getLocaleText(locale, 'Consulta os pedidos submetidos pelos clubes e atualiza o respetivo estado.', 'Review club submissions and update their status.')}
        </p>

        <div className={adminStatsGrid}>
          <div className={adminStatCard}>
            <p className={adminStatValue}>{registrationTotal}</p>
            <p className={adminStatLabel}>{getLocaleText(locale, 'Total filtrado', 'Filtered total')}</p>
          </div>
          <div className={adminStatCard}>
            <p className={adminStatValue}>{pendingRegistrations}</p>
            <p className={adminStatLabel}>{getLocaleText(locale, 'Pendentes na página', 'Pending on page')}</p>
          </div>
          <div className={adminStatCard}>
            <p className={adminStatValue}>{approvedRegistrations}</p>
            <p className={adminStatLabel}>{getLocaleText(locale, 'Aprovadas na página', 'Approved on page')}</p>
          </div>
          <div className={adminStatCard}>
            <p className={adminStatValue}>{rejectedRegistrations}</p>
            <p className={adminStatLabel}>{getLocaleText(locale, 'Rejeitadas na página', 'Rejected on page')}</p>
          </div>
        </div>

        <div className={adminFormGridSpaced}>
          {canManageUsers ? (
            <div className={adminField}>
              <label className={adminLabel} htmlFor="registration-club-filter">
                {getLocaleText(locale, 'Clube', 'Club')}
              </label>
              <select
                id="registration-club-filter"
                className={adminInput}
                value={registrationClubFilter}
                onChange={(event) => {
                  setRegistrationClubFilter(event.target.value);
                  setRegistrationPage(1);
                }}
              >
                <option value="all">{getLocaleText(locale, 'Todos os clubes', 'All clubs')}</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className={adminField}>
            <label className={adminLabel} htmlFor="registration-status-filter">
              {getLocaleText(locale, 'Estado', 'Status')}
            </label>
            <select
              id="registration-status-filter"
              className={adminInput}
              value={registrationStatusFilter}
              onChange={(event) => {
                setRegistrationStatusFilter(event.target.value);
                setRegistrationPage(1);
              }}
            >
              <option value="all">{getLocaleText(locale, 'Todos', 'All')}</option>
              {isLoadingRegistrationStatuses ? <option value="">{getLocaleText(locale, 'A carregar estados...', 'Loading statuses...')}</option> : null}
              {registrationStatuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
          <div className={adminField}>
            <label className={adminLabel} htmlFor="registration-date-from">
              {getLocaleText(locale, 'Submetidas desde', 'Submitted from')}
            </label>
            <input
              id="registration-date-from"
              type="date"
              className={adminInput}
              value={registrationDateFrom}
              onChange={(event) => setRegistrationDateFrom(event.target.value)}
            />
          </div>
          <div className={adminField}>
            <label className={adminLabel} htmlFor="registration-date-to">
              {getLocaleText(locale, 'Submetidas até', 'Submitted until')}
            </label>
            <input
              id="registration-date-to"
              type="date"
              className={adminInput}
              value={registrationDateTo}
              onChange={(event) => setRegistrationDateTo(event.target.value)}
            />
          </div>
        </div>

        <form onSubmit={handleRegistrationSearchSubmit} className={adminFieldSpaced}>
          <label className={adminLabel} htmlFor="registration-search">
            {getLocaleText(locale, 'Pesquisar por nome ou email', 'Search by name or email')}
          </label>
          <div className={adminActions}>
            <input
              id="registration-search"
              className={adminInput}
              value={registrationSearchInput}
              onChange={(event) => setRegistrationSearchInput(event.target.value)}
              placeholder={getLocaleText(locale, 'Ex.: maria ou maria@email.pt', 'E.g. maria or maria@email.pt')}
            />
            <button type="submit" className={adminBtnPrimary}>
              {getLocaleText(locale, 'Pesquisar', 'Search')}
            </button>
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={() => {
                setRegistrationSearchInput('');
                setRegistrationSearch('');
                setRegistrationPage(1);
              }}
            >
              {getLocaleText(locale, 'Limpar', 'Clear')}
            </button>
          </div>
        </form>

        {registrationError ? <p className={adminError}>{registrationError}</p> : null}

        <div className={adminActions}>
          <select
            className={adminInput}
            value={registrationOrder}
            onChange={(event) => setRegistrationOrder(event.target.value)}
          >
            <option value="newest">{getLocaleText(locale, 'Mais recentes', 'Newest')}</option>
            <option value="oldest">{getLocaleText(locale, 'Mais antigas', 'Oldest')}</option>
            <option value="name_asc">{getLocaleText(locale, 'Nome A-Z', 'Name A-Z')}</option>
            <option value="name_desc">{getLocaleText(locale, 'Nome Z-A', 'Name Z-A')}</option>
            <option value="email_asc">{getLocaleText(locale, 'Email A-Z', 'Email A-Z')}</option>
            <option value="email_desc">{getLocaleText(locale, 'Email Z-A', 'Email Z-A')}</option>
            <option value="club_asc">{getLocaleText(locale, 'Clube A-Z', 'Club A-Z')}</option>
            <option value="club_desc">{getLocaleText(locale, 'Clube Z-A', 'Club Z-A')}</option>
            <option value="status_asc">{getLocaleText(locale, 'Estado A-Z', 'Status A-Z')}</option>
            <option value="status_desc">{getLocaleText(locale, 'Estado Z-A', 'Status Z-A')}</option>
          </select>
          <button
            type="button"
            className={adminBtnSecondary}
            onClick={() =>
              setSelectedRegistrationIds(
                selectedRegistrationIds.length === registrations.length
                  ? []
                  : registrations.map((item) => item.id)
              )
            }
            disabled={registrations.length === 0}
          >
            {selectedRegistrationIds.length === registrations.length && registrations.length > 0
              ? getLocaleText(locale, 'Limpar seleção', 'Clear selection')
              : getLocaleText(locale, 'Selecionar página', 'Select page')}
          </button>
          <select
            className={adminInput}
            value={bulkRegistrationStatus}
            onChange={(event) => setBulkRegistrationStatus(event.target.value)}
          >
            {registrationStatuses.map((status) => (
              <option key={status.id} value={status.name}>
                {status.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={adminBtnPrimary}
            disabled={selectedRegistrationIds.length === 0 || isApplyingBulkRegistrations}
            onClick={() => void handleApplyBulkRegistrationStatus()}
          >
            {isApplyingBulkRegistrations ? getLocaleText(locale, 'A aplicar...', 'Applying...') : getLocaleText(locale, 'Aplicar em lote', 'Apply in bulk')}
          </button>
        </div>

        {!isLoadingRegistrations ? (
          <div className={adminActions}>
            <p className={blockText}>
              {getLocaleText(locale, 'página', 'page')} {registrationPage}
              {registrationTotalPages > 0 ? ` ${getLocaleText(locale, 'de', 'of')} ${registrationTotalPages}` : ''} ·{' '}
              {registrationTotal} {getLocaleText(locale, registrationTotal === 1 ? 'resultado' : 'resultados', registrationTotal === 1 ? 'result' : 'results')}
            </p>
            <div className={adminActions}>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={registrationPage <= 1}
                onClick={() => setRegistrationPage((prev) => Math.max(1, prev - 1))}
              >
                {getLocaleText(locale, 'Anterior', 'Previous')}
              </button>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={registrationTotalPages === 0 || registrationPage >= registrationTotalPages}
                onClick={() =>
                  setRegistrationPage((prev) =>
                    registrationTotalPages === 0
                      ? prev
                      : Math.min(registrationTotalPages, prev + 1)
                  )
                }
              >
                {getLocaleText(locale, 'Seguinte', 'Next')}
              </button>
            </div>
          </div>
        ) : null}

        <div className={adminUserList}>
          {isLoadingRegistrations ? <p className={adminInfo}>{getLocaleText(locale, 'A carregar inscrições...', 'Loading registrations...')}</p> : null}
          {!isLoadingRegistrations && registrations.length === 0 ? (
            <p className={adminInfo}>{getLocaleText(locale, 'Não existem inscrições para os filtros atuais.', 'There are no registrations for the current filters.')}</p>
          ) : null}
          {registrations.map((registration) => (
            <article key={registration.id} className={adminUserItem}>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedRegistrationIds.includes(registration.id)}
                    onChange={() => toggleSelectedId(setSelectedRegistrationIds, registration.id)}
                  />
                  {getLocaleText(locale, 'Selecionar', 'Select')}
                </label>
                <h3 className={adminUserName}>{registration.name}</h3>
                <p className={adminUserEmail}>{registration.email}</p>
                <p className={adminUserMeta}>
                  {registration.registration_type === 'event'
                    ? getLocaleText(locale, 'Evento', 'Event')
                    : registration.registration_type === 'session'
                      ? getLocaleText(locale, 'Sessão', 'Session')
                      : getLocaleText(locale, 'Clube', 'Club')}{' '}
                  · {registration.target_title || registration.club_name} ·{' '}
                  {formatAdminDateTime(registration.created_at)}
                </p>
                {registration.phone ? (
                  <p className={adminUserMeta}>{getLocaleText(locale, 'Telefone:', 'Phone:')} {registration.phone}</p>
                ) : null}
                <p className={adminUserMeta}>
                  {registration.message || getLocaleText(locale, 'Sem mensagem adicional.', 'No additional message.')}
                </p>
              </div>
              <div className={adminListTools}>
                <span className={getRegistrationStatusBadge(registration.status)}>
                  {registration.status}
                </span>
                <button
                  type="button"
                  className={adminBtnEdit}
                  disabled={
                    updatingRegistrationId === registration.id ||
                    registration.status === 'approved'
                  }
                  onClick={() => handleUpdateRegistrationStatus(registration.id, 'approved')}
                >
                  {updatingRegistrationId === registration.id ? getLocaleText(locale, 'A atualizar...', 'Updating...') : getLocaleText(locale, 'Aprovar', 'Approve')}
                </button>
                <button
                  type="button"
                  className={adminBtnDanger}
                  disabled={
                    updatingRegistrationId === registration.id ||
                    registration.status === 'rejected'
                  }
                  onClick={() => handleUpdateRegistrationStatus(registration.id, 'rejected')}
                >
                  {updatingRegistrationId === registration.id ? getLocaleText(locale, 'A atualizar...', 'Updating...') : getLocaleText(locale, 'Rejeitar', 'Reject')}
                </button>
                <button
                  type="button"
                  className={adminBtnSecondary}
                  disabled={
                    updatingRegistrationId === registration.id ||
                    registration.status === 'pending'
                  }
                  onClick={() => handleUpdateRegistrationStatus(registration.id, 'pending')}
                >
                  {updatingRegistrationId === registration.id ? getLocaleText(locale, 'A atualizar...', 'Updating...') : getLocaleText(locale, 'Pendente', 'Pending')}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default RegistrationsPage;
