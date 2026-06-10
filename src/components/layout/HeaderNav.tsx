import { ChevronDown, Lock, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  brandLogo,
  brandWrap,
  container,
  desktopMenu,
  headerNav,
  headerNavInner,
  mobileMenuButton,
  navDropdownAnchor,
  navDropdownItem,
  navDropdownList,
  navDropdownWrap,
  navItemGroup,
  navLink
} from '../../styles/ui';
import logo from '../../assets/ispgaya-logo.svg';
import logoNegative from '../../assets/ispgaya-logo-negative.svg';
import { fetchPublicClubs, InfoCulturaClub } from '../../api/infoculturaApi';
import { getLocaleText, useLocale } from '../../i18n/locale.js';
import { buildIspgayaUrl } from '../../i18n/urls.js';

type LinkItem = {
  label: string;
  href: string;
  internal?: boolean;
};

type MenuItem = LinkItem & {
  dropdown?: LinkItem[];
};

function getDefaultLaboratorioDropdown(locale: 'pt' | 'en'): LinkItem[] {
  return [
    { label: getLocaleText(locale, 'Tuna Académica', 'Academic Tuna'), href: '/laboratorio-cultural/tuna', internal: true },
    {
      label: getLocaleText(locale, 'Clube de Leitura', 'Reading Club'),
      href: '/laboratorio-cultural/clube-leitura',
      internal: true
    },
    { label: getLocaleText(locale, 'Clube de Teatro', 'Theatre Club'), href: '/laboratorio-cultural/teatro', internal: true },
    { label: 'PNA', href: 'https://www.pna.gov.pt/' }
  ];
}

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

function mapClubToLinkItem(club: InfoCulturaClub): LinkItem {
  return {
    label: club.name,
    href: getClubHref(club),
    internal: true
  };
}

function translateMenuLabel(locale: 'pt' | 'en', value: string): string {
  if (locale === 'pt') return value;

  const map: Record<string, string> = {
    Instituição: 'Institution',
    'O ISPGAYA': 'About ISPGAYA',
    Organização: 'Organization',
    'Corpo Docente': 'Faculty',
    'Qualidade Institucional': 'Institutional Quality',
    'Etica e Boas Práticas': 'Ethics and Good Practices',
    'Emprego e Recrutamento': 'Jobs and Recruitment',
    'Titulo Especialista': 'Specialist Title',
    Contactos: 'Contacts',
    Ensino: 'Study',
    'Oferta Formativa': 'Study Offer',
    'Programas Avançados': 'Advanced Programmes',
    Candidaturas: 'Applications',
    'Bolsas e Financiamento': 'Scholarships and Funding',
    Empregabilidade: 'Employability',
    'Estágios e Emprego': 'Internships and Jobs',
    Alumni: 'Alumni',
    Investigação: 'Research',
    'Publicações Científicas': 'Scientific Publications',
    'Atividades Científicas': 'Scientific Activities',
    Biblioteca: 'Library',
    WIDESKILLS: 'WIDESKILLS',
    Politécnica: 'Polytechnic',
    Internacional: 'International',
    'Estudantes Internacionais': 'International Students',
    'Guia ECTS': 'ECTS Guide',
    'Laboratório Cultural': 'Cultural Lab',
    'Laboratorio Cultural': 'Cultural Lab',
    'Vida Academica': 'Academic Life',
    Notícias: 'News',
    Noticias: 'News',
    Eventos: 'Events',
    'Estudante ISPGAYA': 'ISPGAYA Student',
    'Associacao de Estudantes': 'Student Association',
    'Tuna Academica': 'Academic Tuna',
    'Clube de Leitura': 'Reading Club',
    'Clube de Teatro': 'Theatre Club',
    Politecnica: 'Polytechnic',
    'Perguntas Frequentes': 'Frequently Asked Questions',
    'Candidatura Online': 'Online Application',
    Horários: 'Timetables',
    Horarios: 'Timetables',
    'Área Privada': 'Private Area',
    'Links de Interesse': 'Useful Links'
  };

  return map[value] || value;
}

