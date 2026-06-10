import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Footer from '../components/layout/Footer';
import HeaderNav from '../components/layout/HeaderNav';
import BestBooksSection from '../components/sections/BestBooksSection.js';
import LaboratorioEventsSection from '../components/sections/LaboratorioEventsSection';
import EventbriteEventsSection from '../components/sections/EventbriteEventsSection';
import PhotoCarousel from '../components/ui/PhotoCarousel';
import NewsHighlightsSection, {
  type NewsHighlightItem
} from '../components/ui/NewsHighlightsSection';
import TopBar from '../components/layout/TopBar';
import {
  fetchPublicBooks,
  fetchPublicClubs,
  fetchPublicEvents,
  fetchPublicNews,
  fetchPublicPhotos,
  fetchPublicSessions,
  InfoCulturaBook,
  InfoCulturaClub,
  InfoCulturaEvent,
  InfoCulturaNews,
  InfoCulturaPhoto,
  InfoCulturaSession,
  resolveInfoCulturaAssetUrl
} from '../api/infoculturaApi';
import {
  adminBtnSecondary,
  blockText,
  blockTitle,
  container,
  contentEmpty,
  contentSection,
  labResearchLink,
  labResearchSubcard,
  labResearchSubtext,
  labResearchSubtitle,
  mainContent
} from '../styles/ui';
import { getLocaleText, useLocale } from '../i18n/locale.js';

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase()
    .trim();
}

function getClubHref(club: InfoCulturaClub): string {
  const label = normalizeLabel(club.name);

  if (label.includes('tuna')) {
    return '/laboratorio-cultural/tuna';
  }

  if (label.includes('leitura')) {
    return '/laboratorio-cultural/clube-leitura';
  }

  if (label.includes('teatro')) {
    return '/laboratorio-cultural/teatro';
  }

  return `/laboratorio-cultural/clubes/${club.id}`;
}

function matchesSearch(query: string, ...values: Array<string | undefined | null>): boolean {
  if (!query) return true;

  return values.some((value) => normalizeLabel(value || '').includes(query));
}

function getClubNameById(clubs: InfoCulturaClub[], clubId?: number | null): string {
  if (!clubId) return '';
  return clubs.find((club) => club.id === clubId)?.name || '';
}

function ResultCard({
  title,
  meta,
  description,
  href,
  image,
  status,
  locale
}: {
  title: string;
  meta: string;
  description: string;
  href: string;
  image?: string;
  status?: string;
  locale: 'pt' | 'en';
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {image ? (
        <img
          src={resolveInfoCulturaAssetUrl(image)}
          alt={title}
          className="mb-4 h-40 w-full rounded-xl object-cover"
        />
      ) : null}
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {status ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {status}
          </span>
        ) : null}
      </div>
      <p className="mb-2 text-sm text-slate-500">{meta}</p>
      <p className="mb-4 text-sm leading-6 text-slate-700">{description}</p>
      <Link to={href} className={labResearchLink}>
        {getLocaleText(locale, 'Ver detalhe', 'View details')}
      </Link>
    </article>
  );
}

