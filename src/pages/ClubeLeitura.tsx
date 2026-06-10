import { useEffect, useMemo, useState } from 'react';

import {
  createClubRegistration,
  fetchPublicBooks,
  fetchPublicClubs,
  fetchPublicEvents,
  fetchPublicNews,
  fetchPublicPhotos,
  InfoCulturaBook,
  InfoCulturaClub,
  InfoCulturaEvent,
  InfoCulturaNews,
  InfoCulturaPhoto,
  resolveInfoCulturaAssetUrl
} from '../api/infoculturaApi.js';
import BestBooksSection from '../components/sections/BestBooksSection.js';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ClubCallToAction from '../components/ui/ClubCallToAction';
import ClubRegistrationModal, { ClubRegistrationFormData } from '../components/ui/ClubRegistrationModal';
import NewsHighlightsSection, { type NewsHighlightItem } from '../components/ui/NewsHighlightsSection';
import PhotoCarousel from '../components/ui/PhotoCarousel';
import Footer from '../components/layout/Footer';
import HeaderNav from '../components/layout/HeaderNav';
import TopBar from '../components/layout/TopBar';
import heroImage from '../assets/img/clube_leitura_ispgaya.jpg';
import { blockText, blockTitle, container, mainContent, sectionSpace } from '../styles/ui';
import { getLocaleText, useLocale } from '../i18n/locale.js';
import { buildClubPhotoSectionAliases, filterPhotosBySections } from '../utils/photoSections';

function normalizeClubName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatHighlightDate(value: string, locale: 'pt' | 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function ClubeLeitura() {
  const { locale } = useLocale();
  const [books, setBooks] = useState<InfoCulturaBook[]>([]);
  const [newsItems, setNewsItems] = useState<InfoCulturaNews[]>([]);
  const [events, setEvents] = useState<InfoCulturaEvent[]>([]);
  const [club, setClub] = useState<InfoCulturaClub | null>(null);
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

        const readingClub = clubs.find((item) => normalizeClubName(item.name).includes('leitura')) || null;
        setClub(readingClub);

        if (!readingClub) {
          setBooks([]);
          setNewsItems([]);
          setEvents([]);
          return;
        }

        const [nextBooks, nextNews, nextEvents, nextPhotos] = await Promise.all([
          fetchPublicBooks(readingClub.id),
          fetchPublicNews(readingClub.id),
          fetchPublicEvents({ clubId: readingClub.id }),
          fetchPublicPhotos()
        ]);

        if (!active) return;
        setBooks(nextBooks);
        setNewsItems(nextNews);
        setEvents(nextEvents);
        setPhotos(nextPhotos);
      } catch {
        if (!active) return;
        setBooks([]);
        setNewsItems([]);
        setEvents([]);
        setClub(null);
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
          publishedLabel: formatHighlightDate(item.published_at || item.created_at, locale),
          tags: [{ label: '#clubedeleitura', href: '/vida-academica/noticias' }]
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
          publishedLabel: formatHighlightDate(item.start_date || item.event_date, locale),
          tags: item.categories.map((category) => ({
            label: `#${normalizeClubName(category.name).replace(/\s+/g, '')}`,
            href: '/vida-academica/eventos'
          }))
        })),
    [events, locale]
  );
  const clubPhotoItems = useMemo(
    () =>
      filterPhotosBySections(
        photos,
        buildClubPhotoSectionAliases(club?.name, ['leitura', 'clube leitura', 'clube de leitura'], club?.id)
      ).map((photo) => ({
        id: photo.id,
        title: photo.title,
        caption: photo.caption,
        image: photo.image,
        alt_text: photo.alt_text,
      })),
    [photos, club?.id, club?.name]
  );

  async function handleSubmitRegistration(data: ClubRegistrationFormData) {
    if (!club) {
      setRegistrationError(getLocaleText(locale, 'Clube de Leitura não encontrado.', 'Reading Club not found.'));
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
        title={getLocaleText(locale, 'Clube de Leitura', 'Reading Club')}
        description={getLocaleText(
          locale,
          'Bem-vindo ao Clube de Leitura da ISPGAYA! Um espaço dedicado aos amantes de livros e histórias.',
          'Welcome to the ISPGAYA Reading Club! A space dedicated to books and stories.'
        )}
        currentLabel={getLocaleText(locale, 'Clube de Leitura', 'Reading Club')}
        currentHref="/laboratorio-cultural/clube-leitura"
      />

      <main className={mainContent}>
        <div className={`${container} ${sectionSpace}`}>
          <h2 className={blockTitle}>{getLocaleText(locale, 'Aqui podes:', 'Here you can:')}</h2>
          <p className={blockText}>
            {getLocaleText(
              locale,
              'Descobrir novas obras literárias, participar em sessões de leitura, trocar recomendações com outros clubistas, aprofundar a tua paixão pela literatura. Junta-te a uma comunidade vibrante onde cada livro é uma porta para novos mundos e ideias.',
              'Discover new literary works, join reading sessions, exchange recommendations with other members, and deepen your passion for literature. Join a vibrant community where each book opens the door to new worlds and ideas.'
            )}
          </p>

          <img
            className="mx-auto mb-8 mt-8 aspect-[3/1] w-full max-w-5xl rounded-sm object-cover shadow-xl"
            src={heroImage}
            alt={getLocaleText(locale, 'Clube de Leitura', 'Reading Club')}
          />

          <p className={`${blockText} mb-8`}>
            {getLocaleText(
              locale,
              'Se gostas de ler, refletir e conversar sobre livros num ambiente descontraído, este é o teu lugar.',
              'If you like reading, reflecting and talking about books in a relaxed environment, this is your place.'
            )}
          </p>


            <section className="space-y-4">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dd8609]">
                  {getLocaleText(locale, 'Galeria', 'Gallery')}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900 lg:text-3xl">
                  {getLocaleText(locale, 'Momentos do Laboratório Cultural', 'Moments from the Cultural Laboratory')}
                </h2>
              </div>
              
              <PhotoCarousel items={clubPhotoItems} />
            </section>

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
            <section className="mb-12 mt-12 bg-white">
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

          <BestBooksSection
            books={books}
            locale={locale}
            title={getLocaleText(locale, 'Melhores livros', 'Best books')}
            description={getLocaleText(
              locale,
              'Livros selecionados para inspirar as próximas leituras do clube.',
              'Books selected to inspire the club’s next readings.'
            )}
            viewAllHref="/laboratorio-cultural"
            viewAllLabel={getLocaleText(locale, 'Explorar o laboratório', 'Explore the lab')}
            detailBaseHref="/laboratorio-cultural/livros"
            limit={10}
          />
        </div>
      </main>

      <ClubRegistrationModal
        clubName={getLocaleText(locale, 'Clube de Leitura', 'Reading Club')}
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

export default ClubeLeitura;
