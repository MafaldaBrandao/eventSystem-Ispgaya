import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  createClubRegistration,
  fetchPublicClubs,
  fetchPublicEvents,
  fetchPublicNews,
  fetchPublicPhotos,
  fetchPublicSessions,
  InfoCulturaClub,
  InfoCulturaEvent,
  InfoCulturaNews,
  InfoCulturaPhoto,
  InfoCulturaSession,
  resolveInfoCulturaAssetUrl
} from '../api/infoculturaApi.js';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ClubCallToAction from '../components/ui/ClubCallToAction';
import ClubRegistrationModal, { ClubRegistrationFormData } from '../components/ui/ClubRegistrationModal';
import NewsHighlightsSection, { type NewsHighlightItem } from '../components/ui/NewsHighlightsSection';
import PhotoCarousel from '../components/ui/PhotoCarousel';
import Footer from '../components/layout/Footer';
import HeaderNav from '../components/layout/HeaderNav';
import TopBar from '../components/layout/TopBar';
import heroImage from '../assets/19825874_uqliU.jpeg';
import {
  adminBtnSecondary,
  container,
  mainContent,
  sectionSpace
} from '../styles/ui';
import { getLocaleText, useLocale } from '../i18n/locale.js';
import { buildClubPhotoSectionAliases, filterPhotosBySections } from '../utils/photoSections';

