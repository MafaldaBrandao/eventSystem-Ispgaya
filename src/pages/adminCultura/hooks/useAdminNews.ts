import { useEffect } from 'react';
import { getLocaleText, useLocale } from '../../../i18n/locale';

import {
  InfoCulturaNews,
  InfoCulturaNewsStatus,
  fetchAdminNews,
  fetchAdminNewsStatuses,
} from '../../../api/infoculturaApi';

type UseAdminNewsOptions = {
  token: string;
  currentUser: unknown;
  activeSection: string | null;
  canManageUsers: boolean;
  newsClubFilter: string;
  newsStatusFilter: string;
  newsSearch: string;
  newsOrder: string;
  newsDateFrom: string;
  newsDateTo: string;
  newsPage: number;
  setIsLoadingNews: (value: boolean) => void;
  setIsLoadingNewsStatuses: (value: boolean) => void;
  setNewsStatuses: (value: InfoCulturaNewsStatus[]) => void;
  setNewsItems: (value: InfoCulturaNews[]) => void;
  setNewsTotal: (value: number) => void;
  setNewsTotalPages: (value: number) => void;
  setNewsError: (value: string) => void;
  handleAuthError: (error: unknown) => boolean;
  pageSize: number;
};

export function useAdminNews({
  token,
  currentUser,
  activeSection,
  canManageUsers,
  newsClubFilter,
  newsStatusFilter,
  newsSearch,
  newsOrder,
  newsDateFrom,
  newsDateTo,
  newsPage,
  setIsLoadingNews,
  setIsLoadingNewsStatuses,
  setNewsStatuses,
  setNewsItems,
  setNewsTotal,
  setNewsTotalPages,
  setNewsError,
  handleAuthError,
  pageSize,
}: UseAdminNewsOptions) {
  const { locale } = useLocale();
  useEffect(() => {
    if (!token || !currentUser || activeSection !== 'noticias') {
      return;
    }

    let isMounted = true;
    setIsLoadingNews(true);
    setIsLoadingNewsStatuses(true);
    setNewsError('');

    const clubId =
      canManageUsers && newsClubFilter !== 'all' ? Number(newsClubFilter) : undefined;
    const status = newsStatusFilter && newsStatusFilter !== 'all' ? newsStatusFilter : undefined;

    void Promise.all([
      fetchAdminNewsStatuses(token),
      fetchAdminNews(token, {
        clubId,
        status,
        search: newsSearch,
        ordering: newsOrder,
        dateFrom: newsDateFrom,
        dateTo: newsDateTo,
        page: newsPage,
        pageSize,
      }),
    ])
      .then(([nextStatuses, newsPageData]) => {
        if (!isMounted) return;
        setNewsStatuses(nextStatuses);
        setNewsItems(newsPageData.items);
        setNewsTotal(newsPageData.total);
        setNewsTotalPages(newsPageData.total_pages);
      })
      .catch((error) => {
        if (!isMounted) return;
        if (handleAuthError(error)) return;
        const message =
          error instanceof Error
            ? error.message
            : getLocaleText(locale, 'Nao foi possivel carregar as noticias.', 'Could not load the news.');
        setNewsError(message);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingNews(false);
        setIsLoadingNewsStatuses(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeSection,
    token,
    currentUser,
    canManageUsers,
    newsClubFilter,
    newsStatusFilter,
    newsSearch,
    newsOrder,
    newsDateFrom,
    newsDateTo,
    newsPage,
    locale,
  ]);
}
