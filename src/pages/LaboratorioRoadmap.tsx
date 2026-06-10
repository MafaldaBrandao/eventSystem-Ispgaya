import Breadcrumbs from '../components/ui/Breadcrumbs';
import Footer from '../components/layout/Footer';
import HeaderNav from '../components/layout/HeaderNav';
import TopBar from '../components/layout/TopBar';
import { getLocaleText, useLocale } from '../i18n/locale.js';
import { container, mainContent } from '../styles/ui';

function LaboratorioRoadmap() {
  const { locale } = useLocale();
  const contentBlocks =
    locale === 'en'
      ? [
          {
            title: 'Mission',
            text: 'Promote culture within the academic community, encouraging participation, creativity and the sharing of experiences. The Cultural Lab acts as a meeting point for students, teachers, staff and external partners, creating conditions for ideas to become projects with real impact.'
          },
          {
            title: 'Goals',
            items: [
              'Encourage participation in cultural activities',
              'Promote cultural events and initiatives',
              'Stimulate creativity and critical thinking',
              'Bring students closer to culture inside and outside the institution',
              'Support collaboration between clubs, academic areas and the surrounding community',
              'Value artistic expression as part of academic and personal development'
            ]
          },
          {
            title: 'How we work',
            text: 'The laboratory promotes an open and collaborative model, where proposals can emerge from the community and be developed with guidance, planning and visibility. Each initiative is designed to connect learning, cultural practice and active participation.'
          },
          {
            title: 'Impact',
            items: [
              'Create more opportunities for students to participate in cultural life',
              'Strengthen the identity of the academic community',
              'Encourage interdisciplinary projects and public presentation moments',
              'Make cultural information easier to access and understand'
            ]
          }
        ]
      : [
          {
            title: 'Missão',
            text: 'Promover a cultura na comunidade académica, incentivando a participação, a criatividade e a partilha de experiências. O Laboratório Cultural funciona como ponto de encontro entre estudantes, docentes, colaboradores e parceiros externos, criando condições para que ideias se transformem em projetos com impacto real.'
          },
          {
            title: 'Objetivos',
            items: [
              'Incentivar a participação em atividades culturais',
              'Divulgar eventos e iniciativas culturais',
              'Estimular a criatividade e o pensamento crítico',
              'Aproximar os estudantes da cultura dentro e fora da instituição',
              'Apoiar a colaboração entre clubes, áreas académicas e comunidade envolvente',
              'Valorizar a expressão artística como parte do desenvolvimento académico e pessoal'
            ]
          },
          {
            title: 'Como atuamos',
            text: 'O laboratório promove um modelo aberto e colaborativo, onde as propostas podem surgir da comunidade e ser desenvolvidas com acompanhamento, planeamento e visibilidade. Cada iniciativa procura ligar aprendizagem, prática cultural e participação ativa.'
          },
          {
            title: 'Impacto',
            items: [
              'Criar mais oportunidades para os estudantes participarem na vida cultural',
              'Reforçar a identidade da comunidade académica',
              'Estimular projetos interdisciplinares e momentos de apresentação pública',
              'Tornar a informação cultural mais acessível e fácil de compreender'
            ]
          }
        ];

  return (
    <>
      <TopBar />
      <HeaderNav />
      <Breadcrumbs
        title={getLocaleText(locale, 'Missão e Objetivos', 'Mission and Goals')}
        description={getLocaleText(
          locale,
          'O Laboratório Cultural é um espaço vivo onde a criatividade ganha forma e a cultura se torna experiência.',
          'The Cultural Lab is a living space where creativity takes shape and culture becomes an experience.'
        )}
        parentLabel={getLocaleText(locale, 'Laboratorio Cultural', 'Cultural Lab')}
        parentHref="/laboratorio-cultural"
        currentLabel={getLocaleText(locale, 'Missão e Objetivos', 'Mission and Goals')}
        currentHref="/laboratorio-cultural/roadmap"
      />

      <main className={mainContent}>
        <section className="py-6 sm:py-10 md:py-14">
          <div className={`${container} px-4 sm:px-6 lg:px-3 xl:px-8`}>
            <div className="w-full max-w-4xl">
              <article className="w-full overflow-hidden">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
                  {contentBlocks.map((item) => (
                    <section key={item.title} className="min-w-0 border-t border-slate-200 pt-5">
                      <h3 className="break-words font-heading text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
                        {item.title}
                      </h3>

                      {'text' in item ? (
                        <p className="mt-3 break-words text-sm leading-7 text-slate-700 sm:text-base">{item.text}</p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {item.items.map((objective) => (
                            <div key={objective} className="flex items-start gap-3">
                              <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[#dd8609]" />
                              <p className="min-w-0 break-words text-sm leading-7 text-slate-700 sm:text-base">{objective}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>

                <div className="mt-10 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                  <a
                    href="/laboratorio-cultural"
                    className="w-full rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-[#dd8609] hover:text-[#dd8609] sm:w-auto"
                  >
                    {getLocaleText(locale, 'Voltar ao laboratório', 'Back to lab')}
                  </a>
                  <a
                    href="/laboratorio-cultural"
                    className="w-full rounded-md bg-[#dd8609] px-4 py-2 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
                  >
                    {getLocaleText(locale, 'Explorar laboratório', 'Explore lab')}
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default LaboratorioRoadmap;
