import {
  container,
  topBar,
  topBarGroup,
  topBarInner,
  topBarLink,
  topBarLocaleActive,
  topBarLocale,
  topBarLocaleWrap,
  topBarRightGroup,
  topBarRightLinks
} from '../../styles/ui';
import { useLocale, getLocaleText } from '../../i18n/locale.js';
import { buildIspgayaUrl } from '../../i18n/urls.js';

type TopBarLink = {
  pt: string;
  en: string;
  href: string;
  target?: string;
  rel?: string;
};

function getLeftLinks(): TopBarLink[] {
  return [
    {
      pt: 'Inforestudante',
      en: 'Student Portal',
      href: 'https://inforestudante.ispgaya.pt',
      target: '_blank',
      rel: 'noindex nofollow'
    },
    {
      pt: 'Infordocente',
      en: 'Teacher Portal',
      href: 'https://infordocente.ispgaya.pt',
      target: '_blank',
      rel: 'noindex nofollow'
    },
    {
      pt: 'Infocultura',
      en: 'InfoCultura',
      href: '/infocultura'
    },
    {
      pt: 'Email',
      en: 'Email',
      href: 'https://outlook.office.com',
      target: '_blank',
      rel: 'noindex nofollow'
    },
    {
      pt: 'Horários',
      en: 'Timetables',
      href: 'https://horarios.ispgaya.pt/geral/',
      target: '_blank',
      rel: 'noindex nofollow'
    }
  ];
}

function getRightLinks(locale: 'pt' | 'en'): TopBarLink[] {
  return [
    {
      pt: 'Perguntas Frequentes',
      en: 'Frequently Asked Questions',
      href: buildIspgayaUrl(locale, '/perguntas-frequentes')
    },
    {
      pt: 'Candidatura Online',
      en: 'Online Application',
      href: 'https://inforestudante.ispgaya.pt/nonio/security/preRegisto.do?origem=CANDIDATURAS',
      target: '_blank',
      rel: 'noopener noreferrer'
    },
    {
      pt: 'Contactos',
      en: 'Contacts',
      href: buildIspgayaUrl(locale, '/instituicao/contactos')
    }
  ];
}

type TopBarProps = {
  transparent?: boolean;
};

function TopBar({ transparent = false }: TopBarProps) {
  const { locale, setLocale } = useLocale();
  const leftLinks = getLeftLinks();
  const rightLinks = getRightLinks(locale);
  const rootClassName = transparent
    ? 'hidden xl:block bg-transparent text-white'
    : topBar;
  const linkClassName = transparent
    ? 'text-white/90 transition-colors hover:text-white'
    : topBarLink;
  const localeActiveClassName = transparent
    ? 'font-bold text-white transition-colors hover:text-white'
    : topBarLocaleActive;
  const localeClassName = transparent
    ? 'text-white/80 transition-colors hover:text-white'
    : topBarLocale;
  const dividerClassName = transparent ? 'border-white/10' : 'border-slate-200';
  const localeLabel = getLocaleText(locale, 'Idioma', 'Language');

  return (
    <div className={rootClassName}>
      <div className={`${container} ${topBarInner}`}>
        <div className={topBarGroup}>
          {leftLinks.map((item) => (
            <a
              key={item.pt}
              href={item.href}
              target={item.target}
              rel={item.rel}
              className={linkClassName}
            >
              {getLocaleText(locale, item.pt, item.en)}
            </a>
          ))}
        </div>

        <div className={topBarRightGroup}>
          <div className={topBarRightLinks}>
            {rightLinks.map((item) => (
              <a
                key={item.pt}
                href={item.href}
                target={item.target}
                rel={item.rel}
                className={linkClassName}
              >
                {getLocaleText(locale, item.pt, item.en)}
              </a>
            ))}
          </div>
          <span className={topBarLocaleWrap}>
            <button
              type="button"
              title={localeLabel}
              aria-pressed={locale === 'pt'}
              className={locale === 'pt' ? localeActiveClassName : localeClassName}
              onClick={() => setLocale('pt')}
            >
              PT
            </button>
            <button
              type="button"
              title={localeLabel}
              aria-pressed={locale === 'en'}
              className={locale === 'en' ? localeActiveClassName : localeClassName}
              onClick={() => setLocale('en')}
            >
              EN
            </button>
          </span>
        </div>
      </div>
      <hr className={dividerClassName} />
    </div>
  );
}

export default TopBar;
