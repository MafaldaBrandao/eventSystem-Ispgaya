import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ClubRegistrationModal, {
  ClubRegistrationFormData
} from '../components/ui/ClubRegistrationModal';
import Footer from '../components/layout/Footer';
import HeaderNav from '../components/layout/HeaderNav';
import TopBar from '../components/layout/TopBar';
import {
  createEventRegistration,
  createSessionRegistration,
  downloadEventCalendar,
  downloadSessionCalendar,
  fetchPublicBookItem,
  fetchPublicEvents,
  fetchPublicEventItem,
  fetchPublicNews,
  fetchPublicNewsItem,
  fetchPublicSessionItem,
  InfoCulturaBook,
  InfoCulturaEvent,
  InfoCulturaNews,
  InfoCulturaSession,
  resolveInfoCulturaAssetUrl
} from '../api/infoculturaApi';
import {
  adminBtnPrimary,
  adminBtnSecondary,
  container,
  contentEmpty,
  contentSection,
  mainContent
} from '../styles/ui';
import { getLocaleText, useLocale } from '../i18n/locale.js';
import { buildGoogleMapsQuery } from '../utils/googleMaps.js';

type EntryKind = 'news' | 'session' | 'event' | 'book';

type CulturalEntryDetailProps = {
  kind: EntryKind;
};

function formatDate(value?: string | null, locale: 'pt' | 'en' = 'pt'): string {
  if (!value) return getLocaleText(locale, 'Sem data', 'No date');

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    dateStyle: 'medium',
    timeStyle: value.includes('T') ? 'short' : undefined
  }).format(date);
}

function formatDateRange(start?: string | null, end?: string | null, locale: 'pt' | 'en' = 'pt'): string {
  if (!start && !end) return getLocaleText(locale, 'Sem data', 'No date');
  if (!start) return formatDate(end, locale);
  if (!end) return formatDate(start, locale);

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
  }

  if (startDate.toDateString() === endDate.toDateString()) {
    const dayLabel = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', { dateStyle: 'medium' }).format(startDate);
    const startTime = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', { timeStyle: 'short' }).format(startDate);
    const endTime = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', { timeStyle: 'short' }).format(endDate);
    return `${dayLabel} · ${startTime} - ${endTime}`;
  }

  return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function estimateReadingTime(text: string, locale: 'pt' | 'en' = 'pt'): string {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 220));
  return locale === 'en'
    ? `${minutes} minute${minutes === 1 ? '' : 's'} of reading`
    : `${minutes} minuto${minutes === 1 ? '' : 's'} de leitura`;
}

