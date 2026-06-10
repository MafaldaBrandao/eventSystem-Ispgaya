import { ReactNode, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { contentEmpty } from '../../styles/ui.js';
import { useLocale, getLocaleText } from '../../i18n/locale.js';

export type PageToken = number | 'ellipsis';

type PaginatedCollectionProps<T> = {
  items: T[];
  isLoading: boolean;
  error: string;
  loadingMessage: string;
  emptyMessage: string;
  itemsPerPage?: number;
  renderItem: (item: T) => ReactNode;
};

const DEFAULT_ITEMS_PER_PAGE = 8;

function buildVisiblePages(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 10) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: PageToken[] = [1];
  const start = Math.max(2, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);

  if (start > 2) {
    pages.push('ellipsis');
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}

function PaginationArrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <ChevronRight
      aria-hidden="true"
      className={`h-5 w-5 ${direction === 'left' ? 'rotate-180' : ''}`}
      strokeWidth={2}
    />
  );
}

function PaginatedCollection<T>({
  items,
  isLoading,
  error,
  loadingMessage,
  emptyMessage,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  renderItem
}: PaginatedCollectionProps<T>) {
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const requestedPage = Number(searchParams.get('page') || '1');
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.min(Math.floor(requestedPage), totalPages)
      : 1;

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [currentPage, items, itemsPerPage]);

  const visiblePages = buildVisiblePages(currentPage, totalPages);

  function goToPage(page: number) {
    setSearchParams(page === 1 ? {} : { page: String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (isLoading) {
    return <p className={contentEmpty}>{loadingMessage}</p>;
  }

  if (error) {
    return <p className={contentEmpty}>{error}</p>;
  }

  if (paginatedItems.length === 0) {
    return <p className={contentEmpty}>{emptyMessage}</p>;
  }

  return (
    <>
      <div className="space-y-10">{paginatedItems.map((item) => renderItem(item))}</div>

      <div className="mt-12">
        <nav aria-label={getLocaleText(locale, 'Paginação', 'Pagination')} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 justify-between gap-3 sm:hidden">
            {currentPage > 1 ? (
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                className="relative inline-flex w-full items-center justify-center rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium leading-5 text-gray-700"
              >
                {getLocaleText(locale, 'Anterior', 'Previous')}
              </button>
            ) : (
              <span className="relative inline-flex w-full cursor-default items-center justify-center rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium leading-5 text-gray-500">
                {getLocaleText(locale, 'Anterior', 'Previous')}
              </span>
            )}

            {currentPage < totalPages ? (
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                className="relative inline-flex w-full items-center justify-center rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium leading-5 text-gray-700"
              >
                {getLocaleText(locale, 'Próximo', 'Next')}
              </button>
            ) : (
              <span className="relative inline-flex w-full cursor-default items-center justify-center rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium leading-5 text-gray-500">
                {getLocaleText(locale, 'Próximo', 'Next')}
              </span>
            )}
          </div>

          <div className="hidden flex-1 items-center justify-center sm:flex">
            <span className="relative z-0 inline-flex rounded-sm">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className="relative inline-flex items-center rounded-l-sm border border-gray-300 bg-white px-2 py-2 text-sm font-medium leading-5 text-gray-500 disabled:cursor-not-allowed disabled:text-gray-400"
                aria-label={getLocaleText(locale, 'Anterior', 'Previous')}
              >
                <PaginationArrow direction="left" />
              </button>

              {visiblePages.map((page, index) =>
                page === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium leading-5 text-gray-700"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm leading-5 ${
                      page === currentPage
                        ? 'cursor-default bg-white font-bold text-orange-400'
                        : 'bg-white font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-500'
                    }`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="relative inline-flex items-center rounded-r-sm border border-gray-300 bg-white px-2 py-2 text-sm font-medium leading-5 text-gray-500 disabled:cursor-not-allowed disabled:text-gray-400"
                aria-label={getLocaleText(locale, 'Próximo', 'Next')}
              >
                <PaginationArrow direction="right" />
              </button>
            </span>
          </div>
        </nav>
      </div>
    </>
  );
}

export default PaginatedCollection;
