import { Link } from 'react-router-dom';
import {
  breadcrumbsAnchor,
  breadcrumbsItemCurrent,
  breadcrumbsItemMuted,
  breadcrumbsList,
  breadcrumbsNav,
  breadcrumbsSlash,
  heroIntroText,
  heroIntroTitle,
  heroIntroWrap,
  heroPatternSection,
  heroPatternWrap
} from '../../styles/ui';
import { useLocale, getLocaleText } from '../../i18n/locale.js';

type BreadcrumbsProps = {
  title?: string;
  description?: string;
  parentLabel?: string;
  parentHref?: string;
  currentLabel?: string;
  currentHref?: string;
};

function renderBreadcrumbLink(href: string, label: string, className: string) {
  const isExternal = href.startsWith('http://') || href.startsWith('https://');

  return isExternal ? (
    <a href={href} className={className}>
      {label}
    </a>
  ) : (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
}

function Breadcrumbs({
  title,
  description,
  parentLabel,
  parentHref = '/',
  currentLabel,
  currentHref = '/'
}: BreadcrumbsProps) {
  const { locale } = useLocale();
  const resolvedTitle = title || getLocaleText(locale, 'Publicações Científicas', 'Scientific Publications');
  const resolvedDescription =
    description ||
    getLocaleText(
      locale,
      'O ISPGAYA desenvolve investigação científica nas diversas áreas em que oferece formação, resultando em publicações, livros, capítulos e artigos científicos.',
      'ISPGAYA develops scientific research across the various areas where it offers training, resulting in publications, books, chapters and scientific articles.'
    );
  const resolvedParentLabel = parentLabel || getLocaleText(locale, 'Laboratório Cultural', 'Research');
  const resolvedCurrentLabel = currentLabel || getLocaleText(locale, 'Publicações Científicas', 'Scientific Publications');
  return (
    <div className={heroPatternWrap}>
      <section className={heroPatternSection}>
        <nav className={breadcrumbsNav} aria-label={getLocaleText(locale, 'Breadcrumb', 'Breadcrumb')}>
          <ol role="list" className={breadcrumbsList}>
            <li>
              <div className={breadcrumbsItemMuted}>
                {renderBreadcrumbLink(parentHref, resolvedParentLabel, breadcrumbsAnchor)}
                <span className={breadcrumbsSlash}>/</span>
              </div>
            </li>
            <li>
              <div className={breadcrumbsItemCurrent}>
                {renderBreadcrumbLink(currentHref, resolvedCurrentLabel, breadcrumbsAnchor)}
              </div>
            </li>
          </ol>
        </nav>

        <div className={heroIntroWrap}>
          <h1 className={`${heroIntroTitle} text-3xl sm:text-4xl md:text-5xl`}>{resolvedTitle}</h1>
          <p className={heroIntroText}>{resolvedDescription}</p>
        </div>
      </section>
    </div>
  );
}

export default Breadcrumbs;