function CulturalEntryDetail({ kind }: CulturalEntryDetailProps) {
  const { locale } = useLocale();
  const params = useParams();
  const itemId =
    kind === 'news'
      ? params.newsId
      : kind === 'session'
        ? params.sessionId
        : kind === 'event'
          ? params.eventId
          : params.bookId;
  const [entry, setEntry] = useState<
    InfoCulturaNews | InfoCulturaSession | InfoCulturaEvent | InfoCulturaBook | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationFeedback, setRegistrationFeedback] = useState('');
  const [isDownloadingCalendar, setIsDownloadingCalendar] = useState(false);
  const [relatedEvents, setRelatedEvents] = useState<InfoCulturaEvent[]>([]);
  const [relatedNews, setRelatedNews] = useState<InfoCulturaNews[]>([]);

  useEffect(() => {
    let active = true;

    async function loadEntry() {
      if (!itemId) {
        setLoadError(getLocaleText(locale, 'Conteudo invalido.', 'Invalid content.'));
        setIsLoading(false);
        return;
      }

      try {
        const parsedId = Number(itemId);
        const nextEntry =
          kind === 'news'
            ? await fetchPublicNewsItem(parsedId)
            : kind === 'session'
              ? await fetchPublicSessionItem(parsedId)
              : kind === 'event'
                ? await fetchPublicEventItem(parsedId)
                : await fetchPublicBookItem(parsedId);

        if (!active) return;
        setEntry(nextEntry);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : getLocaleText(locale, 'Não foi possivel carregar o detalhe.', 'Unable to load the details.');
        setLoadError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadEntry();

    return () => {
      active = false;
    };
  }, [itemId, kind, locale]);

  useEffect(() => {
    if (kind !== 'event' || !entry || !('id' in entry)) {
      setRelatedEvents([]);
      return;
    }

    let active = true;

    async function loadRelatedEvents() {
      try {
        const items = await fetchPublicEvents();
        if (!active) return;

        const currentEvent = entry as InfoCulturaEvent;
        const currentCategoryIds = new Set(currentEvent.category_ids);
        const nextItems = items
          .filter((item) => item.id !== currentEvent.id)
          .sort((left, right) => {
            const leftMatches = left.category_ids.filter((id) => currentCategoryIds.has(id)).length;
            const rightMatches = right.category_ids.filter((id) => currentCategoryIds.has(id)).length;
            if (rightMatches !== leftMatches) {
              return rightMatches - leftMatches;
            }

            const leftTime = new Date(left.start_date || left.event_date).getTime();
            const rightTime = new Date(right.start_date || right.event_date).getTime();
            return rightTime - leftTime;
          })
          .slice(0, 3);

        setRelatedEvents(nextItems);
      } catch {
        if (!active) return;
        setRelatedEvents([]);
      }
    }

    void loadRelatedEvents();

    return () => {
      active = false;
    };
  }, [entry, kind]);

  useEffect(() => {
    if (kind !== 'news' || !entry || !('id' in entry)) {
      setRelatedNews([]);
      return;
    }

    let active = true;

    async function loadRelatedNews() {
      try {
        const items = await fetchPublicNews();
        if (!active) return;

        const currentNews = entry as InfoCulturaNews;
        const nextItems = items
          .filter((item) => item.id !== currentNews.id)
          .sort((left, right) => {
            const clubWeightLeft = left.club_id === currentNews.club_id ? 1 : 0;
            const clubWeightRight = right.club_id === currentNews.club_id ? 1 : 0;
            if (clubWeightRight !== clubWeightLeft) {
              return clubWeightRight - clubWeightLeft;
            }

            const leftTime = new Date(left.published_at || left.created_at).getTime();
            const rightTime = new Date(right.published_at || right.created_at).getTime();
            return rightTime - leftTime;
          })
          .slice(0, 3);

        setRelatedNews(nextItems);
      } catch {
        if (!active) return;
        setRelatedNews([]);
      }
    }

    void loadRelatedNews();

    return () => {
      active = false;
    };
  }, [entry, kind]);

  const title = entry?.title || getLocaleText(locale, 'Detalhe', 'Detail');
  const image: string =
    entry && 'image' in entry
      ? String(entry.image || '')
      : entry && 'cover_image' in entry
        ? String(entry.cover_image || '')
        : '';
  const activityEntry =
    entry && (kind === 'event' || kind === 'session')
      ? (entry as InfoCulturaEvent | InfoCulturaSession)
      : null;
  const canRegister = Boolean(activityEntry?.enable_registrations);
  const registrationState = activityEntry?.registration_state || 'closed';
  const calendarLinks = useMemo(() => {
    if (!entry || (kind !== 'event' && kind !== 'session')) {
      return null;
    }

    return {
      google:
        'google_calendar_url' in entry && entry.google_calendar_url ? entry.google_calendar_url : '',
      outlook:
        'outlook_calendar_url' in entry && entry.outlook_calendar_url
          ? entry.outlook_calendar_url
          : ''
    };
  }, [entry, kind]);

  async function handleSubmitRegistration(data: ClubRegistrationFormData) {
    if (!entry || (kind !== 'event' && kind !== 'session')) return;

    setIsSubmittingRegistration(true);
    setRegistrationError('');

    try {
      const response =
        kind === 'event'
          ? await createEventRegistration(entry.id, data)
          : await createSessionRegistration(entry.id, data);
      setRegistrationFeedback(
        response.status === 'waitlist'
          ? getLocaleText(locale, 'Inscricao enviada. Ficaste em lista de espera e vais receber confirmacao por email.', 'Registration sent. You are on the waiting list and will receive confirmation by email.')
          : getLocaleText(locale, 'Inscricao enviada com sucesso. Vais receber confirmacao por email.', 'Registration sent successfully. You will receive confirmation by email.')
      );
      setIsRegistrationModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : getLocaleText(locale, 'Não foi possivel enviar a inscricao.', 'Unable to submit the registration.');
      setRegistrationError(message);
    } finally {
      setIsSubmittingRegistration(false);
    }
  }

  async function handleDownloadCalendar() {
    if (!entry || (kind !== 'event' && kind !== 'session')) return;

    setIsDownloadingCalendar(true);
    try {
      const blob =
        kind === 'event'
          ? await downloadEventCalendar(entry.id)
          : await downloadSessionCalendar(entry.id);
      downloadBlob(blob, `${kind === 'event' ? 'evento' : 'sessao'}-${entry.id}.ics`);
    } catch (error) {
      setRegistrationError(
        error instanceof Error ? error.message : getLocaleText(locale, 'Não foi possivel descarregar o calendario.', 'Unable to download the calendar.')
      );
    } finally {
      setIsDownloadingCalendar(false);
    }
  }

  const registrationSummary = activityEntry
    ? {
        confirmed: activityEntry.confirmed_registrations || 0,
        waitlist: activityEntry.waitlist_registrations || 0,
        remaining:
          activityEntry.remaining_slots === undefined ? null : activityEntry.remaining_slots
      }
    : null;

  const eventEntry = kind === 'event' && entry ? (entry as InfoCulturaEvent) : null;
  const sessionEntry = kind === 'session' && entry ? (entry as InfoCulturaSession) : null;
  const newsEntry = kind === 'news' && entry ? (entry as InfoCulturaNews) : null;
  const eventReadingTime = eventEntry ? estimateReadingTime(eventEntry.description || '', locale) : '';
  const sessionReadingTime = sessionEntry ? estimateReadingTime(sessionEntry.description || '', locale) : '';
  const newsReadingTime = newsEntry
    ? estimateReadingTime(`${newsEntry.summary || ''} ${newsEntry.content || ''}`, locale)
    : '';
  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : kind === 'event' && entry
        ? `/vida-academica/eventos/${entry.id}`
        : '#';
  const eventMapQuery = eventEntry ? buildGoogleMapsQuery(eventEntry.location, eventEntry.city) : '';

  return (
    <>
      <TopBar />
      <HeaderNav />
      <Breadcrumbs
        title={title}
        description={getLocaleText(locale, 'Detalhe publico do conteudo cultural.', 'Public detail of the cultural content.')}
        parentLabel={getLocaleText(locale, 'Laboratorio Cultural', 'Cultural Lab')}
        parentHref="/laboratorio-cultural"
        currentLabel={title}
        currentHref="#"
      />

      <main className={mainContent}>
        <section className={contentSection}>
          <div className={container}>
            {isLoading ? <p className={contentEmpty}>{getLocaleText(locale, 'A carregar detalhe...', 'Loading details...')}</p> : null}
            {loadError ? <p className={contentEmpty}>{loadError}</p> : null}

            {!isLoading && !loadError && eventEntry ? (
              <section className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-0">
                <Link
                  to="/vida-academica/eventos"
                  className="mt-6 flex items-center text-sm font-medium text-gray-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mt-0.5 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <span className="ml-2">{getLocaleText(locale, 'Voltar', 'Back')}</span>
                </Link>

                <article>
                  <div className="mt-4">
                    <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight lg:text-4xl lg:leading-snug">
                      {eventEntry.title}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 font-medium text-gray-500 md:gap-5 md:flex-nowrap">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="ml-2 capitalize">{formatDate(eventEntry.start_date, locale)}</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="ml-2">{eventReadingTime}</span>
                      </div>
                    </div>
                  </div>

                  {image ? (
                    <div className="my-8">
                      <img
                        className="aspect-[16/9] w-full rounded object-cover shadow-xl"
                        src={resolveInfoCulturaAssetUrl(image)}
                        alt={eventEntry.title}
                      />
                    </div>
                  ) : null}

                  <div className="max-w-none whitespace-pre-wrap text-slate-700">
                    <p>{eventEntry.description}</p>
                  </div>

                  {eventMapQuery ? (
                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="px-6 py-4">
                        <p className="text-sm font-semibold uppercase tracking-tight text-slate-500">
                          {getLocaleText(locale, 'Localização', 'Location')}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">{eventEntry.location || eventMapQuery}</h2>
                        {eventEntry.city ? <p className="mt-1 text-sm text-slate-600">{eventEntry.city}</p> : null}
                      </div>
                    </section>
                  ) : null}

                  {eventEntry.categories.length > 0 ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {eventEntry.categories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-block rounded-sm bg-orange-50 px-3 py-1.5 text-sm font-semibold tracking-wide text-orange-600"
                        >
                          #{category.name.toLowerCase().replace(/\s+/g, '')}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-start justify-between gap-4 lg:flex-nowrap">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-tight text-gray-500">
                        {getLocaleText(locale, 'Partilha', 'Share')}
                      </p>
                      <div className="mt-3 flex items-end gap-4">
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                          </svg>
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                          </svg>
                        </a>
                        <a
                          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {calendarLinks?.google ? (
                        <a href={calendarLinks.google} target="_blank" rel="noreferrer" className={adminBtnSecondary}>
                          {getLocaleText(locale, 'Google Calendar', 'Google Calendar')}
                        </a>
                      ) : null}
                      {calendarLinks?.outlook ? (
                        <a href={calendarLinks.outlook} target="_blank" rel="noreferrer" className={adminBtnSecondary}>
                          {getLocaleText(locale, 'Outlook', 'Outlook')}
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className={adminBtnSecondary}
                        onClick={() => void handleDownloadCalendar()}
                        disabled={isDownloadingCalendar}
                      >
                        {isDownloadingCalendar ? getLocaleText(locale, 'A descarregar...', 'Downloading...') : getLocaleText(locale, 'Descarregar .ics', 'Download .ics')}
                      </button>
                      {canRegister && registrationState !== 'closed' ? (
                        <button
                          type="button"
                          className={adminBtnPrimary}
                          onClick={() => {
                            setRegistrationFeedback('');
                            setRegistrationError('');
                            setIsRegistrationModalOpen(true);
                          }}
                        >
                          {registrationState === 'waitlist'
                            ? getLocaleText(locale, 'Entrar em lista de espera', 'Join waitlist')
                            : getLocaleText(locale, 'Inscrever-me', 'Register')}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {(kind === 'event' || kind === 'session') && registrationSummary ? (
                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-lg font-semibold text-slate-900">{getLocaleText(locale, 'Participação', 'Participation')}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {getLocaleText(locale, 'Confirmadas', 'Confirmed')}: {registrationSummary.confirmed} · {getLocaleText(locale, 'Lista de espera', 'Waiting list')}: {registrationSummary.waitlist}
                        {registrationSummary.remaining !== null ? ` · ${getLocaleText(locale, 'Vagas restantes', 'Remaining slots')}: ${registrationSummary.remaining}` : ''}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {getLocaleText(locale, 'Estado das inscrições', 'Registration status')}: {registrationState === 'open' ? getLocaleText(locale, 'Abertas', 'Open') : registrationState === 'waitlist' ? getLocaleText(locale, 'Lista de espera', 'Waiting list') : getLocaleText(locale, 'Encerradas', 'Closed')}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {getLocaleText(locale, 'Local', 'Location')}: {eventEntry.location || eventEntry.city || getLocaleText(locale, 'Local por definir', 'Location to be defined')}
                      </p>
                    </div>
                  ) : null}

                  {(kind === 'event' || kind === 'session') && registrationFeedback ? (
                    <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {registrationFeedback}
                    </p>
                  ) : null}

                  {relatedEvents.length > 0 ? (
                    <div className="mt-10">
                      <h3 className="font-heading text-2xl font-bold">{getLocaleText(locale, 'Relacionados', 'Related')}</h3>
                      <div className="mt-3 flex flex-wrap justify-between gap-5 md:flex-nowrap">
                        {relatedEvents.map((item) => (
                          <div key={item.id} className="basis-full md:basis-1/3">
                            <div className="overflow-hidden rounded-sm shadow-xl">
                              <Link to={`/vida-academica/eventos/${item.id}`}>
                                <img
                                  className="aspect-[16/9] w-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                                  src={resolveInfoCulturaAssetUrl(item.image)}
                                  alt={item.title}
                                />
                              </Link>
                            </div>
                            <h4 className="mt-4 text-xl font-bold hover:underline underline-offset-2">
                              <Link to={`/vida-academica/eventos/${item.id}`}>
                              {item.title.length > 52 ? `${item.title.slice(0, 52)}...` : item.title}
                              </Link>
                            </h4>
                            <time className="mt-2 inline-block text-sm font-medium capitalize text-gray-500" dateTime={item.start_date || item.event_date}>
                              {formatDate(item.start_date || item.event_date, locale)}
                            </time>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              </section>
            ) : null}

            {!isLoading && !loadError && sessionEntry ? (
              <section className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-0">
                <Link
                  to="/laboratorio-cultural"
                  className="mt-6 flex items-center text-sm font-medium text-gray-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mt-0.5 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <span className="ml-2">{getLocaleText(locale, 'Voltar', 'Back')}</span>
                </Link>

                <article>
                  <div className="mt-4">
                    <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight lg:text-4xl lg:leading-snug">
                      {sessionEntry.title}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 font-medium text-gray-500 md:gap-5 md:flex-nowrap">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="ml-2">{formatDateRange(sessionEntry.start_date, sessionEntry.end_date, locale)}</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="ml-2">{sessionReadingTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 max-w-none whitespace-pre-wrap text-slate-700">
                    <p>{sessionEntry.description}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {sessionEntry.club_name ? (
                      <span className="inline-block rounded-sm bg-orange-50 px-3 py-1.5 text-sm font-semibold tracking-wide text-orange-600">
                        #{sessionEntry.club_name.toLowerCase().replace(/\s+/g, '')}
                      </span>
                    ) : null}
                    <span className="inline-block rounded-sm bg-slate-100 px-3 py-1.5 text-sm font-semibold tracking-wide text-slate-600">
                      {sessionEntry.name}
                    </span>
                  </div>

                  {sessionEntry.location ? (
                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="px-6 py-4">
                        <p className="text-sm font-semibold uppercase tracking-tight text-slate-500">
                          {getLocaleText(locale, 'Localização', 'Location')}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">{sessionEntry.location}</h2>
                      </div>
                    </section>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-start justify-between gap-4 lg:flex-nowrap">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-tight text-gray-500">
                        {getLocaleText(locale, 'Partilha', 'Share')}
                      </p>
                      <div className="mt-3 flex items-end gap-4">
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                          </svg>
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                          </svg>
                        </a>
                        <a
                          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {calendarLinks?.google ? (
                        <a href={calendarLinks.google} target="_blank" rel="noreferrer" className={adminBtnSecondary}>
                          Google Calendar
                        </a>
                      ) : null}
                      {calendarLinks?.outlook ? (
                        <a href={calendarLinks.outlook} target="_blank" rel="noreferrer" className={adminBtnSecondary}>
                          Outlook
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className={adminBtnSecondary}
                        onClick={() => void handleDownloadCalendar()}
                        disabled={isDownloadingCalendar}
                      >
                        {isDownloadingCalendar ? getLocaleText(locale, 'A descarregar...', 'Downloading...') : getLocaleText(locale, 'Descarregar .ics', 'Download .ics')}
                      </button>
                      {canRegister && registrationState !== 'closed' ? (
                        <button
                          type="button"
                          className={adminBtnPrimary}
                          onClick={() => {
                            setRegistrationFeedback('');
                            setRegistrationError('');
                            setIsRegistrationModalOpen(true);
                          }}
                        >
                          {registrationState === 'waitlist'
                            ? getLocaleText(locale, 'Entrar em lista de espera', 'Join waitlist')
                            : getLocaleText(locale, 'Inscrever-me', 'Register')}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {registrationSummary ? (
                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-lg font-semibold text-slate-900">{getLocaleText(locale, 'Participação', 'Participation')}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {getLocaleText(locale, 'Confirmadas', 'Confirmed')}: {registrationSummary.confirmed} · {getLocaleText(locale, 'Lista de espera', 'Waiting list')}: {registrationSummary.waitlist}
                        {registrationSummary.remaining !== null ? ` · ${getLocaleText(locale, 'Vagas restantes', 'Remaining slots')}: ${registrationSummary.remaining}` : ''}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {getLocaleText(locale, 'Estado das inscrições', 'Registration status')}: {registrationState === 'open' ? getLocaleText(locale, 'Abertas', 'Open') : registrationState === 'waitlist' ? getLocaleText(locale, 'Lista de espera', 'Waiting list') : getLocaleText(locale, 'Encerradas', 'Closed')}
                      </p>
                      {sessionEntry.location ? (
                        <p className="mt-2 text-sm text-slate-600">
                          {getLocaleText(locale, 'Local', 'Location')}: {sessionEntry.location}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {registrationFeedback ? (
                    <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {registrationFeedback}
                    </p>
                  ) : null}
                </article>
              </section>
            ) : null}

            {!isLoading && !loadError && newsEntry ? (
              <section className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-0">
                <Link
                  to="/vida-academica/noticias"
                  className="mt-6 flex items-center text-sm font-medium text-gray-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mt-0.5 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <span className="ml-2">{getLocaleText(locale, 'Voltar', 'Back')}</span>
                </Link>

                <article>
                  <div className="mt-4">
                    <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight lg:text-4xl lg:leading-snug">
                      {newsEntry.title}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 font-medium text-gray-500 md:gap-5 md:flex-nowrap">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="ml-2 capitalize">{formatDate(newsEntry.published_at || newsEntry.created_at, locale)}</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="ml-2">{newsReadingTime}</span>
                      </div>
                    </div>
                  </div>

                  {image ? (
                    <div className="my-8">
                      <img
                        className="aspect-[16/9] w-full rounded object-cover shadow-xl"
                        src={resolveInfoCulturaAssetUrl(image)}
                        alt={newsEntry.title}
                      />
                    </div>
                  ) : null}

                  <div className="max-w-none whitespace-pre-wrap text-slate-700">
                    {newsEntry.summary ? <p className="mb-4">{newsEntry.summary}</p> : null}
                    <p>{newsEntry.content}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {newsEntry.club_name ? (
                      <span className="inline-block rounded-sm bg-orange-50 px-3 py-1.5 text-sm font-semibold tracking-wide text-orange-600">
                        #{newsEntry.club_name.toLowerCase().replace(/\s+/g, '')}
                      </span>
                    ) : null}
                    <span className="inline-block rounded-sm bg-slate-100 px-3 py-1.5 text-sm font-semibold tracking-wide text-slate-600">
                      {newsEntry.news_status_name}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-start justify-between gap-4 lg:flex-nowrap">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-tight text-gray-500">
                        {getLocaleText(locale, 'Partilha', 'Share')}
                      </p>
                      <div className="mt-3 flex items-end gap-4">
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                          </svg>
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                          </svg>
                        </a>
                        <a
                          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>

                  {relatedNews.length > 0 ? (
                    <div className="mt-10">
                      <h3 className="font-heading text-2xl font-bold">{getLocaleText(locale, 'Relacionados', 'Related')}</h3>
                      <div className="mt-3 flex flex-wrap justify-between gap-5 md:flex-nowrap">
                        {relatedNews.map((item) => (
                          <div key={item.id} className="basis-full md:basis-1/3">
                            <div className="overflow-hidden rounded-sm shadow-xl">
                              <Link to={`/vida-academica/noticias/${item.id}`}>
                                <img
                                  className="aspect-[16/9] w-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                                  src={resolveInfoCulturaAssetUrl(item.image)}
                                  alt={item.title}
                                />
                              </Link>
                            </div>
                            <h4 className="mt-4 text-xl font-bold hover:underline underline-offset-2">
                              <Link to={`/vida-academica/noticias/${item.id}`}>
                                {item.title.length > 52 ? `${item.title.slice(0, 52)}...` : item.title}
                              </Link>
                            </h4>
                            <time className="mt-2 inline-block text-sm font-medium capitalize text-gray-500" dateTime={item.published_at || item.created_at}>
                              {formatDate(item.published_at || item.created_at, locale)}
                            </time>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              </section>
            ) : null}

  
          </div>
        </section>
      </main>

      {(kind === 'event' || kind === 'session') && entry ? (
        <ClubRegistrationModal
          clubName={title}
          entityLabel={getLocaleText(locale, kind === 'event' ? 'evento' : 'sessao', kind === 'event' ? 'event' : 'session')}
          kickerLabel={getLocaleText(locale, kind === 'event' ? 'Evento' : 'Sessão', kind === 'event' ? 'Event' : 'Session')}
          helperText={
            kind === 'event'
              ? getLocaleText(locale, 'Preenche os teus dados para enviar a inscrição para este evento.', 'Fill in your details to send your registration for this event.')
              : getLocaleText(locale, 'Preenche os teus dados para enviar a inscrição para esta sessão.', 'Fill in your details to send your registration for this session.')
          }
          submitLabel={
            registrationState === 'waitlist'
              ? getLocaleText(locale, 'Entrar em espera', 'Join waitlist')
              : getLocaleText(locale, 'Enviar inscrição', 'Send registration')
          }
          isOpen={isRegistrationModalOpen}
          isSubmitting={isSubmittingRegistration}
          submitError={registrationError}
          onClose={() => {
            if (!isSubmittingRegistration) {
              setIsRegistrationModalOpen(false);
              setRegistrationError('');
            }
          }}
          onSubmit={handleSubmitRegistration}
        />
      ) : null}

      <Footer />
    </>
  );
}

export default CulturalEntryDetail;
