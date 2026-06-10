import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { InfoCulturaBook } from '../../api/infoculturaApi.js';
import { resolveInfoCulturaAssetUrl } from '../../api/infoculturaApi.js';
import { Locale, getLocaleText } from '../../i18n/locale.js';
import { labResearchLink } from '../../styles/ui';

type BestBooksSectionProps = {
  books: InfoCulturaBook[];
  locale: Locale;
  title?: string;
  description?: string;
  emptyLabel?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  detailBaseHref?: string;
  limit?: number;
  className?: string;
};

function sortBooks(list: InfoCulturaBook[]): InfoCulturaBook[] {
  return [...list].sort((left, right) => {
    const featuredDelta = Number(right.is_featured) - Number(left.is_featured);
    if (featuredDelta !== 0) return featuredDelta;

    const yearDelta = right.publication_year - left.publication_year;
    if (yearDelta !== 0) return yearDelta;

    return left.title.localeCompare(right.title, 'pt');
  });
}

function getSpineGradient(index: number): string {
  const palettes = [
    'from-[#dd8609] via-[#c77708] to-[#8a5405]',
    'from-[#3f4a58] via-slate-800 to-slate-950',
    'from-[#f4a24d] via-[#dd8609] to-[#b86c04]',
    'from-slate-900 via-[#3f4a58] to-slate-700',
    'from-[#2f3844] via-slate-700 to-[#dd8609]'
  ];

  return palettes[index % palettes.length] ?? palettes[0];
}