function localizeExternalUrl(locale: 'pt' | 'en', href: string): string {
  if (!href.startsWith('https://ispgaya.pt/') && !href.startsWith('https://international.ispgaya.pt/')) {
    return href;
  }

  return href
    .replace('https://ispgaya.pt/pt/', `https://ispgaya.pt/${locale}/`)
    .replace('https://ispgaya.pt/en/', `https://ispgaya.pt/${locale}/`)
    .replace('https://international.ispgaya.pt/pt', `https://international.ispgaya.pt/${locale}`)
    .replace('https://international.ispgaya.pt/en', `https://international.ispgaya.pt/${locale}`);
}

const menuItems: MenuItem[] = [
  {
    label: 'Instituição',
    href: 'https://ispgaya.pt/pt/instituicao',
    dropdown: [
      { label: 'O ISPGAYA', href: 'https://ispgaya.pt/pt/instituicao/ispgaya' },
      { label: 'Organização', href: 'https://ispgaya.pt/pt/instituicao/organizacao' },
      { label: 'Corpo Docente', href: 'https://ispgaya.pt/pt/instituicao/corpo-docente' },
      { label: 'Qualidade Institucional', href: 'https://ispgaya.pt/pt/instituicao/qualidade' },
      { label: 'Etica e Boas Práticas', href: 'https://ispgaya.pt/pt/instituicao/etica-e-boas-praticas' },
      { label: 'Emprego e Recrutamento', href: 'https://forms.office.com' },
      { label: 'Titulo Especialista', href: 'https://ispgaya.pt/pt/instituicao/titulo-especialista' },
      { label: 'Contactos', href: 'https://ispgaya.pt/pt/instituicao/contactos' }
    ]
  },
  {
    label: 'Ensino',
    href: 'https://ispgaya.pt/pt/ensino',
    dropdown: [
      { label: 'Oferta Formativa', href: 'https://ispgaya.pt/pt/ensino/oferta-formativa' },
      {
        label: 'Programas Avançados',
        href: 'https://ispgaya.pt/pt/ensino/programas-avancados'
      },
      { label: 'Candidaturas', href: 'https://ispgaya.pt/pt/ensino/candidaturas' },
      {
        label: 'Bolsas e Financiamento',
        href: 'https://ispgaya.pt/pt/ensino/bolsas-e-financiamento'
      }
    ]
  },
  {
    label: 'Empregabilidade',
    href: 'https://ispgaya.pt/pt/empregabilidade',
    dropdown: [
      {
        label: 'Estágios e Emprego',
        href: 'https://ispgaya.pt/pt/empregabilidade/estagios-e-emprego'
      },
      { label: 'Alumni', href: 'https://ispgaya.pt/pt/empregabilidade/alumni' }
    ]
  },
  {
    label: 'Investigação',
    href: 'https://ispgaya.pt/pt/investigacao',
    dropdown: [
      {
        label: 'Publicações Científicas',
        href: 'https://ispgaya.pt/pt/investigacao/publicacoes-cientificas'
      },
      {
        label: 'Atividades Científicas',
        href: 'https://ispgaya.pt/pt/investigacao/atividades-cientificas'
      },
      { label: 'Biblioteca', href: 'https://ispgaya.pt/pt/investigacao/biblioteca' },
      { label: 'WIDESKILLS', href: 'https://ispgaya.pt/pt/investigacao/wideskills' },
      { label: 'Politecnica', href: 'https://ispgaya.pt/pt/investigacao/politecnica-revista' }
    ]
  },
  {
    label: 'Internacional',
    href: 'https://ispgaya.pt/pt/internacional',
    dropdown: [
      { label: 'Estudantes Internacionais', href: 'https://international.ispgaya.pt/pt' },
      { label: 'Erasmus+', href: 'https://ispgaya.pt/pt/internacional/erasmus+' },
      { label: 'Guia ECTS', href: 'https://ispgaya.pt/pt/internacional/guia-ects' }
    ]
  },
  {
    label: 'Laboratório Cultural',
    href: '/laboratorio-cultural',
    internal: true,
    dropdown: undefined
  },
  {
    label: 'Vida Acadêmica',
    href: 'https://ispgaya.pt/pt/vida-academica',
    dropdown: [
      { label: 'Noticias', href: 'https://ispgaya.pt/pt/vida-academica/noticias' },
      { label: 'Eventos', href: 'https://ispgaya.pt/pt/vida-academica/eventos' },
      {
        label: 'Estudante ISPGAYA',
        href: 'https://ispgaya.pt/pt/vida-academica/estudante-ispgaya'
      },
      {
        label: 'Associação de Estudantes',
        href: 'https://ispgaya.pt/pt/vida-academica/associacao-estudantes'
      },
      { label: 'Tuna Acadêmica', href: 'https://ispgaya.pt/pt/vida-academica/tuna-academica' }
    ]
  }
];

