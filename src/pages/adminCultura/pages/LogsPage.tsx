import { Activity, BadgeInfo, Clock3, FilterX, ScrollText, Search, ShieldAlert } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import AdminPageHero from '../components/AdminPageHero.js';
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminError,
  adminInfo,
  adminInput,
  adminLabel,
  adminPanelCard,
  adminStatCard,
  adminStatLabel,
  adminStatValue,
} from '../../../styles/ui.js';
import {
  fetchAdminClubs,
  fetchAdminActivityLogs,
  getStoredAccessToken,
  InfoCulturaActivityLog,
  InfoCulturaApiError,
  InfoCulturaClub,
} from '../../../api/infoculturaApi.js';
import { getLocaleText, useLocale } from '../../../i18n/locale';

const SOURCE_LABELS: Record<string, string> = {
  audit: 'Administração',
  editorial: 'Editorial',
};

const CONTENT_LABELS: Record<string, string> = {
  news: 'Notícias',
  club: 'Clubes',
  content: 'Conteúdos',
  category: 'Categorias',
  book: 'Livros',
  session: 'Sessões',
  event: 'Eventos',
  newsletter: 'Newsletters',
  newsletter_subscriber: 'Subscritores',
  user: 'Utilizadores',
  registration: 'Inscrições',
  image: 'Imagens',
};