function normalizeClubName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatPublicDate(value: string, locale: 'pt' | 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function Teatro() {
  const { locale } = useLocale();
  const [club, setClub] = useState<InfoCulturaClub | null>(null);
  const [newsItems, setNewsItems] = useState<InfoCulturaNews[]>([]);
  const [events, setEvents] = useState<InfoCulturaEvent[]>([]);
  const [sessions, setSessions] = useState<InfoCulturaSession[]>([]);
  const [photos, setPhotos] = useState<InfoCulturaPhoto[]>([]);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationFeedback, setRegistrationFeedback] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      try {
        const clubs = await fetchPublicClubs();
        if (!active) return;

        const theatreClub = clubs.find((item) => normalizeClubName(item.name).includes('teatro')) || null;
        setClub(theatreClub);

        if (!theatreClub) {
          setNewsItems([]);
          setEvents([]);
          setSessions([]);
          return;
        }

        const [nextNews, nextEvents, nextSessions, nextPhotos] = await Promise.all([
          fetchPublicNews(theatreClub.id),
          fetchPublicEvents({ clubId: theatreClub.id }),
          fetchPublicSessions(theatreClub.id),
          fetchPublicPhotos()
        ]);

        if (!active) return;
        setNewsItems(nextNews);
        setEvents(nextEvents);
        setSessions(nextSessions);
        setPhotos(nextPhotos);
      } catch {
        if (!active) return;
        setClub(null);
        setNewsItems([]);
        setEvents([]);
        setSessions([]);
      }
    }

    void loadPageData();

    return () => {
      active = false;
    };
  }, []);

  const highlightedNews = useMemo<NewsHighlightItem[]>(
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
          image: item.image ? resolveInfoCulturaAssetUrl(item.image) : '',
          imageAlt: item.title,
          publishedAt: item.published_at || item.created_at,
          publishedLabel: formatPublicDate(item.published_at || item.created_at, locale),
          tags: [{ label: '#clubedeteatro', href: '/vida-academica/noticias' }]
        })),
    [newsItems, locale]
  );

  const highlightedEvents = useMemo<NewsHighlightItem[]>(
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
          image: item.image ? resolveInfoCulturaAssetUrl(item.image) : '',
          imageAlt: item.title,
          publishedAt: item.start_date || item.event_date,
          publishedLabel: formatPublicDate(item.start_date || item.event_date, locale),
          tags: item.categories.map((category) => ({
            label: `#${normalizeClubName(category.name).replace(/\s+/g, '')}`,
            href: '/vida-academica/eventos'
          }))
        })),
    [events, locale]
  );

  const highlightedItems = useMemo(
    () => [
      ...events.slice(0, 2).map((item) => ({
        id: `event-${item.id}`,
        kind: getLocaleText(locale, 'Espetáculo', 'Performance'),
        title: item.title,
        description: item.description,
        date: item.start_date || item.event_date,
        href: `/laboratorio-cultural/eventos/${item.id}`,
        image: item.image
      })),
      ...sessions.slice(0, 2).map((item) => ({
        id: `session-${item.id}`,
        kind: getLocaleText(locale, 'Ensaio / sessão', 'Rehearsal / session'),
        title: item.title,
        description: item.description,
        date: item.start_date || item.session_date,
        href: `/laboratorio-cultural/sessoes/${item.id}`,
        image: ''
      }))
    ],
    [events, sessions, locale]
  );
  const agendaItems = useMemo(
    () =>
      [
        ...events.map((item) => ({
          id: `event-${item.id}`,
          kind: getLocaleText(locale, 'Espetáculo', 'Performance'),
          title: item.title,
          description: item.description,
          date: item.start_date || item.event_date,
          href: `/laboratorio-cultural/eventos/${item.id}`,
        })),
        ...sessions.map((item) => ({
          id: `session-${item.id}`,
          kind: getLocaleText(locale, 'Ensaio', 'Rehearsal'),
          title: item.title,
          description: item.description,
          date: item.start_date || item.session_date,
          href: `/laboratorio-cultural/sessoes/${item.id}`,
        })),
      ]
        .sort((left, right) => {
          const leftTime = new Date(left.date).getTime();
          const rightTime = new Date(right.date).getTime();
          return leftTime - rightTime;
        })
        .slice(0, 6),
    [events, sessions, locale]
  );
  const clubPhotoItems = useMemo(
    () =>
      filterPhotosBySections(
        photos,
        buildClubPhotoSectionAliases(club?.name, ['teatro', 'clube teatro', 'clube de teatro'], club?.id)
      ).map((photo) => ({
        id: photo.id,
        title: photo.title,
        caption: photo.caption,
        image: photo.image,
        alt_text: photo.alt_text,
      })),
    [photos, club?.name]
  );

  async function handleSubmitRegistration(data: ClubRegistrationFormData) {
    if (!club) {
      setRegistrationError(getLocaleText(locale, 'Clube de Teatro não encontrado.', 'Theatre Club not found.'));
      return;
    }

    setIsSubmittingRegistration(true);
    setRegistrationError('');

    try {
      await createClubRegistration(club.id, data);
      setRegistrationFeedback(
        getLocaleText(
          locale,
          'Inscrição enviada com sucesso. Aguarda validação pela equipa do clube.',
          'Registration sent successfully. Wait for club validation.'
        )
      );
      setIsRegistrationModalOpen(false);
    } catch (error) {
      setRegistrationError(
        error instanceof Error
          ? error.message
          : getLocaleText(locale, 'Não foi possível enviar a inscrição.', 'Unable to submit the registration.')
      );
    } finally {
      setIsSubmittingRegistration(false);
    }
  }

  return (
    <>
      <TopBar />
      <HeaderNav />
      <Breadcrumbs
        title={getLocaleText(locale, 'Clube de Teatro', 'Theatre Club')}
        description={getLocaleText(
          locale,
          'Um espaço para experimentar palco, expressão, criatividade e trabalho coletivo.',
          'A space to explore stage work, expression, creativity and collective practice.'
        )}
        currentLabel={getLocaleText(locale, 'Clube de Teatro', 'Theatre Club')}
        currentHref="/laboratorio-cultural/teatro"
      />

      <main className={mainContent}>
        <div className={`${container} ${sectionSpace}`}>
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dd8609]">
              {getLocaleText(locale, 'Apresentação', 'Presentation')}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl">
              {getLocaleText(locale, 'Grupo de Teatro ISPGAYA', 'ISPGAYA Theatre Group')}
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700">
              {getLocaleText(
                locale,
                'O Clube de Teatro é um espaço de criação artística, expressão e trabalho coletivo. Aqui desenvolvem-se exercícios de interpretação, voz, corpo, improvisação e construção de cena, culminando em ensaios abertos e espetáculos apresentados à comunidade académica.',
                'The Theatre Club is a space for artistic creation, expression and collective work. It develops acting, voice, body, improvisation and scene-building practice, leading to open rehearsals and performances presented to the academic community.'
              )}
            </p>
            <p className="mt-4 max-w-4xl text-base leading-8 text-slate-700">
              {getLocaleText(
                locale,
                'É pensado tanto para quem já tem experiência de palco como para quem quer começar, ganhar confiança e explorar novas formas de comunicar.',
                'It is designed both for students with stage experience and for those who want to begin, build confidence and explore new ways of communicating.'
              )}
            </p>
          </section>

          <img
            className="mx-auto mb-8 mt-8 aspect-[3/1] w-full max-w-5xl rounded-sm object-cover shadow-xl"
            src={club?.image ? resolveInfoCulturaAssetUrl(club.image) : heroImage}
            alt={getLocaleText(locale, 'Clube de Teatro', 'Theatre Club')}
          />

          <section className="grid gap-5 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                {getLocaleText(locale, 'Ensaios regulares', 'Regular rehearsals')}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {getLocaleText(
                  locale,
                  'Momentos dedicados ao treino de expressão, leitura de texto, improvisação e construção de personagens.',
                  'Dedicated moments for expression training, script reading, improvisation and character building.'
                )}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                {getLocaleText(locale, 'Espetáculos e mostras', 'Performances and showcases')}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {getLocaleText(
                  locale,
                  'Apresentações públicas dos trabalhos desenvolvidos pelo grupo ao longo do semestre e do ano letivo.',
                  'Public presentations of the work developed by the group throughout the semester and academic year.'
                )}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                {getLocaleText(locale, 'Integração no clube', 'Join the group')}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {getLocaleText(
                  locale,
                  'Se gostas de comunicar, improvisar e ganhar confiança em palco, este é o teu espaço no Laboratório Cultural.',
                  'If you enjoy communicating, improvising and building confidence on stage, this is your place in the Cultural Laboratory.'
                )}
              </p>
            </article>
          </section>

          <section className="mt-14">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dd8609]">
                  {getLocaleText(locale, 'Agenda', 'Agenda')}
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl">
                  {getLocaleText(locale, 'Ensaios e espetáculos', 'Rehearsals and performances')}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {getLocaleText(
                    locale,
                    'Consulta os próximos momentos do grupo, desde sessões de trabalho até apresentações abertas.',
                    'Check the group’s next moments, from working sessions to open performances.'
                  )}
                </p>
              </div>
              <Link to="/laboratorio-cultural/agenda" className={adminBtnSecondary}>
                {getLocaleText(locale, 'Explorar agenda', 'Explore agenda')}
              </Link>
            </div>

            {agendaItems.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {agendaItems.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#dd8609]">
                      {item.kind}
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {formatPublicDate(item.date, locale)}
                    </p>
                    <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">{item.description}</p>
                    <Link to={item.href} className="mt-5 inline-flex text-sm font-bold text-[#dd8609] hover:underline">
                      {getLocaleText(locale, 'Ver detalhe', 'View details')}
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                {getLocaleText(
                  locale,
                  'Ainda não existem ensaios ou espetáculos publicados para este clube.',
                  'There are no published rehearsals or performances for this club yet.'
                )}
              </p>
            )}
          </section>

          {clubPhotoItems.length > 0 ? (
            <section className="mb-12 mt-14">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dd8609]">
                  {getLocaleText(locale, 'Registo fotográfico', 'Photo record')}
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl">
                  {getLocaleText(locale, 'Momentos do grupo', 'Group moments')}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {getLocaleText(
                    locale,
                    'Galeria com imagens de ensaios, cenas, bastidores e apresentações do Clube de Teatro.',
                    'Gallery with images from rehearsals, scenes, backstage moments and Theatre Club performances.'
                  )}
                </p>
              </div>
              <PhotoCarousel items={clubPhotoItems} />
            </section>
          ) : null}

        </div>

        <ClubCallToAction
          locale={locale}
          enabled={Boolean(club?.enable_registrations)}
          onClick={() => {
            setRegistrationFeedback('');
            setRegistrationError('');
            setIsRegistrationModalOpen(true);
          }}
          statusText={
            club?.enable_registrations
              ? undefined
              : getLocaleText(
                  locale,
                  'As inscrições deste clube estão encerradas neste momento.',
                  'Registrations for this club are currently closed.'
                )
          }
        />

        <div className={`${container} ${sectionSpace}`}>
          {registrationFeedback ? (
            <p className="mb-8 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {registrationFeedback}
            </p>
          ) : null}

          {highlightedNews.length > 0 || highlightedEvents.length > 0 ? (
            <section className="mb-12 mt-14 bg-white">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dd8609]">
                  {getLocaleText(locale, 'Atualizações', 'Updates')}
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl">
                  {getLocaleText(locale, 'Notícias e divulgação', 'News and updates')}
                </h2>
              </div>
              <div className="grid w-full grid-cols-1 gap-12 xl:grid-cols-2 xl:gap-14">
                <NewsHighlightsSection
                  title={getLocaleText(locale, 'Notícias', 'News')}
                  viewAllHref="/vida-academica/noticias"
                  viewAllInternal
                  items={highlightedNews}
                  className="w-full"
                />
                <NewsHighlightsSection
                  title={getLocaleText(locale, 'Eventos', 'Events')}
                  viewAllHref="/vida-academica/eventos"
                  viewAllInternal
                  items={highlightedEvents}
                  className="w-full"
                />
              </div>
            </section>
          ) : null}

          <section className="mt-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dd8609]">
                  {getLocaleText(locale, 'Destaques', 'Highlights')}
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl">
                  {getLocaleText(locale, 'Atividades em destaque', 'Featured activities')}
                </h2>
              </div>
              <Link to="/laboratorio-cultural/agenda" className={adminBtnSecondary}>
                {getLocaleText(locale, 'Explorar agenda', 'Explore agenda')}
              </Link>
            </div>

            {highlightedItems.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {highlightedItems.map((item) => (
                  <article key={item.id} className="bg-white py-5">
                    {item.image ? (
                      <img
                        src={resolveInfoCulturaAssetUrl(item.image)}
                        alt={item.title}
                        className="mb-5 aspect-[16/9] w-full rounded-sm object-cover shadow-xl"
                      />
                    ) : null}
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#dd8609]">
                      {formatPublicDate(item.date, locale)}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
                    <Link to={item.href} className="mt-4 inline-flex text-sm font-bold text-[#dd8609] hover:underline">
                      {getLocaleText(locale, 'Ver detalhe', 'View details')}
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                {getLocaleText(
                  locale,
                  'Ainda não existem atividades publicadas para este clube.',
                  'There are no published activities for this club yet.'
                )}
              </p>
            )}
          </section>
        </div>
      </main>

      <ClubRegistrationModal
        clubName={getLocaleText(locale, 'Clube de Teatro', 'Theatre Club')}
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

      <Footer />
    </>
  );
}

export default Teatro;