function renderMenuLink(item: LinkItem, className: string, onClick?: () => void) {
  return item.internal ? (
    <Link to={item.href} className={className} onClick={onClick}>
      {item.label}
    </Link>
  ) : (
    <a href={item.href} className={className} onClick={onClick}>
      {item.label}
    </a>
  );
}

type HeaderNavProps = {
  transparent?: boolean;
};

function HeaderNav({ transparent = false }: HeaderNavProps) {
  const { locale, setLocale } = useLocale();
  const [laboratorioDropdown, setLaboratorioDropdown] = useState<LinkItem[]>(
    getDefaultLaboratorioDropdown(locale)
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileSection, setActiveMobileSection] = useState<string | null>(null);
  const mobilePrivateLinks: LinkItem[] = [
    { label: getLocaleText(locale, 'Inforestudante', 'Student Portal'), href: 'https://inforestudante.ispgaya.pt' },
    { label: getLocaleText(locale, 'Infordocente', 'Teacher Portal'), href: 'https://infordocente.ispgaya.pt' },
    { label: 'Infocultura', href: '/infocultura', internal: true },
    { label: getLocaleText(locale, 'Email', 'Email'), href: 'https://outlook.office.com' },
    { label: getLocaleText(locale, 'Horários', 'Timetables'), href: 'https://horarios.ispgaya.pt/geral/' }
  ];
  const mobileInterestLinks: LinkItem[] = [
    {
      label: getLocaleText(locale, 'Perguntas Frequentes', 'Frequently Asked Questions'),
      href: buildIspgayaUrl(locale, '/perguntas-frequentes')
    },
    {
      label: getLocaleText(locale, 'Candidatura Online', 'Online Application'),
      href: 'https://inforestudante.ispgaya.pt/nonio/security/preRegisto.do?origem=CANDIDATURAS'
    },
    { label: getLocaleText(locale, 'Contactos', 'Contacts'), href: buildIspgayaUrl(locale, '/instituicao/contactos') }
  ];

  useEffect(() => {
    let active = true;

    async function loadClubDropdown() {
      try {
        const clubs = await fetchPublicClubs();
        if (!active) return;

        setLaboratorioDropdown(
          clubs.length > 0
            ? [...clubs.map(mapClubToLinkItem), { label: 'PNA', href: 'https://www.pna.gov.pt/' }]
            : getDefaultLaboratorioDropdown(locale)
        );
      } catch {
        if (!active) return;
        setLaboratorioDropdown(getDefaultLaboratorioDropdown(locale));
      }
    }

    void loadClubDropdown();

    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      setActiveMobileSection(null);
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const resolvedMenuItems = menuItems.map((item) =>
    normalizeLabel(item.label) === 'laboratorio cultural'
      ? { ...item, dropdown: laboratorioDropdown }
      : item
  );

  const rootClassName = transparent
    ? 'border-white/10 bg-transparent text-white'
    : headerNav;
  const desktopMenuClassName = transparent
    ? 'relative z-[80] hidden items-center gap-7 xl:flex'
    : desktopMenu;
  const innerClassName = transparent
    ? 'flex items-center justify-between gap-6 py-5 lg:py-4'
    : headerNavInner;
  const linkClassName = transparent
    ? 'text-[16px] font-medium text-white transition-colors hover:text-[#f7c47a]'
    : navLink;
  const dropdownWrapClassName = transparent
    ? 'right-0 z-[90] absolute hidden w-72 pt-2 opacity-0 transition-opacity group-hover:block group-hover:opacity-100 group-focus-within:block group-focus-within:opacity-100'
    : navDropdownWrap;
  const mobileButtonClassName = transparent
    ? 'inline-flex h-11 w-11 items-center justify-center rounded-md  text-white transition-colors  lg:hidden'
    : mobileMenuButton;
  const logoSrc = transparent ? logoNegative : logo;
  const dropdownListClassName = transparent
    ? 'rounded border border-gray-100 bg-white px-4 py-3 text-slate-900 shadow-xl space-y-3'
    : navDropdownList;
  const dropdownItemClassName = transparent
    ? 'flex items-center font-medium text-slate-900 hover:text-[#dd8609] hover:underline underline-offset-2'
    : navDropdownItem;
  const dropdownAnchorClassName = transparent
    ? 'inline-block w-full py-0.5 text-inherit'
    : navDropdownAnchor;
  const localeLabel = getLocaleText(locale, 'Idioma', 'Language');
  const privateAreaLabel = getLocaleText(locale, 'Área Privada', 'Private Area');
  const interestLinksLabel = getLocaleText(locale, 'Links de Interesse', 'Useful Links');

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header className={rootClassName}>
      <div className={`${container} ${innerClassName} px-6 sm:px-6 lg:px-3`}>
        <Link to="/" className={brandWrap}>
          <img src={logoSrc} alt="ISPGAYA" className={brandLogo} />
        </Link>

        <nav className={desktopMenuClassName} aria-label={getLocaleText(locale, 'Principal', 'Primary')}>
          {resolvedMenuItems.map((item) =>
            item.dropdown ? (
              <div key={item.label} className={navItemGroup}>
                {renderMenuLink(
                  {
                    ...item,
                    label: translateMenuLabel(locale, item.label),
                    href: localizeExternalUrl(locale, item.href)
                  },
                  linkClassName
                )}
                <div className={dropdownWrapClassName}>
                  <ul className={dropdownListClassName}>
                    {item.dropdown.map((child) => (
                      <li key={child.label} className={dropdownItemClassName}>
                        {renderMenuLink(
                          {
                            ...child,
                            label: translateMenuLabel(locale, child.label),
                            href: localizeExternalUrl(locale, child.href)
                          },
                          dropdownAnchorClassName
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div key={item.label}>
                {renderMenuLink(
                  {
                    ...item,
                    label: translateMenuLabel(locale, item.label),
                    href: localizeExternalUrl(locale, item.href)
                  },
                  linkClassName
                )}
              </div>
            )
          )}
        </nav>

        <button
          type="button"
          className={mobileButtonClassName}
          onClick={() => {
            setIsMobileMenuOpen((value) => {
              const nextValue = !value;
              if (nextValue) {
                setActiveMobileSection(resolvedMenuItems[0]?.label ?? null);
              }
              return nextValue;
            });
          }}
          aria-expanded={isMobileMenuOpen}
          aria-label={
            isMobileMenuOpen
              ? getLocaleText(locale, 'Fechar menu', 'Close menu')
              : getLocaleText(locale, 'Abrir menu', 'Open menu')
          }
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <span className="flex h-5 w-5 flex-col items-center justify-center gap-1.5" aria-hidden="true">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          )}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-transparent"
            onClick={closeMobileMenu}
            aria-label="Fechar menu"
          />

          <div className="absolute inset-0 overflow-y-auto bg-white text-slate-900">
            <div className={`${container} px-6 py-5 sm:px-8 lg:px-3`}>
              <div className="flex w-full items-center justify-between gap-4">
                <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
                  <img src={logo} alt="ISPGAYA" className="h-12 w-auto" />
                </Link>

                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-700 transition hover:text-[#dd8609]"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <div className={`${container} px-6 pb-8 sm:px-8 lg:px-3`}>
                <div className="w-full">
                  <div className="mb-7 flex items-center justify-start gap-3 text-sm font-semibold text-slate-700">
                    <button
                      type="button"
                      title={localeLabel}
                      className={locale === 'pt' ? 'text-[#dd8609]' : 'text-slate-500 hover:text-[#dd8609]'}
                      onClick={() => setLocale('pt')}
                      aria-pressed={locale === 'pt'}
                    >
                      PT
                    </button>
                    <button
                      type="button"
                      title={localeLabel}
                      className={locale === 'en' ? 'text-[#dd8609]' : 'text-slate-500 hover:text-[#dd8609]'}
                      onClick={() => setLocale('en')}
                      aria-pressed={locale === 'en'}
                    >
                      EN
                    </button>
                  </div>
                {resolvedMenuItems.map((item) => {
                  const isExpanded = activeMobileSection === item.label;
                  const hasDropdown = Boolean(item.dropdown && item.dropdown.length > 0);

	                  return (
	                    <div key={item.label} className="py-1.5">
	                      <div className="flex items-center justify-between gap-3">
	                        {renderMenuLink(
                          {
                            ...item,
                            label: translateMenuLabel(locale, item.label),
                            href: localizeExternalUrl(locale, item.href)
                          },
	                          'block flex-1 py-2 text-left text-[18px] font-medium leading-tight text-[#3f4a58] transition-colors hover:text-[#dd8609]',
	                          closeMobileMenu
	                        )}
	                        {hasDropdown ? (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMobileSection((current) =>
                                current === item.label ? null : item.label
                              )
                            }
	                            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition hover:text-[#dd8609]"
	                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? getLocaleText(locale, 'Fechar submenu', 'Close submenu')
                                : getLocaleText(locale, 'Abrir submenu', 'Open submenu')
                            }
                          >
                            <ChevronDown
                              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        ) : null}
                      </div>

	                      {hasDropdown && isExpanded ? (
	                        <div className="mt-1 pb-2 pl-4">
	                          {item.dropdown?.map((child) => (
	                            <div key={child.label}>
	                              {renderMenuLink(
                                {
                                  ...child,
                                  label: translateMenuLabel(locale, child.label),
                                  href: localizeExternalUrl(locale, child.href)
                                },
	                                'block py-2 text-left text-[15px] font-medium text-slate-600 transition-colors hover:text-[#dd8609]',
	                                closeMobileMenu
	                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                
	                  <div className="mt-8 flex items-center justify-start gap-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
	                    <Lock className="h-4 w-4" />
	                    <span>{privateAreaLabel}</span>
	                  </div>
	                  <div className="mt-3 grid gap-2 text-left">
	                    {mobilePrivateLinks.map((item) => (
	                      <div key={item.label}>
	                        {renderMenuLink(
	                          item,
	                          'block py-1 text-left text-[15px] font-medium text-[#3f4a58] transition-colors hover:text-[#dd8609]',
	                          closeMobileMenu
	                        )}
                      </div>
                    ))}
                  </div>
                

	                  <div className="mt-8 flex items-center justify-start gap-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
	                    <Zap className="h-4 w-4" />
	                    <span>{interestLinksLabel}</span>
	                  </div>
                  <div className="mt-3 grid gap-2 text-left">
                    {mobileInterestLinks.map((item) => (
                      <div key={item.label}>
	                        {renderMenuLink(
	                          item,
	                          'block py-1 text-left text-[15px] font-medium text-[#3f4a58] transition-colors hover:text-[#dd8609]',
	                          closeMobileMenu
	                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default HeaderNav;