type BookSpineProps = {
  book: InfoCulturaBook;
  locale: Locale;
  href: string;
  spineColor: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

function BookSpine({
  book,
  locale,
  href,
  spineColor,
  isOpen,
  onOpen,
  onClose
}: BookSpineProps) {
  return (
    <div
      className="relative h-[380px] w-[54px] shrink-0 overflow-visible outline-none"
    >
      <div
        className="absolute -bottom-7 left-1/2 h-8 -translate-x-1/2 rounded-full bg-black/60 blur-xl transition-all duration-500"
        style={{ width: isOpen ? '192px' : '48px', backgroundColor: isOpen ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)' }}
      />

      <div className="relative h-full w-full [transform-style:preserve-3d]">
        <button
          type="button"
          aria-label={getLocaleText(locale, `Abrir ${book.title}`, `Open ${book.title}`)}
          aria-pressed={isOpen}
          className={`absolute left-0 top-0 z-40 h-full w-[54px] overflow-hidden rounded-md border border-white/15 bg-gradient-to-b ${spineColor} shadow-[0_18px_35px_rgba(15,23,42,0.22)]`}
          onClick={() => {
            if (isOpen) {
              onClose();
            } else {
              onOpen();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (isOpen) {
                onClose();
              } else {
                onOpen();
              }
            }
          }}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-white/25" />
          <div className="absolute inset-y-0 left-0 w-2 bg-white/10" />
          <div className="absolute inset-y-0 right-0 w-2 bg-black/25" />
          <div className="absolute inset-y-0 left-[9px] w-px bg-white/20" />

          <p
            className="absolute left-1/2 top-8 -translate-x-1/2 [writing-mode:vertical-rl] text-[10px] font-bold uppercase tracking-[0.34em]"
            style={{ color: '#f8fafc' }}
          ></p>

          <p
            className="absolute left-1/2 top-5 -translate-x-1/2 [writing-mode:vertical-rl] text-[13px] font-bold uppercase tracking-[0.18em]"
            style={{ color: '#f8fafc' }}
          >
            {book.title}
          </p>

          <p
            className="absolute bottom-6 left-1/2 -translate-x-1/2 [writing-mode:vertical-rl] text-[9px] font-bold uppercase tracking-[0.26em]"
            style={{ color: '#e2e8f0' }}
          >
            {book.author}
          </p>
        </button>

        <div
          className="absolute left-[54px] top-0 h-full w-[196px] origin-left overflow-hidden rounded-r-lg border border-slate-200 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.18)] transition-all duration-700 ease-out"
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'rotateY(0deg)' : 'rotateY(86deg)',
            pointerEvents: isOpen ? 'auto' : 'none'
          }}
        >
          {book.cover_image ? (
            <img
              src={resolveInfoCulturaAssetUrl(book.cover_image)}
              alt={book.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-300" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/60 to-white/5" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/20 to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-end p-5 text-slate-900">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#dd8609]">
              {getLocaleText(locale, 'Destaque', 'Featured')}
            </p>

            <div className="border-l-4 border-[#dd8609] bg-white/90 px-3 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {getLocaleText(locale, 'Livro', 'Book')}
              </p>
              <h3 className="mt-2 font-heading text-xl font-bold leading-tight text-slate-900">
                {book.title}
              </h3>
              <p className="mt-3 text-sm font-medium text-slate-600">{book.author}</p>
            </div>

            <Link
              to={href}
              className="mt-4 inline-flex w-fit items-center text-sm font-bold text-[#dd8609] underline-offset-2 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {getLocaleText(locale, 'Ver detalhe', 'View details')}
            </Link>
          </div>

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent transition-opacity duration-500"
            style={{ opacity: isOpen ? 1 : 0 }}
          />
        </div>

        <div
          className="absolute left-[245px] top-4 h-[calc(100%-32px)] w-4 rounded-r-md bg-gradient-to-r from-zinc-200 to-zinc-400 shadow-lg transition-opacity duration-500"
          style={{ opacity: isOpen ? 1 : 0 }}
        >
          <div className="h-full w-full bg-[linear-gradient(to_bottom,rgba(0,0,0,.12)_1px,transparent_1px)] bg-[length:100%_8px]" />
        </div>
      </div>
    </div>
  );
}

function BestBooksSection({
  books,
  locale,
  title,
  description,
  emptyLabel,
  viewAllHref,
  viewAllLabel,
  detailBaseHref = '/laboratorio-cultural/livros',
  limit,
  className = 'w-full'
}: BestBooksSectionProps) {
  const sortedBooks = sortBooks(books);
  const displayedBooks = typeof limit === 'number' ? sortedBooks.slice(0, limit) : sortedBooks;
  const [activeBookId, setActiveBookId] = useState<number | null>(null);
  const activeIndex = displayedBooks.findIndex((book) => book.id === activeBookId);

  useEffect(() => {
    if (activeBookId !== null && !displayedBooks.some((book) => book.id === activeBookId)) {
      setActiveBookId(null);
    }
  }, [activeBookId, displayedBooks]);

  const resolvedTitle = title || getLocaleText(locale, 'Livros em destaque', 'Featured books');
  const resolvedDescription =
    description ||
    getLocaleText(
      locale,
      'Uma seleção dos livros com maior destaque na comunidade cultural.',
      'A curated selection of the most relevant books in the cultural community.'
    );
  const resolvedEmptyLabel =
    emptyLabel ||
    getLocaleText(
      locale,
      'Ainda não existem livros para mostrar.',
      'There are no books to show yet.'
    );
  const resolvedViewAllLabel =
    viewAllLabel || getLocaleText(locale, 'Ver todos os livros', 'View all books');

  return (
    <section className={className} aria-labelledby="best-books-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
            {getLocaleText(locale, 'Biblioteca', 'Library')}
          </p>
          <h2
            id="best-books-heading"
            className="mt-3 font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl"
          >
            {resolvedTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{resolvedDescription}</p>
        </div>

        {viewAllHref ? (
          <Link to={viewAllHref} className={labResearchLink}>
            {resolvedViewAllLabel}
          </Link>
        ) : null}
      </div>

      <div className="mt-8">
        {displayedBooks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-500">
            {resolvedEmptyLabel}
          </p>
        ) : (
	          <div className="relative mx-auto flex max-w-full flex-nowrap items-end justify-start gap-x-4 gap-y-16 overflow-x-auto overflow-y-visible px-2 py-14 pb-20 md:px-4 md:py-16 lg:max-w-[calc(100vw-7rem)] xl:max-w-6xl xl:flex-wrap xl:overflow-visible xl:pl-6">
            {displayedBooks.map((book, index) => (
              <div
                key={book.id}
                className="relative shrink-0 transition-transform duration-500 ease-out hover:z-50"
                style={{
                  transform:
                    activeIndex < 0 || activeIndex === index
                      ? 'translateX(0)'
                      : index < activeIndex
                        ? `translateX(-${Math.min((activeIndex - index) * 8, 24)}px)`
                        : `translateX(${Math.min(250 + (index - activeIndex - 1) * 14, 320)}px)`,
                  zIndex: activeIndex === index ? 20 : 1
                }}
              >
                <BookSpine
                  book={book}
                  locale={locale}
                  href={`${detailBaseHref}/${book.id}`}
                  spineColor={getSpineGradient(index)}
                  isOpen={activeBookId === book.id}
                  onOpen={() => setActiveBookId(book.id)}
                  onClose={() => setActiveBookId(null)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default BestBooksSection;