function formatShortDateTime(value: string | null): string {
  if (!value) return 'Sem data';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getContentLabel(value: string): string {
  return CONTENT_LABELS[value] || value;
}

function getSourceLabel(value: string): string {
  return SOURCE_LABELS[value] || value;
}

function LogsPage() {
  const token = getStoredAccessToken();
  const [source, setSource] = useState<'all' | 'audit' | 'editorial'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [contentType, setContentType] = useState('all');
  const [action, setAction] = useState('all');
  const [clubId, setClubId] = useState('all');
  const [logs, setLogs] = useState<InfoCulturaActivityLog[]>([]);
  const [clubs, setClubs] = useState<InfoCulturaClub[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [error, setError] = useState('');
  const { locale } = useLocale();

  useEffect(() => {
    let active = true;

    async function loadClubs() {
      if (!token) return;

      setLoadingClubs(true);
      try {
        const response = await fetchAdminClubs(token);
        if (!active) return;
        setClubs(response);
      } catch {
        if (!active) return;
        setClubs([]);
      } finally {
        if (active) {
          setLoadingClubs(false);
        }
      }
    }

    void loadClubs();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      if (!token) return;

      setLoading(true);
      setError('');

      try {
        const response = await fetchAdminActivityLogs(token, {
          source: source === 'all' ? undefined : source,
          action: action === 'all' ? undefined : action,
          contentType: contentType === 'all' ? undefined : contentType,
          search,
          clubId: clubId !== 'all' && Number.isFinite(Number(clubId)) ? Number(clubId) : undefined,
          limit: 100,
        });
        if (!active) return;
        setLogs(response.items);
      } catch (caughtError) {
        if (!active) return;
        const message =
          caughtError instanceof InfoCulturaApiError
            ? caughtError.message
            : caughtError instanceof Error
              ? caughtError.message
              : 'Nao foi possivel carregar os logs.';
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadLogs();

    return () => {
      active = false;
    };
  }, [action, clubId, contentType, search, source, token]);

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  function handleResetFilters() {
    setSource('all');
    setSearchInput('');
    setSearch('');
    setContentType('all');
    setAction('all');
    setClubId('all');
  }

  const availableActions = useMemo(
    () =>
      Array.from(new Set(logs.map((item) => item.action).filter(Boolean))).sort((left, right) =>
        left.localeCompare(right)
      ),
    [logs]
  );

  const availableContentTypes = useMemo(
    () =>
      Array.from(new Set(logs.map((item) => item.content_type).filter(Boolean))).sort((left, right) =>
        getContentLabel(left).localeCompare(getContentLabel(right))
      ),
    [logs]
  );

  const stats = useMemo(
    () => ({
      total: logs.length,
      audit: logs.filter((item) => item.source === 'audit').length,
      editorial: logs.filter((item) => item.source === 'editorial').length,
      publicRegistrations: logs.filter((item) => item.content_type === 'registration').length,
    }),
    [logs]
  );

  return (
    <div className="space-y-6">
      <AdminPageHero
        icon={ScrollText}
        title={getLocaleText(locale, 'Logs', 'Logs')}
        description={getLocaleText(locale, 'Histórico centralizado das ações administrativas, editoriais e submissões públicas.', 'Centralized history of administrative, editorial and public submissions.')}
        tone="slate"
        stats={[
          { label: getLocaleText(locale, 'Entradas', 'Entries'), value: stats.total },
          { label: getLocaleText(locale, 'Administração', 'Administration'), value: stats.audit },
          { label: getLocaleText(locale, 'Editorial', 'Editorial'), value: stats.editorial },
          { label: getLocaleText(locale, 'Inscrições', 'Registrations'), value: stats.publicRegistrations },
        ]}
      />

      <section className={adminPanelCard}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Filtros', 'Filters')}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {getLocaleText(locale, 'Refina o histórico por origem, ação, conteúdo, clube e texto.', 'Refine history by source, action, content, club and text.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'audit', 'editorial'] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={
                  source === item
                    ? 'rounded-md border border-[#dd8609] bg-orange-50 px-4 py-2 text-sm font-semibold text-[#dd8609]'
                    : adminBtnSecondary
                }
                onClick={() => setSource(item)}
              >
                {item === 'all' ? getLocaleText(locale, 'Tudo', 'All') : getSourceLabel(item)}
              </button>
            ))}
          </div>
        </div>

        <form className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-5" onSubmit={handleApplyFilters}>
          <label className="block">
            <span className={adminLabel}>{getLocaleText(locale, 'Pesquisa', 'Search')}</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className={`${adminInput} mt-2`}
              placeholder={getLocaleText(locale, 'Resumo, utilizador ou conteúdo...', 'Summary, user or content...')}
            />
          </label>

          <label className="block">
            <span className={adminLabel}>{getLocaleText(locale, 'Tipo de conteúdo', 'Content type')}</span>
            <select
              value={contentType}
              onChange={(event) => setContentType(event.target.value)}
              className={`${adminInput} mt-2`}
            >
              <option value="all">{getLocaleText(locale, 'Todos', 'All')}</option>
              {availableContentTypes.map((item) => (
                <option key={item} value={item}>
                  {getContentLabel(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={adminLabel}>{getLocaleText(locale, 'Ação', 'Action')}</span>
            <select value={action} onChange={(event) => setAction(event.target.value)} className={`${adminInput} mt-2`}>
              <option value="all">{getLocaleText(locale, 'Todas', 'All')}</option>
              {availableActions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={adminLabel}>{getLocaleText(locale, 'Clube', 'Club')}</span>
            <select value={clubId} onChange={(event) => setClubId(event.target.value)} className={`${adminInput} mt-2`}>
              <option value="all">{getLocaleText(locale, 'Todos', 'All')}</option>
              {clubs.map((club) => (
                <option key={club.id} value={String(club.id)}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button type="submit" className={adminBtnPrimary}>
              <span className="inline-flex items-center gap-2">
                <Search className="h-4 w-4" />
                {getLocaleText(locale, 'Aplicar', 'Apply')}
              </span>
            </button>
            <button type="button" className={adminBtnSecondary} onClick={handleResetFilters}>
              <span className="inline-flex items-center gap-2">
                <FilterX className="h-4 w-4" />
                {getLocaleText(locale, 'Limpar', 'Reset')}
              </span>
            </button>
          </div>
        </form>

        {loading ? <p className="mt-4 text-sm text-slate-500">{getLocaleText(locale, 'A carregar logs...', 'Loading logs...')}</p> : null}
        {loadingClubs ? <p className="mt-2 text-sm text-slate-500">{getLocaleText(locale, 'A carregar clubes...', 'Loading clubs...')}</p> : null}
        {error ? <p className={`mt-4 ${adminError}`}>{error}</p> : null}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className={adminStatCard}>
          <BadgeInfo className="h-5 w-5 text-[#dd8609]" />
          <p className={`${adminStatValue} mt-3`}>{stats.total}</p>
          <p className={adminStatLabel}>{getLocaleText(locale, 'Total', 'Total')}</p>
        </article>
        <article className={adminStatCard}>
          <ShieldAlert className="h-5 w-5 text-[#dd8609]" />
          <p className={`${adminStatValue} mt-3`}>{stats.audit}</p>
          <p className={adminStatLabel}>{getLocaleText(locale, 'Administração', 'Administration')}</p>
        </article>
        <article className={adminStatCard}>
          <Activity className="h-5 w-5 text-[#dd8609]" />
          <p className={`${adminStatValue} mt-3`}>{stats.editorial}</p>
          <p className={adminStatLabel}>{getLocaleText(locale, 'Editorial', 'Editorial')}</p>
        </article>
        <article className={adminStatCard}>
          <Clock3 className="h-5 w-5 text-[#dd8609]" />
          <p className={`${adminStatValue} mt-3`}>{stats.publicRegistrations}</p>
          <p className={adminStatLabel}>{getLocaleText(locale, 'Inscrições', 'Registrations')}</p>
        </article>
      </section>

      <section className={adminPanelCard}>
        <h3 className="text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Atividade recente', 'Recent Activity')}</h3>
        <div className="mt-6 space-y-4">
          {logs.length > 0 ? (
            logs.map((item, index) => (
              <article key={`${item.source}-${item.content_type}-${item.object_id ?? index}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                        {getSourceLabel(item.source)}
                      </span>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#dd8609]">
                        {getContentLabel(item.content_type)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {item.action}
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-semibold text-slate-900">{item.summary}</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Por {item.actor_name}
                      {item.club_id ? ` · Clube #${item.club_id}` : ''}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-slate-500">
                    {formatShortDateTime(item.created_at)}
                  </p>
                </div>
                {item.metadata_json ? (
                  <pre className="mt-3 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-600">
                    {item.metadata_json}
                  </pre>
                ) : null}
              </article>
            ))
          ) : (
            <p className={adminInfo}>{getLocaleText(locale, 'Ainda não há logs para mostrar.', 'There are no logs to display.')}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default LogsPage;
