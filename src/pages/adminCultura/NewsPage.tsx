import { Dispatch, FormEvent, SetStateAction } from 'react';
import { Newspaper } from 'lucide-react';

import AdminPageHero from './components/AdminPageHero.js';
import { NewsFormState } from './types';
import { formatAdminDateTime, getWorkflowStatusLabel, normalizeWorkflowStatus } from './utils';
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
  adminHeaderRow,
  adminInfo,
  adminInput,
  adminLabel,
  adminList,
  adminListDesc,
  adminListHeader,
  adminListItem,
  adminListMeta,
  adminListTitle,
  adminListTools,
  adminListTop,
  adminListBadge,
  adminListCheckbox,
  adminPanelCard,
  adminPanelForm,
  adminTextarea,
  blockText,
  blockTitle,
} from '../../styles/ui';
import {
  InfoCulturaClub,
  InfoCulturaNews,
  InfoCulturaNewsStatus,
  resolveInfoCulturaAssetUrl,
} from '../../api/infoculturaApi';
import { getLocaleText, useLocale } from '../../i18n/locale';

type AdminHeroStat = { label: string; value: string | number };

type NewsPageProps = {
  canManageUsers: boolean;
  newsOverviewStats: AdminHeroStat[];
  showNewsForm: boolean;
  showNewsList: boolean;
  handleSaveNews: (event: FormEvent<HTMLFormElement>) => void;
  editingNewsId: number | null;
  newsForm: NewsFormState;
  setNewsForm: Dispatch<SetStateAction<NewsFormState>>;
  clubs: InfoCulturaClub[];
  isLoadingNewsStatuses: boolean;
  availableNewsStatuses: InfoCulturaNewsStatus[];
  newsFormError: string;
  isSavingNews: boolean;
  resetNewsForm: () => void;
  newsImageFileKey: number;
  isUploadingNewsImage: boolean;
  handleUploadNewsImage: (file: File | null) => void | Promise<void>;
  newsError: string;
  handleApplyNewsSearch: (event: FormEvent<HTMLFormElement>) => void;
  newsSearchInput: string;
  setNewsSearchInput: Dispatch<SetStateAction<string>>;
  setNewsSearch: Dispatch<SetStateAction<string>>;
  setNewsPage: Dispatch<SetStateAction<number>>;
  newsClubFilter: string;
  setNewsClubFilter: Dispatch<SetStateAction<string>>;
  newsStatusFilter: string;
  setNewsStatusFilter: Dispatch<SetStateAction<string>>;
  newsStatuses: InfoCulturaNewsStatus[];
  newsDateFrom: string;
  setNewsDateFrom: Dispatch<SetStateAction<string>>;
  newsDateTo: string;
  setNewsDateTo: Dispatch<SetStateAction<string>>;
  newsOrder: string;
  setNewsOrder: Dispatch<SetStateAction<string>>;
  selectedNewsIds: number[];
  setSelectedNewsIds: Dispatch<SetStateAction<number[]>>;
  sortedNews: InfoCulturaNews[];
  bulkNewsStatus: string;
  setBulkNewsStatus: Dispatch<SetStateAction<string>>;
  isApplyingBulkNews: boolean;
  handleApplyBulkNewsStatus: () => void | Promise<void>;
  isDeletingBulkNews: boolean;
  handleBulkDeleteNews: () => void | Promise<void>;
  deletingNewsId: number | null;
  changingNewsStatusId: number | null;
  handleToggleNewsActive: (id: number, shouldActivate: boolean) => void | Promise<void>;
  handleDeleteNews: (id: number) => void | Promise<void>;
  handleEditNews: (item: InfoCulturaNews) => void;
  newsTotal: number;
  newsPage: number;
  newsTotalPages: number;
  isLoadingNews: boolean;
  toggleSelectedId: (setter: Dispatch<SetStateAction<number[]>>, id: number) => void;
};

