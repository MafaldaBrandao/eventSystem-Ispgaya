import { useEffect, useMemo, useState } from 'react';
import PaginatedCollection from '../components/containers/PaginatedCollection';
import PublicMediaListItem from '../components/containers/PublicMediaListItem';
import PublicPageContainer from '../components/containers/PublicPageContainer';
import {
  fetchPublicNews,
  InfoCulturaNews,
  resolveInfoCulturaAssetUrl
} from '../api/infoculturaApi';
import { getLocaleText, useLocale } from '../i18n/locale.js';
import { formatPublicDate } from '../utils/dateFormat';

const ITEMS_PER_PAGE = 8;

function NoticiasPage() {
  const { locale } = useLocale();
  const [newsItems, setNewsItems] = useState<InfoCulturaNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadNews() {
      try {
        const response = await fetchPublicNews();
        if (!active) return;
        setNewsItems(response);
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : getLocaleText(locale, 'Não foi possível carregar as notícias.', 'Unable to load the news.')
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadNews();

    return () => {
      active = false;
    };
  }, [locale]);

  const sortedNews = useMemo(
    () =>
      [...newsItems].sort((left, right) => {
        const leftTime = new Date(left.published_at || left.created_at).getTime();
        const rightTime = new Date(right.published_at || right.created_at).getTime();
        return rightTime - leftTime;
      }),
    [newsItems]
  );

  return (
    <PublicPageContainer
      title={getLocaleText(locale, 'Notícias', 'News')}
      description={getLocaleText(locale, 'Arquivo público de notícias.', 'Public news archive.')}
      parentLabel={getLocaleText(locale, 'Vida Académica', 'Academic Life')}
      parentHref="/vida-academica/noticias"
      currentLabel={getLocaleText(locale, 'Notícias', 'News')}
      currentHref="/vida-academica/noticias"
    >
      <PaginatedCollection
        items={sortedNews}
        isLoading={isLoading}
        error={loadError}
        loadingMessage={getLocaleText(locale, 'A carregar notícias...', 'Loading news...')}
        emptyMessage={getLocaleText(
          locale,
          'Ainda não existem notícias publicadas.',
          'There are no published news items yet.'
        )}
        itemsPerPage={ITEMS_PER_PAGE}
        renderItem={(item) => {
          const itemDate = item.published_at || item.created_at;
          return (
            <PublicMediaListItem
              key={item.id}
              title={item.title}
              href={`/vida-academica/noticias/${item.id}`}
              imageUrl={resolveInfoCulturaAssetUrl(item.image)}
              imageAlt={item.title}
              dateTime={itemDate}
              formattedDate={formatPublicDate(itemDate, locale)}
              description={item.summary}
              tags={
                item.club_name ? (
                  <span className="inline-block text-sm font-medium text-orange-400">
                    #{item.club_name.toLowerCase().replace(/\s+/g, '')}
                  </span>
                ) : null
              }
            />
          );
        }}
      />
    </PublicPageContainer>
  );
}

export default NoticiasPage;
