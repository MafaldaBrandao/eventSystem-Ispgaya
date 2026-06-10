import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  footerBottomContainer,
  footerBottomCopyright,
  footerBottomGaia,
  footerBottomInner,
  footerBottomLink,
  footerBottomLinks,
  footerBottomSeparator,
  footerBottomText,
  footerBottomUpdated,
  footerBrand,
  footerCertIcon,
  footerCertRow,
  footerCol,
  footerContactAddress,
  footerContactEmail,
  footerContactHint,
  footerContactPhone,
  footerContactStrong,
  footerFollowTitle,
  footerGrid,
  footerLink,
  footerList,
  footerListItem,
  footerLogo,
  footerSection,
  footerSocialIcon,
  footerSocialLink,
  footerSocialLinks,
  footerSrOnly,
  footerSubTitle,
  footerTitle,
  footerWrap
} from '../../styles/ui';
import iso14001 from '../../assets/ISO-14001.svg';
import iso21001 from '../../assets/ISO-21001.svg';
import iso9001 from '../../assets/ISO-9001.svg';
import gaiaSkyline from '../../assets/gaia-skyline.webp';
import logoNegative from '../../assets/ispgaya-logo-negative.svg';
import { useLocale, getLocaleText } from '../../i18n/locale.js';
import { buildIspgayaUrl } from '../../i18n/urls.js';

