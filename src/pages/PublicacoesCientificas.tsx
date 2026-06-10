import Breadcrumbs from '../components/ui/Breadcrumbs';
import DocumentRow from '../components/ui/DocumentRow';
import Footer from '../components/layout/Footer';
import HeaderNav from '../components/layout/HeaderNav';
import PieChartHero from '../components/ui/PieChartHero';
import StatCard from '../components/ui/StatCard';
import TopBar from '../components/layout/TopBar';
import { getLocaleText, useLocale } from '../i18n/locale.js';
import {
  blockText,
  blockTitle,
  container,
  docsList,
  docsSection,
  mainContent,
  pieSection,
  sectionSpace,
  statsGrid,
  statsSection
} from '../styles/ui';

const stats = [
  { value: 611, label: 'Publicacoes' },
  { value: 43, label: 'Livros' },
  { value: 162, label: 'Capitulos' },
  { value: 292, label: 'Artigos Cientificos' },
  { value: 114, label: 'Artigos em atas' }
];

const document = {
  name: 'Publicacoes Cientificas 2010-2024-janeiro.pdf',
  meta: '853KB',
  href: '#'
};

function PublicacoesCientificas() {
  const { locale } = useLocale();
  return (
    <>
      <TopBar />
      <HeaderNav />
      <Breadcrumbs
        title={getLocaleText(locale, 'Publicacoes Cientificas', 'Scientific Publications')}
        description={getLocaleText(
          locale,
          'O ISPGAYA desenvolve investigacao cientifica nas diversas areas em que oferece formacao, resultando em publicacoes, livros, capitulos e artigos cientificos.',
          'ISPGAYA develops scientific research across the areas in which it teaches, resulting in publications, books, chapters and scientific articles.'
        )}
      />

      <main className={mainContent}>
        <section className={statsSection}>
          <div className={container}>
            <h2 className={blockTitle}>{getLocaleText(locale, 'Research at ISPGAYA', 'Research at ISPGAYA')}</h2>
            <p className={blockText}>
              {getLocaleText(
                locale,
                'A producao cientifica institucional tem registado crescimento sustentado, refletindo colaboracao nacional e internacional em diferentes areas de conhecimento.',
                'Institutional scientific output has shown sustained growth, reflecting national and international collaboration across different fields of knowledge.'
              )}
            </p>
            <div className={statsGrid}>
              {stats.map((item) => (
                <StatCard key={item.label} value={item.value} label={item.label} />
              ))}
            </div>
          </div>
        </section>

        <section className={pieSection}>
          <div className={container}>
            <PieChartHero />
          </div>
        </section>

        <section className={docsSection}>
          <div className={`${container} ${sectionSpace}`}>
            <h2 className={blockTitle}>{getLocaleText(locale, 'Documentos', 'Documents')}</h2>
            <div className={docsList}>
              <DocumentRow name={document.name} meta={document.meta} href={document.href} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default PublicacoesCientificas;