function NewsPage({
  canManageUsers,
  newsOverviewStats,
  showNewsForm,
  showNewsList,
  handleSaveNews,
  editingNewsId,
  newsForm,
  setNewsForm,
  clubs,
  isLoadingNewsStatuses,
  availableNewsStatuses,
  newsFormError,
  isSavingNews,
  resetNewsForm,
  newsImageFileKey,
  isUploadingNewsImage,
  handleUploadNewsImage,
  newsError,
  handleApplyNewsSearch,
  newsSearchInput,
  setNewsSearchInput,
  setNewsSearch,
  setNewsPage,
  newsClubFilter,
  setNewsClubFilter,
  newsStatusFilter,
  setNewsStatusFilter,
  newsStatuses,
  newsDateFrom,
  setNewsDateFrom,
  newsDateTo,
  setNewsDateTo,
  newsOrder,
  setNewsOrder,
  selectedNewsIds,
  setSelectedNewsIds,
  sortedNews,
  bulkNewsStatus,
  setBulkNewsStatus,
  isApplyingBulkNews,
  handleApplyBulkNewsStatus,
  isDeletingBulkNews,
  handleBulkDeleteNews,
  deletingNewsId,
  changingNewsStatusId,
  handleToggleNewsActive,
  handleDeleteNews,
  handleEditNews,
  newsTotal,
  newsPage,
  newsTotalPages,
  isLoadingNews,
  toggleSelectedId,
}: NewsPageProps) {
  const { locale } = useLocale();
  return (
    <div className="space-y-6">
      <AdminPageHero
        icon={Newspaper}
        title={getLocaleText(locale, 'Notícias', 'News')}
        description={getLocaleText(locale, 'Workflow editorial, publicação e acompanhamento das Notícias por clube.', 'Editorial workflow, publishing and monitoring of news by club.')}
        tone="blue"
        stats={newsOverviewStats}
      />

      {showNewsForm ? (
        <form id="news-form" onSubmit={handleSaveNews} className={`${adminPanelForm} max-w-none`}>
          <div className="border-b border-slate-100 pb-4">
            <h2 className={blockTitle}>{editingNewsId ? getLocaleText(locale, 'Editar Notícia', 'Edit News') : getLocaleText(locale, 'Nova Notícia', 'New News')}</h2>
            <p className={blockText}>{getLocaleText(locale, 'Publica novidades de cada clube e controla o respetivo estado.', 'Publish updates from each club and control their status.')}</p>
          </div>

          <div className={adminFormGridSpaced}>
            {canManageUsers ? (
              <div className={adminField}>
                <label className={adminLabel} htmlFor="news-club-id">
                  {getLocaleText(locale, 'Clube', 'Club')}
                </label>
                <select
                  id="news-club-id"
                  className={adminInput}
                  value={newsForm.club_id}
                  onChange={(event) =>
                    setNewsForm((prev) => ({ ...prev, club_id: event.target.value }))
                  }
                >
                  <option value="">{getLocaleText(locale, 'Seleciona um clube', 'Select a club')}</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className={adminField}>
              <label className={adminLabel} htmlFor="news-title">
                {getLocaleText(locale, 'Título', 'Title')}
              </label>
              <input
                id="news-title"
                className={adminInput}
                value={newsForm.title}
                onChange={(event) =>
                  setNewsForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>

            <div className={adminField}>
              <label className={adminLabel} htmlFor="news-status">
                {getLocaleText(locale, 'Estado', 'Status')}
              </label>
              <select
                id="news-status"
                className={adminInput}
                value={newsForm.news_status}
                onChange={(event) =>
                  setNewsForm((prev) => ({
                    ...prev,
                    news_status: normalizeWorkflowStatus(event.target.value),
                  }))
                }
              >
                {isLoadingNewsStatuses ? <option value="">{getLocaleText(locale, 'A carregar estados...', 'Loading statuses...')}</option> : null}
                {availableNewsStatuses.map((status) => (
                  <option key={status.id} value={status.name}>
                    {getWorkflowStatusLabel(status.name)}
                  </option>
                ))}
              </select>
              <p className={blockText}>
                {canManageUsers
                  ? getLocaleText(locale, 'O superadmin pode publicar ou arquivar diretamente.', 'The superadmin can publish or archive directly.')
                  : getLocaleText(locale, 'O club_admin trabalha em rascunho ou envia para revisão.', 'The club admin works in draft mode or sends items for review.')}
              </p>
            </div>

            <div className={adminField}>
              <label className={adminLabel} htmlFor="news-published-at">
                {getLocaleText(locale, 'Publicado em', 'Published at')}
              </label>
              <input
                id="news-published-at"
                type="datetime-local"
                className={adminInput}
                value={newsForm.published_at}
                onChange={(event) =>
                  setNewsForm((prev) => ({ ...prev, published_at: event.target.value }))
                }
              />
              <p className={blockText}>
                {getLocaleText(locale, 'Escolhe a data/hora de publicação. Para publicar imediatamente, usa "Publicar agora"; para agendar, escolhe um momento futuro e clica em "Agendar".', 'Choose the publication date/time. To publish immediately, use "Publish now"; to schedule, choose a future time and click "Schedule".')}
              </p>
            </div>
          </div>

          <div className={adminFieldSpaced}>
            <label className={adminLabel} htmlFor="news-summary">
              {getLocaleText(locale, 'Resumo', 'Summary')}
            </label>
            <textarea
              id="news-summary"
              rows={3}
              className={adminTextarea}
              value={newsForm.summary}
              onChange={(event) =>
                setNewsForm((prev) => ({ ...prev, summary: event.target.value }))
              }
            />
          </div>

          <div className={adminFieldSpaced}>
            <label className={adminLabel} htmlFor="news-image">
              {getLocaleText(locale, 'Imagem', 'Image')}
            </label>
            <input
              id="news-image"
              key={newsImageFileKey}
              type="file"
              accept="image/png, image/jpeg"
              className={adminInput}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                void handleUploadNewsImage(file);
              }}
            />
            <p className={blockText}>
              {isUploadingNewsImage
                ? getLocaleText(locale, 'A carregar imagem...', 'Uploading image...')
                : newsForm.image
                  ? getLocaleText(locale, 'Imagem carregada com sucesso.', 'Image uploaded successfully.')
                  : getLocaleText(locale, 'Seleciona uma imagem PNG ou JPG para a notícia.', 'Select a PNG or JPG image for the news item.')}
            </p>
            {newsForm.image ? (
              <img
                src={resolveInfoCulturaAssetUrl(newsForm.image)}
                alt={getLocaleText(locale, 'Preview da Notícia', 'News preview')}
                className="mt-3 h-40 w-full rounded-xl object-cover"
              />
            ) : null}
          </div>

          <div className={adminFieldSpaced}>
            <label className={adminLabel} htmlFor="news-content">
              {getLocaleText(locale, 'Conteúdo', 'Content')}
            </label>
            <textarea
              id="news-content"
              rows={6}
              className={adminTextarea}
              value={newsForm.content}
              onChange={(event) =>
                setNewsForm((prev) => ({ ...prev, content: event.target.value }))
              }
            />
          </div>

          {newsFormError ? <p className={adminError}>{newsFormError}</p> : null}

          <div className={adminActions}>
            <button type="submit" className={adminBtnPrimary} disabled={isSavingNews}>
              {isSavingNews ? getLocaleText(locale, 'A guardar...', 'Saving...') : editingNewsId ? getLocaleText(locale, 'Atualizar', 'Update') : getLocaleText(locale, 'Guardar', 'Save')}
            </button>
            <button
              type="submit"
              name="newsAction"
              value="publish_now"
              className={adminBtnSecondary}
              disabled={isSavingNews}
            >
              {getLocaleText(locale, 'Publicar agora', 'Publish now')}
            </button>
            <button
              type="submit"
              name="newsAction"
              value="schedule"
              className={adminBtnSecondary}
              disabled={isSavingNews}
            >
              {getLocaleText(locale, 'Agendar', 'Schedule')}
            </button>
            <button type="button" onClick={resetNewsForm} className={adminBtnSecondary}>
              {getLocaleText(locale, 'Limpar', 'Clear')}
            </button>
          </div>
        </form>
      ) : null}

      {showNewsList ? (
        <section id="news-list" className={adminPanelCard}>
          <div className={adminHeaderRow}>
            <div>
              <h2 className={blockTitle}>{getLocaleText(locale, 'Notícias registadas', 'Registered news')}</h2>
              <p className={blockText}>{getLocaleText(locale, 'Lista das Notícias criadas no InfoCultura.', 'List of news created in InfoCultura.')}</p>
            </div>
            {canManageUsers ? (
              <div className={adminField}>
                <label className={adminLabel} htmlFor="news-club-filter">
                  {getLocaleText(locale, 'Filtrar por clube', 'Filter by club')}
                </label>
                <select
                  id="news-club-filter"
                  className={adminInput}
                  value={newsClubFilter}
                  onChange={(event) => setNewsClubFilter(event.target.value)}
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
              <label className={adminLabel} htmlFor="news-status-filter">
                {getLocaleText(locale, 'Estado editorial', 'Editorial status')}
              </label>
              <select
                id="news-status-filter"
                className={adminInput}
                value={newsStatusFilter}
                onChange={(event) => setNewsStatusFilter(event.target.value)}
              >
                <option value="all">{getLocaleText(locale, 'Todos os estados', 'All statuses')}</option>
                {newsStatuses.map((status) => (
                  <option key={status.id} value={normalizeWorkflowStatus(status.name)}>
                    {getWorkflowStatusLabel(status.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {newsError ? <p className={adminError}>{newsError}</p> : null}

          <div className={`${adminFormGridSpaced} mt-6`}>
            <form onSubmit={handleApplyNewsSearch} className={adminPanelForm}>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="news-search">
                  {getLocaleText(locale, 'Pesquisar Notícias', 'Search News')}
                </label>
                <input
                  id="news-search"
                  className={adminInput}
                  value={newsSearchInput}
                  onChange={(event) => setNewsSearchInput(event.target.value)}
                  placeholder={getLocaleText(locale, 'Titulo, resumo, conteúdo ou clube', 'Title, summary, content or club')}
                />
              </div>
              <div className={adminActions}>
                <button type="submit" className={adminBtnPrimary}>
                  {getLocaleText(locale, 'Pesquisar', 'Search')}
                </button>
                <button
                  type="button"
                  className={adminBtnSecondary}
                  onClick={() => {
                    setNewsSearchInput('');
                    setNewsSearch('');
                    setNewsPage(1);
                  }}
                >
                  {getLocaleText(locale, 'Limpar', 'Clear')}
                </button>
              </div>
            </form>

          </div>

          <div className={adminFormGridSpaced}>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="news-date-from">
                {getLocaleText(locale, 'Criadas desde', 'Created from')}
              </label>
              <input
                id="news-date-from"
                type="date"
                className={adminInput}
                value={newsDateFrom}
                onChange={(event) => setNewsDateFrom(event.target.value)}
              />
            </div>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="news-date-to">
                {getLocaleText(locale, 'Criadas até', 'Created until')}
              </label>
              <input
                id="news-date-to"
                type="date"
                className={adminInput}
                value={newsDateTo}
                onChange={(event) => setNewsDateTo(event.target.value)}
              />
            </div>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="news-order">
                {getLocaleText(locale, 'Ordenar por', 'Sort by')}
              </label>
              <select
                id="news-order"
                className={adminInput}
                value={newsOrder}
                onChange={(event) => setNewsOrder(event.target.value)}
              >
                <option value="newest">{getLocaleText(locale, 'Mais recentes', 'Newest')}</option>
                <option value="oldest">{getLocaleText(locale, 'Mais antigas', 'Oldest')}</option>
                <option value="title_asc">{getLocaleText(locale, 'Titulo A-Z', 'Title A-Z')}</option>
                <option value="title_desc">{getLocaleText(locale, 'Titulo Z-A', 'Title Z-A')}</option>
                <option value="club_asc">{getLocaleText(locale, 'Clube A-Z', 'Club A-Z')}</option>
                <option value="club_desc">{getLocaleText(locale, 'Clube Z-A', 'Club Z-A')}</option>
                <option value="status_asc">{getLocaleText(locale, 'Estado A-Z', 'Status A-Z')}</option>
                <option value="status_desc">{getLocaleText(locale, 'Estado Z-A', 'Status Z-A')}</option>
              </select>
            </div>
          </div>

          <div className={adminActions}>
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={() =>
                setSelectedNewsIds(
                  selectedNewsIds.length === sortedNews.length
                    ? []
                    : sortedNews.map((item) => item.id)
                )
              }
              disabled={sortedNews.length === 0}
            >
              {selectedNewsIds.length === sortedNews.length && sortedNews.length > 0
                ? getLocaleText(locale, 'Limpar seleção', 'Clear selection')
                : getLocaleText(locale, 'Selecionar página', 'Select page')}
            </button>
            <select
              className={adminInput}
              value={bulkNewsStatus}
              onChange={(event) => setBulkNewsStatus(event.target.value)}
            >
              {availableNewsStatuses.map((status) => (
                <option key={status.id} value={normalizeWorkflowStatus(status.name)}>
                  {getWorkflowStatusLabel(status.name)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={adminBtnPrimary}
              disabled={selectedNewsIds.length === 0 || isApplyingBulkNews}
              onClick={() => void handleApplyBulkNewsStatus()}
            >
              {isApplyingBulkNews ? getLocaleText(locale, 'A aplicar...', 'Applying...') : getLocaleText(locale, 'Aplicar em lote', 'Apply in bulk')}
            </button>
            <button
              type="button"
              className={adminBtnDanger}
              disabled={selectedNewsIds.length === 0 || isDeletingBulkNews}
              onClick={() => void handleBulkDeleteNews()}
            >
              {isDeletingBulkNews ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar selecionadas', 'Delete selected')}
            </button>
          </div>

          <div className={adminList}>
            {isLoadingNews ? <p className={adminInfo}>{getLocaleText(locale, 'A carregar Notícias...', 'Loading news...')}</p> : null}
            {!isLoadingNews && sortedNews.length === 0 ? (
              <p className={adminInfo}>{getLocaleText(locale, 'Não existem Notícias para o filtro atual.', 'There is no news for the current filter.')}</p>
            ) : null}
            {sortedNews.map((item) => (
              <article key={item.id} className={adminListItem}>
                <div className={adminListTop}>
                  <div className={adminListHeader}>
                    <label className={adminListCheckbox}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#dd8609]"
                        checked={selectedNewsIds.includes(item.id)}
                        onChange={() => toggleSelectedId(setSelectedNewsIds, item.id)}
                      />
                      {getLocaleText(locale, 'Selecionar', 'Select')}
                    </label>

                    <h3 className={`${adminListTitle} break-words leading-snug`}>{item.title}</h3>
                    <p className={adminListMeta}>
                      <span className={adminListBadge}>{item.club_name}</span>
                      <span className="mx-2 text-slate-300">·</span>
                      {getWorkflowStatusLabel(item.news_status_name)} ·{' '}
                      {formatAdminDateTime(item.published_at || item.created_at)}
                    </p>
                  </div>

                  <div className={`${adminListTools} mt-0 shrink-0`}>
                    <button type="button" className={adminBtnEdit} onClick={() => handleEditNews(item)}>
                      {getLocaleText(locale, 'Editar', 'Edit')}
                    </button>
                    <button
                      type="button"
                      className={item.is_active ? adminBtnSecondary : adminBtnPrimary}
                      disabled={changingNewsStatusId === item.id}
                      onClick={() => void handleToggleNewsActive(item.id, !item.is_active)}
                    >
                      {changingNewsStatusId === item.id
                        ? getLocaleText(locale, 'A atualizar...', 'Updating...')
                        : item.is_active
                          ? getLocaleText(locale, 'Desativar', 'Deactivate')
                          : getLocaleText(locale, 'Ativar', 'Activate')}
                    </button>
                    <button
                      type="button"
                      className={adminBtnDanger}
                      disabled={deletingNewsId === item.id}
                      onClick={() => handleDeleteNews(item.id)}
                    >
                      {deletingNewsId === item.id ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar', 'Delete')}
                    </button>
                  </div>
                </div>

                <p className={`${adminListDesc} break-words`}>{item.summary}</p>
                {item.editorial_history && item.editorial_history.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {item.editorial_history.slice(0, 3).map((history, index) => (
                      <p key={`${item.id}-${index}`} className={adminListMeta}>
                        {history.actor_name} ·{' '}
                        {history.from_status
                          ? `${getWorkflowStatusLabel(history.from_status)} -> `
                          : ''}
                        {getWorkflowStatusLabel(history.to_status)} ·{' '}
                        {formatAdminDateTime(history.created_at || '')}
                      </p>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {!isLoadingNews ? (
            <div className={`${adminActions} mt-6`}>
              <p className={adminInfo}>
                {newsTotal} {getLocaleText(locale, 'Notícia(s)', 'News item(s)')} · {getLocaleText(locale, 'página', 'page')} {newsPage} {getLocaleText(locale, 'de', 'of')} {newsTotalPages || 1}
              </p>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={newsPage <= 1}
                onClick={() => setNewsPage((prev) => Math.max(1, prev - 1))}
              >
                {getLocaleText(locale, 'Anterior', 'Previous')}
              </button>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={newsTotalPages === 0 || newsPage >= newsTotalPages}
                onClick={() => setNewsPage((prev) => prev + 1)}
              >
                {getLocaleText(locale, 'Seguinte', 'Next')}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export default NewsPage;