function Footer() {
  const { locale } = useLocale();
  const hubLinks: { name: string; link: string }[] = [
    { name: getLocaleText(locale, 'Inforestudante', 'Student Portal'), link: 'https://inforestudante.ispgaya.pt' },
    { name: getLocaleText(locale, 'Infordocente', 'Teacher Portal'), link: 'https://infordocente.ispgaya.pt' },
    { name: 'Infocultura', link: '/infocultura' },
    { name: getLocaleText(locale, 'Email', 'Email'), link: 'https://outlook.office.com' },
    { name: getLocaleText(locale, 'Horários', 'Timetables'), link: 'https://horarios.ispgaya.pt/geral/' },
    { name: getLocaleText(locale, 'Palavra-passe', 'Password'), link: buildIspgayaUrl(locale, '/perguntas-frequentes') },
    { name: getLocaleText(locale, 'Cartão ISPGAYA', 'ISPGAYA Card'), link: buildIspgayaUrl(locale, '/vida-academica/estudante-ispgaya') },
    { name: getLocaleText(locale, 'Identidade Visual', 'Visual Identity'), link: buildIspgayaUrl(locale, '/instituicao/ispgaya') }
  ];
  const ensinoLinks = [
    { label: getLocaleText(locale, 'CTeSP', 'HND'), href: buildIspgayaUrl(locale, '/ensino/oferta-formativa/ctesp') },
    { label: getLocaleText(locale, 'Licenciaturas', 'Bachelor Degrees'), href: buildIspgayaUrl(locale, '/ensino/oferta-formativa/licenciaturas') },
    { label: getLocaleText(locale, 'Mestrados', 'Masters'), href: buildIspgayaUrl(locale, '/ensino/oferta-formativa/mestrados') },
    { label: getLocaleText(locale, 'Pós-Graduações', 'Postgraduate Studies'), href: buildIspgayaUrl(locale, '/ensino/programas-avancados/pos-graduacoes') },
    { label: getLocaleText(locale, 'Candidaturas', 'Applications'), href: buildIspgayaUrl(locale, '/ensino/candidaturas') },
    { label: getLocaleText(locale, 'Bolsas e Financiamento', 'Scholarships and Funding'), href: buildIspgayaUrl(locale, '/ensino/bolsas-e-financiamento') },
    { label: getLocaleText(locale, 'Programas Avançados', 'Advanced Programmes'), href: buildIspgayaUrl(locale, '/ensino/programas-avancados') }
  ];

  const interesseLinks = [
    { label: 'DGES', href: 'https://www.dges.gov.pt' },
    { label: 'A3ES', href: 'https://www.a3es.pt' },
    { label: 'Ciencia Vitae', href: 'https://www.cienciavitae.pt' },
    { label: getLocaleText(locale, 'Governo de Portugal', 'Government of Portugal'), href: 'https://www.portugal.gov.pt' },
    { label: getLocaleText(locale, 'Projetos Cofinanciados', 'Co-financed Projects'), href: 'https://ispgaya.pt/projetos-cofinanciados' },
    { label: getLocaleText(locale, 'Repositório de Documentos', 'Document Repository'), href: buildIspgayaUrl(locale, '/repositorio-de-documentos') }
  ];
  const text = {
    follow: getLocaleText(locale, 'Segue-nos', 'Follow us'),
    ensino: getLocaleText(locale, 'Ensino', 'Study'),
    hub: getLocaleText(locale, 'ISPGAYA HUB', 'ISPGAYA HUB'),
    interest: getLocaleText(locale, 'Links de Interesse', 'Useful Links'),
    contacts: getLocaleText(locale, 'Contactos', 'Contacts'),
    callHint: getLocaleText(
      locale,
      'O valor da chamada corresponde ao valor de uma chamada para a rede fixa, em funcao do seu plano tarifario.',
      'Call charges depend on your tariff plan and are billed as a fixed-line call.'
    ),
    updated: getLocaleText(locale, 'Atualizado em 02/03/2026 - 12:28', 'Updated on 02/03/2026 - 12:28'),
    terms: getLocaleText(locale, 'Termos e Condições', 'Terms and Conditions'),
    privacy: getLocaleText(locale, 'Política de Privacidade', 'Privacy Policy')
  };

  return (
    <footer className={footerWrap}>
      <section className={footerSection}>
        <div className={footerGrid}>
          <div className={footerBrand}>
            <img src={logoNegative} width={175} height={54} className={footerLogo} alt="ISPGAYA" />
            <p className={footerFollowTitle}>{text.follow}</p>
            <div className={footerSocialLinks}>
              <a href="https://www.facebook.com/ispgaya/" className={footerSocialLink}>
                <span className={footerSrOnly}>ISPGAYA Facebook</span>
                <Facebook className={footerSocialIcon} aria-hidden="true" />
              </a>
              <a href="https://www.instagram.com/ispgaya/" className={footerSocialLink}>
                <span className={footerSrOnly}>ISPGAYA Instagram</span>
                <Instagram className={footerSocialIcon} aria-hidden="true" />
              </a>
              <a href="https://www.linkedin.com/school/ispgaya/" className={footerSocialLink}>
                <span className={footerSrOnly}>ISPGAYA LinkedIn</span>
                <Linkedin className={footerSocialIcon} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className={footerCol}>
            <p className={footerTitle}>{text.ensino}</p>
            <ul className={footerList}>
              {ensinoLinks.map((item) => (
                <li key={item.label} className={footerListItem}>
                  <a href={item.href} className={footerLink}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={footerCol}>
            <p className={footerTitle}>{text.hub}</p>
            <ul className={footerList}>
              {hubLinks.map((item) => (
                <li key={item.name} className={footerListItem}>
                  {item.link === '/infocultura' ? (
                    <Link to={item.link} className={footerLink}>
                      {item.name}
                    </Link>
                  ) : (
                    <a href={item.link} className={footerLink}>
                      {item.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className={footerCol}>
            <p className={footerSubTitle}>{text.interest}</p>
            <ul className={footerList}>
              {interesseLinks.map((item) => (
                <li key={item.label} className={footerListItem}>
                  <a href={item.href} className={footerLink}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={footerCol}>
            <p className={footerTitle}>{text.contacts}</p>
            <address className={footerContactAddress}>
              <p className={footerContactStrong}>Av. dos Descobrimentos, 333</p>
              <p className={footerContactStrong}>4400-103 Santa Marinha - V.N.Gaia</p>
              <p className={footerContactPhone}>
                (+351) 223 745 730 <span className={footerContactHint}>{text.callHint}</span>
              </p>
              <p className={footerContactEmail}>info@ispgaya.pt</p>
            </address>

            <div className={footerCertRow}>
              <img className={footerCertIcon} src={iso9001} alt="ISO 9001" width={142} height={155} />
              <img className={footerCertIcon} src={iso21001} alt="ISO 21001" width={404} height={446} />
              <img className={footerCertIcon} src={iso14001} alt="ISO 14001" width={404} height={446} />
            </div>
          </div>
        </div>

        <div className={footerBottomContainer}>
          <div className={footerBottomInner}>
            <div className={footerBottomText}>
              <span className={footerBottomCopyright}>© 2026 Instituto Superior Politecnico Gaya</span>
              <span className={footerBottomUpdated}>{text.updated}</span>
            </div>

            <div className={footerBottomLinks}>
              <a href={buildIspgayaUrl(locale, '/legal/termos-e-condicoes')} className={footerBottomLink}>
                {text.terms}
              </a>
              <span className={footerBottomSeparator}>/</span>
              <a href={buildIspgayaUrl(locale, '/legal/politica-de-privacidade')} className={footerBottomLink}>
                {text.privacy}
              </a>
            </div>
          </div>
        </div>
      </section>

      <img src={gaiaSkyline} width={795} height={140} className={footerBottomGaia} alt="Vila Nova de Gaia" />
    </footer>
  );
}

export default Footer;