function LaboratorioCultural() {
  const { locale } = useLocale();
  const [clubs, setClubs] = useState<InfoCulturaClub[]>([]);
  const [newsItems, setNewsItems] = useState<InfoCulturaNews[]>([]);
  const [books, setBooks] = useState<InfoCulturaBook[]>([]);
  const [sessions, setSessions] = useState<InfoCulturaSession[]>([]);
  const [events, setEvents] = useState<InfoCulturaEvent[]>([]);
  const [photos, setPhotos] = useState<InfoCulturaPhoto[]>([]);
  const [searchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [nextClubs, nextNews, nextBooks, nextSessions, nextEvents, nextPhotos] =
          await Promise.all([
          fetchPublicClubs(),
          fetchPublicNews(),
          fetchPublicBooks(),
          fetchPublicSessions(),
          fetchPublicEvents(),
          fetchPublicPhotos()
          ]);

        if (!active) return;
        setClubs(nextClubs);
        setNewsItems(nextNews);
        setBooks(nextBooks);
        setSessions(nextSessions);
        setEvents(nextEvents);
        setPhotos(nextPhotos);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error
            ? error.message
            : getLocaleText(locale, 'Não foi possivel carregar o laboratorio.', 'Unable to load the laboratory.');
        setLoadError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [locale]);

  const normalizedQuery = useMemo(() => normalizeLabel(searchQuery), [searchQuery]);
  const filteredClubs = useMemo(
    () =>
      clubs.filter((club) =>
        matchesSearch(normalizedQuery, club.name, club.description, club.mission)
      ),
    [clubs, normalizedQuery]
  );
  const filteredNews = useMemo(
    () =>
      newsItems.filter((item) =>
        matchesSearch(
          normalizedQuery,
          item.title,
          item.summary,
          item.content,
          item.club_name
        )
      ),
    [newsItems, normalizedQuery]
  );
  const filteredBooks = useMemo(
    () =>
      books.filter((item) =>
        matchesSearch(
          normalizedQuery,
          item.title,
          item.author,
          item.summary,
          item.publisher,
          item.club_name
        )
      ),
    [books, normalizedQuery]
  );
  const filteredSessions = useMemo(
    () =>
      sessions.filter((item) =>
        matchesSearch(
          normalizedQuery,
          item.name,
          item.title,
          item.description,
          item.club_name
        )
      ),
    [sessions, normalizedQuery]
  );
  const filteredEvents = useMemo(
    () =>
      events.filter((item) =>
        matchesSearch(
          normalizedQuery,
          item.title,
          item.description,
          item.city,
          item.location,
          getClubNameById(clubs, item.club_id)
        )
      ),
    [events, clubs, normalizedQuery]
  );
  const homepageStyleNews = useMemo<NewsHighlightItem[]>(
    () =>
      [...newsItems]
        .sort((left, right) => {
          const leftTime = new Date(left.published_at || left.created_at).getTime();
          const rightTime = new Date(right.published_at || right.created_at).getTime();
          return rightTime - leftTime;
        })
        .slice(0, 3)
        .map((item) => ({
          title: item.title,
          href: `/vida-academica/noticias/${item.id}`,
          internal: true,
          excerpt: item.summary,
          image: resolveInfoCulturaAssetUrl(item.image),
          imageAlt: item.title,
          publishedAt: item.published_at || item.created_at,
          publishedLabel: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }).format(new Date(item.published_at || item.created_at)),
          tags: item.club_name
            ? [
                {
                  label: `#${normalizeLabel(item.club_name).replace(/\s+/g, '')}`,
                  href: '/vida-academica/noticias'
                }
              ]
            : []
        })),
    [newsItems]
  );
  const homepageStyleEvents = useMemo<NewsHighlightItem[]>(
    () =>
      [...events]
        .sort((left, right) => {
          const leftTime = new Date(left.start_date || left.event_date).getTime();
          const rightTime = new Date(right.start_date || right.event_date).getTime();
          return rightTime - leftTime;
        })
        .slice(0, 3)
        .map((item) => ({
          title: item.title,
          href: `/vida-academica/eventos/${item.id}`,
          internal: true,
          excerpt: item.description,
          image: resolveInfoCulturaAssetUrl(item.image),
          imageAlt: item.title,
          publishedAt: item.start_date || item.event_date,
          publishedLabel: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }).format(new Date(item.start_date || item.event_date)),
          tags: item.categories.map((category) => ({
            label: `#${normalizeLabel(category.name).replace(/\s+/g, '')}`,
            href: '/vida-academica/eventos'
          }))
        })),
    [events]
  );
  const carouselItems = useMemo(() => {
    const validSections = new Set([
      'laboratoriocultural',
      'laboratoriocultura',
    ]);

    return photos
      .filter((photo) => validSections.has(normalizeLabel(photo.section)))
      .sort((left, right) => left.display_order - right.display_order)
      .map((photo) => ({
        id: photo.id,
        title: photo.title,
        caption: photo.caption,
        image: photo.image,
        alt_text: photo.alt_text,
      }));
  }, [photos]);

  const hasSearch = normalizedQuery.length > 0;
  const totalResults =
    filteredClubs.length +
    filteredNews.length +
    filteredBooks.length +
    filteredSessions.length +
    filteredEvents.length;

  return (
    <>
      <TopBar />
      <HeaderNav />
      <Breadcrumbs
        title={getLocaleText(locale, 'Laboratório Cultural', 'Cultural Laboratory')}
        description={getLocaleText(
          locale,
          'O Laboratório Cultural é um espaço vivo onde a criatividade ganha forma e a cultura se torna experiência.',
          'The Cultural Laboratory is a living space where creativity takes shape and culture becomes an experience.'
        )}
        parentLabel={getLocaleText(locale, 'Início', 'Home')}
        parentHref="/"
        currentLabel={getLocaleText(locale, 'Laboratório Cultural', 'Cultural Laboratory')}
        currentHref="/laboratorio-cultural"
      />

      <main className={mainContent}>
        <section className={contentSection}>
	          <div className={`${container} px-5 sm:px-8 lg:px-10 xl:px-12`}>
	            <div className="mx-auto max-w-7xl space-y-14 lg:space-y-16">
	              <article className="max-w-5xl py-2 lg:py-4">
	                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dd8609]">
	                  {getLocaleText(locale, 'Visão Cultural', 'Cultural Vision')}
	                </p>
	                <h3 className={`${blockTitle} mt-4 max-w-3xl`}>
	                  {getLocaleText(locale, 'Missão e Objetivos', 'Mission and Goals')}
	                </h3>
	                <p className={`${blockText} mt-4 max-w-4xl text-base leading-8 lg:text-lg`}>
	                  {getLocaleText(
                    locale,
                    'O Laboratório Cultural existe para aproximar cultura, comunidade académica e participação. Esta entrada apresenta de forma clara a missão do espaço, os seus objetivos e o enquadramento necessário para perceber rapidamente o propósito do Laboratório Cultural sem procurar essa informação no meio do resto do conteúdo.',
                    'The Cultural Laboratory exists to bring culture, the academic community and participation closer together. This entry clearly presents the mission of the space, its goals and the context needed to quickly understand the purpose of the Cultural Laboratory without searching for that information elsewhere in the content.'
                  )}
                </p>

	                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <Link to="/laboratorio-cultural/roadmap" className={adminBtnSecondary}>
                    {getLocaleText(locale, 'Abrir página', 'Open page')}
                  </Link>
                  <span className="text-sm text-slate-500">
                    {getLocaleText(locale, 'Leitura rápida', 'Quick read')}
                  </span>
                </div>
              </article>

              {isLoading ? <p className={contentEmpty}>{getLocaleText(locale, 'A carregar laboratório...', 'Loading laboratory...')}</p> : null}
              {!isLoading && loadError ? <p className={contentEmpty}>{loadError}</p> : null}

              {!isLoading && !loadError ? (
	              <section>
	                <h2 className="mb-6 text-2xl font-semibold text-slate-900 lg:text-3xl">
	                  {hasSearch ? getLocaleText(locale, 'Clubes encontrados', 'Found clubs') : getLocaleText(locale, 'Clubes ativos', 'Active clubs')}
	                </h2>
                {filteredClubs.length === 0 ? (
                  <p className={contentEmpty}>{getLocaleText(locale, 'Ainda não existem clubes ativos para mostrar.', 'There are no active clubs to show yet.')}</p>
                ) : (
	                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
	                    {filteredClubs.map((club) => (
	                      <article key={club.id} className={`${labResearchSubcard} min-h-[220px]`}>
                        {club.image ? (
                          <img
                            src={resolveInfoCulturaAssetUrl(club.image)}
                            alt={club.name}
                            className="mb-4 h-40 w-full rounded-xl object-cover"
                          />
                        ) : null}
                        <h3 className={labResearchSubtitle}>{club.name}</h3>
                        <p className={labResearchSubtext}>
                          {club.mission ||
                            club.description ||
                            getLocaleText(locale, 'Clube cultural disponivel no laboratorio.', 'Cultural club available in the laboratory.')}
                        </p>
                        <Link to={getClubHref(club)} className={labResearchLink}>
                          {getLocaleText(locale, 'Ver mais', 'View more')}
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
	              </section>
	            ) : null}

            {!isLoading && !loadError && hasSearch ? (
	              <div className="space-y-14 lg:space-y-16">
                {totalResults === 0 ? (
                  <p className={contentEmpty}>{getLocaleText(locale, 'Não existem resultados para a pesquisa atual.', 'There are no results for the current search.')}</p>
                ) : null}

                {filteredNews.length > 0 ? (
                  <section>
                    <h2 className="mb-4 text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Notícias', 'News')}</h2>
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {filteredNews.slice(0, 6).map((item) => (
                        <ResultCard
                          key={`news-${item.id}`}
                          title={item.title}
                          meta={item.club_name}
                          description={item.summary}
                          href={`/laboratorio-cultural/noticias/${item.id}`}
                          image={item.image}
                          status={item.news_status_name}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {filteredEvents.length > 0 ? (
                  <section>
                    <h2 className="mb-4 text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Eventos', 'Events')}</h2>
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {filteredEvents.slice(0, 6).map((item) => (
                        <ResultCard
                          key={`event-${item.id}`}
                          title={item.title}
                          meta={getClubNameById(clubs, item.club_id)}
                          description={item.description}
                          href={`/laboratorio-cultural/eventos/${item.id}`}
                          image={item.image}
                          status={item.status}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {filteredSessions.length > 0 ? (
                  <section>
                    <h2 className="mb-4 text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Sessões', 'Sessions')}</h2>
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {filteredSessions.slice(0, 6).map((item) => (
                        <ResultCard
                          key={`session-${item.id}`}
                          title={item.title}
                          meta={item.club_name}
                          description={item.description}
                          href={`/laboratorio-cultural/sessoes/${item.id}`}
                          status={item.name}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                <BestBooksSection
                  books={filteredBooks}
                  locale={locale}
                  title={getLocaleText(locale, 'Livros', 'Books')}
                  description={getLocaleText(
                    locale,
                    'Livros filtrados pela pesquisa atual.',
                    'Books filtered by the current search.'
                  )}
                  detailBaseHref="/laboratorio-cultural/livros"
                  limit={10}
                />
              </div>
            ) : null}

            {!isLoading && !loadError && !hasSearch ? (
              <div className="mt-10 space-y-10">
                {homepageStyleNews.length > 0 || homepageStyleEvents.length > 0 ? (
	                  <section className="bg-white">
	                    <div className="grid w-full grid-cols-1 gap-12 xl:grid-cols-2 xl:gap-14">
                      <NewsHighlightsSection
                        title={getLocaleText(locale, 'Notícias', 'News')}
                        viewAllHref="/vida-academica/noticias"
                        viewAllInternal
                        items={homepageStyleNews}
                        className="w-full"
                      />
                      <NewsHighlightsSection
                        title={getLocaleText(locale, 'Eventos', 'Events')}
                        viewAllHref="/vida-academica/eventos"
                        viewAllInternal
                        items={homepageStyleEvents}
                        className="w-full"
                      />
                    </div>
                  </section>
                ) : null}

	                <BestBooksSection
	                  books={books}
                  locale={locale}
                  title={getLocaleText(locale, 'Livros em destaque', 'Featured books')}
                  description={getLocaleText(
                    locale,
                    'Alguns dos livros mais relevantes do Laboratório Cultural.',
                    'Some of the most relevant books from the Cultural Lab.'
                  )}
                  viewAllHref="/laboratorio-cultural"
                  viewAllLabel={getLocaleText(locale, 'Ver laboratório', 'View lab')}
	                  detailBaseHref="/laboratorio-cultural/livros"
	                  limit={10}
	                  className="w-full overflow-hidden"
	                />



                {filteredSessions.length > 0 ? (
	                  <section>
	                    <h2 className="mb-6 text-2xl font-semibold text-slate-900 lg:text-3xl">{getLocaleText(locale, 'Sessões', 'Sessions')}</h2>
	                    <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                      {filteredSessions.slice(0, 6).map((item) => (
                        <ResultCard
                          key={`session-overview-${item.id}`}
                          title={item.title}
                          meta={item.club_name}
                          description={item.description}
                          href={`/laboratorio-cultural/sessoes/${item.id}`}
                          status={item.name}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                <LaboratorioEventsSection
                  events={filteredEvents}
                  clubs={clubs}
                  locale={locale}
                  title={getLocaleText(locale, 'Todos os eventos do laboratório', 'All laboratory events')}
                  description={getLocaleText(
                    locale,
                    'Consulta num único bloco todos os eventos públicos ativos do Laboratório Cultural.',
                    'Browse all active public events from the Cultural Laboratory in a single section.'
                  )}
                />
              </div>
            ) : null}

            <section className="space-y-4">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dd8609]">
                  {getLocaleText(locale, 'Galeria', 'Gallery')}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900 lg:text-3xl">
                  {getLocaleText(locale, 'Momentos do Laboratório Cultural', 'Moments from the Cultural Laboratory')}
                </h2>
              </div>
              
              <PhotoCarousel items={carouselItems} />
            </section>

            {!isLoading && !loadError ? (
	              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 lg:p-8">
	                <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">{getLocaleText(locale, 'Explorar agenda', 'Explore agenda')}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {getLocaleText(
                        locale,
                        'Vê todos os eventos numa página própria com filtros e uma leitura geral por calendário.',
                        'See all events on a dedicated page with filters and a calendar overview.'
                      )}
                    </p>
                  </div>
                  <Link to="/laboratorio-cultural/agenda" className={adminBtnSecondary}>
                    {getLocaleText(locale, 'Ver agenda completa', 'View full agenda')}
                  </Link>
                </div>
              </div>
            ) : null}

            <EventbriteEventsSection />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default LaboratorioCultural;
