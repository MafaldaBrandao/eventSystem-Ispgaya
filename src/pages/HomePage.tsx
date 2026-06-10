import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Footer from '../components/layout/Footer';
import HeaderNav from '../components/layout/HeaderNav';
import NewsHighlightsSection, {
  type NewsHighlightItem
} from '../components/ui/NewsHighlightsSection';
import BestBooksSection from '../components/sections/BestBooksSection.js';
import TopBar from '../components/layout/TopBar';
import heroWelcomeImage from '../assets/homepage/candidatar/ispg-students-admissions.webp';
import heroStudyImage from '../assets/homepage/candidatar/ispgaya-students-grants.webp';
import heroEmployabilityImage from '../assets/homepage/candidatar/ispgaya-students-help.webp';
import imagem1 from '../assets/backgroundphotos/bem-vindos-estudantes-ispgaya.webp';
import imagem2 from '../assets/backgroundphotos/empregabilidade-ispgaya.webp';
import imagem3 from '../assets/backgroundphotos/estudar-no-ispagaya.webp';
import aondefuturo from '../assets/homepage/ondefuturo.webp';
import helix from '../assets/homepage/destaques/helix-ispgaya-site.webp';
import mais23 from '../assets/homepage/destaques/3.webp';
import manuel from '../assets/homepage/testemunhos/2.webp';
import maribel from '../assets/homepage/testemunhos/1.webp';
import {
  fetchPublicBooks,
  fetchPublicEvents,
  fetchPublicNews,
  InfoCulturaBook,
  resolveInfoCulturaAssetUrl
} from '../api/infoculturaApi';
import { container, mainContent } from '../styles/ui';
import { getLocaleText, useLocale } from '../i18n/locale.js';
import { buildIspgayaUrl } from '../i18n/urls.js';

  

type HeroSlide = {
  title: string;
  text: string;
  image: string;
};

type HighlightCard = {
  title: string;
  text: string;
  href: string;
  image: string;
};

type SupportSlide = {
  title: string;
  text: string;
  href: string;
  image: string;
};

type TestimonialSlide = {
  quote: string;
  name: string;
  role: string;
  image: string;
};

function getStudyLinks(locale: 'pt' | 'en') {
  return [
    { label: getLocaleText(locale, 'CTeSP', 'HND'), href: buildIspgayaUrl(locale, '/ensino/oferta-formativa/ctesp') },
    { label: getLocaleText(locale, 'Licenciaturas', 'Bachelor Degrees'), href: buildIspgayaUrl(locale, '/ensino/oferta-formativa/licenciaturas') },
    { label: getLocaleText(locale, 'Mestrados', 'Masters'), href: buildIspgayaUrl(locale, '/ensino/oferta-formativa/mestrados') },
    {
      label: getLocaleText(locale, 'Pós-Graduações', 'Postgraduate Studies'),
      href: buildIspgayaUrl(locale, '/ensino/programas-avancados/pos-graduacoes')
    }
  ];
}

function getHeroSlides(locale: 'pt' | 'en'): HeroSlide[] {
  return [
    {
      title: getLocaleText(locale, 'Bem-vindo ao Instituto Superior Politécnico Gaya', 'Welcome to the Polytechnic Institute of Gaya'),
      text: getLocaleText(
        locale,
        'Aqui, é onde o teu futuro começa!\nNo ISPGAYA vais adquirir novos conhecimentos, desenvolver novas competências e experienciar um clima académico único.',
        'This is where your future begins!\nAt ISPGAYA you will gain new knowledge, develop new skills and experience a unique academic environment.'
      ),
      image: imagem1
    },
    {
      title: getLocaleText(locale, 'Dinamiza as tuas capacidades connosco', 'Develop your skills with us'),
      text: getLocaleText(
        locale,
        'Temos à tua disposição instalações modernas, estreita proximidade entre o corpo docente e os estudantes, assim como, um excelente ambiente académico.',
        'We offer modern facilities, close proximity between faculty and students, and an excellent academic atmosphere.'
      ),
      image: imagem2
    },
    {
      title: getLocaleText(locale, 'O mercado de trabalho espera por ti', 'The job market is waiting for you'),
      text: getLocaleText(
        locale,
        'Temos como objetivo dar-te as ferramentas necessárias para criar uma carreira com significado e tomares as melhores decisões para a tua vida profissional e pessoal.',
        'Our goal is to give you the tools you need to build a meaningful career and make the best decisions for your professional and personal life.'
      ),
      image: imagem3
    }
  ];
}

function getHighlightCards(locale: 'pt' | 'en'): HighlightCard[] {
  return [
    {
      title: getLocaleText(locale, 'Laboratório Cultural', 'Cultural Laboratory'),
      text: getLocaleText(
        locale,
        'Projeto cultural aberto a quem quer participar em atividades nas áreas da musica, teatro e leitura.',
        'A cultural project open to anyone who wants to take part in activities in music, theatre and reading.'
      ),
      href: '/laboratorio-cultural',
      image: helix
    },
    {
      title: getLocaleText(locale, 'Regime M23 - Candidaturas Abertas!', 'M23 Scheme - Applications Open!'),
      text: getLocaleText(locale, 'Estão abertas as candidaturas ao Regime M23!', 'Applications for the M23 scheme are now open!'),
      href: buildIspgayaUrl(locale, '/ensino/candidaturas/licenciaturas/m-23'),
      image: mais23
    },
    {
      title: getLocaleText(locale, 'O ISPGAYA junta-se à Q-Helix Alliance!', 'ISPGAYA joins Q-Helix Alliance!'),
      text: getLocaleText(
        locale,
        'É com grande satisfação que anunciamos que o ISPGAYA – Instituto Superior Politécnico de Gaia passou a integrar oficialmente a Q-Helix Alliance, uma rede europeia em crescimento dedicada ao reforço da cooperação no ensino superior, investigação e inovação.',
        'We are pleased to announce that ISPGAYA - Instituto Superior Politécnico de Gaia has officially joined the Q-Helix Alliance, a growing European network dedicated to strengthening cooperation in higher education, research and innovation.'
      ),
      href: buildIspgayaUrl(locale, '/vida-academica/noticias/o-ispgaya-junta-se-a-q-helix-alliance'),
      image: helix
    }
  ];
}

function getMetrics(locale: 'pt' | 'en') {
  return [
    {
      value: '36',
      title: getLocaleText(locale, 'Experiência', 'Experience'),
      text: getLocaleText(
        locale,
        'Desde 1990 a formar futuros empreendedores. Somos uma instituição de ensino de referência há mais de 30 anos em Vila Nova de Gaia. Quer pela qualidade dos seus cursos, quer pelo corpo docente qualificado, quer pelo clima académico estimulante e diferenciador.',
        'Since 1990, we have been shaping future entrepreneurs. We have been a benchmark higher education institution for more than 30 years in Vila Nova de Gaia, known for the quality of our courses, our qualified faculty and our stimulating academic atmosphere.'
      )
    },
    {
      value: '+3.5k',
      title: getLocaleText(locale, 'Profissionais Formados', 'Graduates'),
      text: getLocaleText(
        locale,
        'A formação continua a ser um dos nossos principais pilares. Somos reconhecidos pela formação de excelência e já formamos mais de 3500 profissionais de sucesso. Aqui os estudantes têm oportunidade de construir o seu futuro pessoal e profissional.',
        'Training remains one of our main pillars. We are recognized for excellence in education and have already trained more than 3,500 successful professionals. Here students have the opportunity to build their personal and professional future.'
      )
    },
    {
      value: '+200',
      title: getLocaleText(locale, 'Empresas', 'Companies'),
      text: getLocaleText(
        locale,
        'Trabalhamos em proximidade com as empresas, estando atentos às suas necessidades e a par das suas aspirações. Temos protocolos celebrados com mais de 200 empresas que garantem a qualidade dos estágios e permitem a integração de estudantes no mercado de trabalho.',
        'We work closely with companies, paying attention to their needs and aspirations. We have agreements with more than 200 companies that ensure quality internships and help students enter the job market.'
      )
    }
  ];
}

function getSupportSlides(locale: 'pt' | 'en'): SupportSlide[] {
  return [
    {
      title: getLocaleText(locale, 'Quero Candidatar-me', 'I want to apply'),
      text: getLocaleText(
        locale,
        'Sabias que podes realizar a tua candidatura online? Começa aqui a candidatura a um dos nossos cursos.',
        'Did you know you can submit your application online? Start here for one of our courses.'
      ),
      href: 'https://inforestudante.ispgaya.pt/nonio/security/preRegisto.do?origem=CANDIDATURAS',
      image: heroWelcomeImage
    },
    {
      title: getLocaleText(locale, 'Bolsas e Apoios', 'Scholarships and Support'),
      text: getLocaleText(
        locale,
        'Fica a saber como funcionam as bolsas de estudo e os apoios disponíveis para candidatos.',
        'Learn how scholarships and support options work for applicants.'
      ),
      href: buildIspgayaUrl(locale, '/ensino/bolsas-e-financiamento'),
      image: heroStudyImage
    },
    {
      title: getLocaleText(locale, 'Acesso ao Ensino Superior', 'Higher Education Access'),
      text: getLocaleText(
        locale,
        'Existem várias formas de ingressar no ISPGAYA. Aqui tens um ponto de entrada simples para perceber tudo.',
        'There are several ways to join ISPGAYA. Here is a simple entry point to understand everything.'
      ),
      href: buildIspgayaUrl(locale, '/ensino/candidaturas'),
      image: heroEmployabilityImage
    }
  ];
}

function getTestimonialSlides(locale: 'pt' | 'en'): TestimonialSlide[] {
  return [
    {
      quote: getLocaleText(
        locale,
        'De forma a consolidar os conhecimentos na área da segurança de informação e cibersegurança, optei pelo mestrado do ISPGAYA pela diversidade de oportunidades e pela transversalidade das competências adquiridas.',
        'To consolidate my knowledge in information security and cybersecurity, I chose ISPGAYA\'s master\'s degree for the diversity of opportunities and the breadth of skills I acquired.'
      ),
      name: 'Manuel Oliveira',
      role: getLocaleText(locale, 'Estudante de Mestrado', 'Master\'s student'),
      image: manuel
    },
    {
      quote: getLocaleText(
        locale,
        'Escolhi o ISPGAYA por recomendação de outros alunos e da mesma forma também, eu o recomendo. A maioria dos professores e colaboradores que me acompanharam ao longo da minha licenciatura em gestão foram sempre muito prestáveis e cada um com a sua função proporcionaram me momento inesquecíveis que me enriqueceram para o meu futuro. Por isso quero desde já agradecer a todas as pessoas que me acompanharam, porque em cada dia que estiveram presentes na minha vida deixaram o seu contributo para a minha realização pessoal e profissional, muito obrigada.',
        'I chose ISPGAYA on the recommendation of other students and I would recommend it as well. Most of the teachers and staff who supported me throughout my management degree were always very helpful, and each of them contributed unforgettable moments that enriched my future. I would like to thank everyone who supported me, because every day they were present in my life they contributed to my personal and professional growth.'
      ),
      name: 'Maribel Carvalho',
      role: getLocaleText(locale, 'Estudante ISPGAYA', 'ISPGAYA student'),
      image: maribel
    }
  ];
}

function HomePage() {
  const [activeHero, setActiveHero] = useState(0);
  const [activeSupport, setActiveSupport] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const testimonialTouchStartX = useRef<number | null>(null);
  const [homepageNewsHighlights, setHomepageNewsHighlights] = useState<NewsHighlightItem[]>([]);
  const [homepageEventHighlights, setHomepageEventHighlights] = useState<NewsHighlightItem[]>([]);
  const [homepageBookHighlights, setHomepageBookHighlights] = useState<InfoCulturaBook[]>([]);
  const { locale } = useLocale();
  const studyLinks = getStudyLinks(locale);
  const heroSlides = getHeroSlides(locale);
  const highlightCards = getHighlightCards(locale);
  const metrics = getMetrics(locale);
  const supportSlides = getSupportSlides(locale);
  const testimonialSlides = getTestimonialSlides(locale);
  const copy = locale === 'en'
    ? {
        futureTitle: 'Where the Future Takes You',
        highlightsTitle: 'Highlights',
        metricsCta: 'The ISPGAYA experience in numbers and opportunities.',
      }
    : {
        futureTitle: 'Onde o Futuro Te Leva',
        highlightsTitle: 'Destaques',
        metricsCta: 'A experiência ISPGAYA em números e oportunidades.',
      };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHero((current) => (current + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setIsHeaderSolid(window.scrollY > 40);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadHomepageNews() {
      try {
        const newsItems = await fetchPublicNews();
        if (!active) return;

            const items = newsItems
          .slice()
          .sort((left, right) => {
            const leftTime = new Date(left.published_at || left.created_at).getTime();
            const rightTime = new Date(right.published_at || right.created_at).getTime();
            return rightTime - leftTime;
          })
          .slice(0, 3)
            .map((item) => ({
            title: item.title,
            href: `/vida-academica/noticias/${item.id}`,
            internal: true,
            excerpt: item.summary,
            image: resolveInfoCulturaAssetUrl(item.image),
            imageAlt: item.title,
            publishedAt: item.published_at || item.created_at,
            publishedLabel: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            }).format(new Date(item.published_at || item.created_at)),
            tags: item.club_name
              ? [{ label: `#${item.club_name.toLowerCase().replace(/\s+/g, '')}`, href: '/vida-academica/noticias' }]
              : []
          }));

        setHomepageNewsHighlights(items);
      } catch {
        if (!active) return;
        setHomepageNewsHighlights([]);
      }
    }

    async function loadHomepageEvents() {
      try {
        const events = await fetchPublicEvents();
        if (!active) return;

        const items = events
          .slice()
          .sort((left, right) => {
            const leftTime = new Date(left.start_date || left.event_date).getTime();
            const rightTime = new Date(right.start_date || right.event_date).getTime();
            return rightTime - leftTime;
          })
          .slice(0, 3)
            .map((item) => ({
            title: item.title,
            href: `/vida-academica/eventos/${item.id}`,
            internal: true,
            excerpt: item.description,
            image: resolveInfoCulturaAssetUrl(item.image),
            imageAlt: item.title,
            publishedAt: item.start_date || item.event_date,
            publishedLabel: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            }).format(new Date(item.start_date || item.event_date)),
            tags: item.categories.map((category) => ({
              label: `#${category.name.toLowerCase().replace(/\s+/g, '')}`,
              href: '/vida-academica/eventos'
            }))
          }));

        setHomepageEventHighlights(items);
      } catch {
        if (!active) return;
        setHomepageEventHighlights([]);
      }
    }

    async function loadHomepageBooks() {
      try {
        const books = await fetchPublicBooks();
        if (!active) return;

        setHomepageBookHighlights(books);
      } catch {
        if (!active) return;
        setHomepageBookHighlights([]);
      }
    }

    void loadHomepageNews();
    void loadHomepageEvents();
    void loadHomepageBooks();

    return () => {
      active = false;
    };
  }, [locale]);

  const currentHero = heroSlides[activeHero];
  const showStudyLinks = activeHero === 0;

  function showPreviousTestimonial() {
    setActiveTestimonial((current) => Math.max(current - 1, 0));
  }

  function showNextTestimonial() {
    setActiveTestimonial((current) => Math.min(current + 1, testimonialSlides.length - 1));
  }

  function handleTestimonialTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    testimonialTouchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTestimonialTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const startX = testimonialTouchStartX.current;
    const endX = event.changedTouches[0]?.clientX ?? null;

    testimonialTouchStartX.current = null;

    if (startX === null || endX === null) return;

    const deltaX = endX - startX;

    if (Math.abs(deltaX) < 40) return;

    if (deltaX > 0) {
      showPreviousTestimonial();
      return;
    }

    showNextTestimonial();
  }

  function SliderArrowIcon({ direction }: { direction: 'left' | 'right' }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-7 w-7 ${direction === 'left' ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    );
  }

  return (
    <>
      <main className={mainContent}>
        <section className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[#10263b] sm:min-h-[720px] lg:min-h-screen">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="flex h-full w-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeHero * 100}%)` }}
            >
              {heroSlides.map((slide, index) => (
                <img
                  key={slide.title}
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full shrink-0 object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15))]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,30,44,0.78)_0%,rgba(18,30,44,0.55)_45%,rgba(18,30,44,0.25)_100%)]" />
          </div>

          <div
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
              isHeaderSolid ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <TopBar transparent={!isHeaderSolid} />
            <HeaderNav transparent={!isHeaderSolid} />
          </div>

          <div className={`relative z-10 flex h-full min-h-[640px] flex-col px-4 sm:min-h-[720px] sm:px-6 lg:min-h-screen lg:px-3 ${container}`}>
            <div className="flex-1" />

            <div className="pb-10 pt-32 text-white sm:pb-[7vh]">
              <div className="grid grid-cols-12 gap-y-8">
                <div className="col-span-12 lg:col-span-6 xl:col-span-7">
                  <h1 className="font-heading text-3xl font-bold leading-snug sm:text-5xl sm:leading-snug lg:text-4xl lg:leading-snug xl:pr-[8vw] xl:text-5xl xl:leading-snug 2xl:pr-[5vw] 2xl:text-6xl">
                    {currentHero.title}
                  </h1>
                  <p className={`mt-4 max-w-2xl whitespace-pre-line text-base font-medium sm:text-lg ${showStudyLinks ? 'hidden lg:block' : ''}`}>
                    {currentHero.text}
                  </p>

                  {showStudyLinks ? (
                    <div className="mt-7 lg:hidden">
                      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-white/80">
                        {getLocaleText(locale, 'Fica a conhecer a nossa oferta formativa:', 'Discover our training programs:')}
                      </p>
                      <ul className="mt-3 divide-y divide-white/70 border-y border-white/70">
                        {studyLinks.map((item) => (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              className="flex items-center justify-between py-3 text-xl font-bold text-white"
                            >
                              <span>{item.label}</span>
                              <span aria-hidden="true">&#10230;</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                      <a
                        href="#content-start"
                        className="mt-6 inline-flex items-center text-sm font-bold uppercase tracking-tight text-white"
                      >
                        <span>{getLocaleText(locale, 'Descobre Mais', 'Find out more')}</span>
                        <span className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white">
                          <ChevronRight className="h-5 w-5 rotate-90" />
                        </span>
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="col-span-12 hidden lg:block lg:col-span-6 xl:col-span-5">
                  <div
                    className={showStudyLinks ? '' : 'invisible pointer-events-none select-none'}
                    aria-hidden={!showStudyLinks}
                  >
                    <p className="font-medium">{getLocaleText(locale, 'Fica a conhecer a nossa oferta formativa:', 'Discover our training programs:')}</p>
                    <ul className="mt-1 divide-y-2 divide-white">
                      {studyLinks.map((item) => (
                        <li key={item.label}>
                          <a
                            href={item.href}
                            className="group flex items-center justify-between px-1.5 py-2 text-lg font-bold xl:px-4 xl:py-3 xl:text-xl 2xl:text-2xl"
                          >
                            <span className="transition-opacity group-hover:opacity-80">{item.label}</span>
                            <span className="-translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                              &#10230;
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={`mt-5 lg:mt-6 xl:text-right ${
                      showStudyLinks ? '' : 'invisible pointer-events-none select-none'
                    }`}
                    aria-hidden={!showStudyLinks}
                  >
                    <a
                      href="#content-start"
                      className="inline-flex items-center justify-end opacity-70 transition-opacity hover:opacity-100"
                    >
                      <span className="text-sm font-bold uppercase tracking-tight">{getLocaleText(locale, 'Descobre Mais', 'Find out more')}</span>
                      <span className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white transition hover:scale-110 hover:border-dashed">
                        <ChevronRight className="h-5 w-5 rotate-90" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center space-x-5">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => setActiveHero(index)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border border-white transition-opacity ${
                      index === activeHero ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    <span className="sr-only">Slide {index + 1}</span>
                    <span className="h-3 w-3 rounded-full bg-white" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="content-start" className="scroll-mt-36 bg-white pt-10 lg:pt-12 xl:pt-16 2xl:pt-20">
          <div className={`${container} px-4 text-center sm:px-6 lg:px-3`}>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl 2xl:text-5xl">
                {copy.highlightsTitle}
            </h2>
          </div>

          <div
            className={`${container} mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:px-6 md:mt-10 md:justify-center md:gap-6 lg:px-3`}
          >
              {highlightCards.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="group relative flex min-h-[380px] min-w-[82vw] max-w-[82vw] snap-center flex-col overflow-hidden rounded bg-gray-200 first:ml-0 sm:min-h-[440px] sm:min-w-[70vw] sm:max-w-[70vw] md:min-w-0 md:max-w-none md:basis-6/12 lg:min-h-[500px] lg:basis-4/12 2xl:basis-3/12"
              >
                <div className="absolute inset-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                </div>
                <div className="relative z-10 mt-auto px-6 pb-6 pt-6 text-white">
                  <p className="font-heading text-2xl underline-offset-2 group-hover:underline">
                    {item.title}
                  </p>
                  <div className="max-h-40 overflow-hidden transition-[max-height] duration-500 ease-in-out md:max-h-0 md:group-hover:max-h-40">
                    <p className="mt-4 font-medium">{item.text}</p>
                  </div>
                </div>
                <div className="relative z-10 flex items-center px-6 py-6 text-white">
                  <ChevronRight className="h-7 w-7" />
                  <p className="ml-3 font-medium">{getLocaleText(locale, 'Fica a saber mais', 'Find out more')}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="relative mt-20 bg-gray-50 py-16 before:absolute before:-top-5 before:h-14 before:w-full before:-skew-y-1 before:bg-gray-50 after:absolute after:-bottom-5 after:h-14 after:w-full after:-skew-y-1 after:bg-gray-50 lg:mt-24 xl:mt-28">
          <div className={`${container} grid grid-cols-1 gap-y-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-x-4 lg:px-3 xl:gap-x-6 2xl:gap-x-8`}>
            <div className="relative col-span-1 hidden lg:block">
              <div className="sticky top-36">
                <img
                  src={aondefuturo}
                  alt={getLocaleText(locale, 'Onde o Futuro Te Leva', 'Where the Future Takes You')}
                  className="relative z-10 mx-auto block shadow-2xl lg:w-10/12 xl:w-auto"
                />
              </div>
            </div>

            <div className="col-span-2 mx-auto max-w-xl space-y-10 lg:col-span-1 lg:mx-0 lg:max-w-none xl:space-y-14">
              <div className="text-center lg:text-left">
                <h2 className="font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl 2xl:text-5xl">
                  {copy.futureTitle}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy.metricsCta}</p>
              </div>

              {metrics.map((item, index) => (
                <div key={item.title} className="flex min-w-0 items-start">
                  {index % 2 === 1 ? (
                    <>
                      <div className="mr-3 min-w-0 border-b-2 border-l-2 border-gray-300 pb-4 pl-4 pr-2 pt-2 sm:mr-4 sm:pb-6 sm:pl-6">
                        <p className="text-lg font-bold xl:text-2xl">{item.title}</p>
                        <p className="mt-3 max-w-md text-sm sm:text-base">{item.text}</p>
                      </div>
                      <div className="shrink-0">
                        <p className="mt-2 font-heading text-3xl font-bold text-orange-400 sm:text-4xl lg:text-5xl xl:text-6xl">
                          {item.value}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="shrink-0">
                        <p className="mt-2 font-heading text-3xl font-bold text-orange-400 sm:text-4xl lg:text-5xl xl:text-6xl">
                          {item.value}
                        </p>
                      </div>
                      <div className="ml-2 min-w-0 border-b-2 border-r-2 border-gray-300 pb-2 pl-2 pr-2 pt-2 sm:ml-4 sm:pb-6 sm:pl-6">
                        <p className="text-lg font-bold xl:text-2xl">{item.title}</p>
                        <p className="mt-3 max-w-md text-sm sm:text-base">{item.text}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mt-16 overflow-hidden lg:mt-28 xl:mt-32 2xl:mt-32">
          <div className={`${container} grid grid-cols-1 gap-x-10 bg-white px-4 sm:px-6 lg:grid-cols-2 lg:px-3`}>
            <div className="relative z-10 col-span-2 bg-white py-6 lg:col-span-1">
              <h2 className="max-w-2xl font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl 2xl:text-5xl">
                {getLocaleText(locale, 'Ainda queres saber mais? Nós podemos ajudar-te.', 'Do you still want to know more? We can help you')}
              </h2>
              <p className="mt-4">
                {getLocaleText(locale, 'A candidatura ao ensino superior é um passo muito importante. O ISPGAYA dispõe da modalidade de acesso ideal para ti, quer tenhas terminado o ensino secundário ou já estejas a trabalhar e queiras aperfeiçoar os teus conhecimentos.', 'Applying for higher education is a very important step, it is the starting point for becoming a successful professional. ISPGAYA has the ideal access modality for you, whether you have finished secondary education or are already working and want to improve your knowledge.')}
              </p>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center">
                  <a
                  href="https://inforestudante.ispgaya.pt/nonio/security/preRegisto.do?origem=CANDIDATURAS"
                  className="inline-block w-full bg-orange-400 px-6 py-2 text-center font-bold text-white transition hover:bg-orange-500 sm:w-auto"
                >
                  {getLocaleText(locale, 'Candidatar-me', 'Apply now')}
                </a>
                <a
                  href={buildIspgayaUrl(locale, '/ensino/candidaturas')}
                  className="mt-3 inline-block w-full border-2 border-orange-700 px-6 py-2 text-center font-bold text-orange-700 transition hover:border-orange-600 hover:bg-orange-600 hover:text-white sm:ml-6 sm:mt-0 sm:w-auto"
                >
                  {getLocaleText(locale, 'Quero saber mais', 'I want to know more')}
                </a>
              </div>
            </div>

            <div className="col-span-2 min-w-0 bg-white lg:col-span-1">
              <div className="xl:max-w-2xl">
                <div className="flex items-center py-4">
                  <button
                    type="button"
                    onClick={() => setActiveSupport((current) => Math.max(current - 1, 0))}
                    disabled={activeSupport === 0}
                    className="swiper-button-prev p-2 text-gray-700 transition hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={getLocaleText(locale, 'Slide anterior', 'Previous slide')}
                  >
                    <span className="sr-only">{getLocaleText(locale, 'Anterior', 'Previous')}</span>
                    <ChevronLeft className="h-7 w-7" />
                  </button>

                  <div className="swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal mx-2 flex items-center space-x-3">
                    {supportSlides.map((item, index) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => setActiveSupport(index)}
                        className={`h-5 w-5 rounded-full bg-orange-200 transition-transform ${
                          index === activeSupport ? 'scale-125 bg-orange-400' : ''
                        }`}
                        aria-label={`Slide ${index + 1}`}
                        aria-current={index === activeSupport ? 'true' : undefined}
                      >
                        <span className="sr-only">Slide {index + 1}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveSupport((current) => Math.min(current + 1, supportSlides.length - 1))
                    }
                    disabled={activeSupport === supportSlides.length - 1}
                    className="swiper-button-next p-2 text-gray-700 transition hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={getLocaleText(locale, 'Slide seguinte', 'Next slide')}
                  >
                    <span className="sr-only">{getLocaleText(locale, 'Seguinte', 'Next')}</span>
                    <ChevronRight className="h-7 w-7" />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {supportSlides.map((item, index) => (
                    <a
                      key={item.title}
                      href={item.href}
                      className={`border px-6 py-8 text-center transition ${index === activeSupport ? 'block' : 'hidden md:block'} ${
                        index === activeSupport
                          ? 'border-orange-200 bg-orange-100'
                          : 'border-orange-50 bg-orange-50 hover:border-orange-200 hover:bg-orange-100'
                      }`}
                    >
                      <div className="mx-auto h-40 w-40">
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                      <p className="mt-3 text-lg font-bold">{item.title}</p>
                      <p className="mt-2">{item.text}</p>
                      <span className="mt-6 inline-block border-2 border-orange-700 px-5 py-1.5 text-sm font-semibold text-orange-700 transition hover:border-orange-600 hover:bg-orange-600 hover:text-white">
                        Ver mais
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 bg-white lg:mt-16 xl:mt-20">
          <div className={`${container} px-4 sm:px-6 lg:px-3`}>
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-2">
              <NewsHighlightsSection
                title={getLocaleText(locale, 'Notícias', 'News')}
                viewAllHref="/vida-academica/noticias"
                viewAllInternal
                items={homepageNewsHighlights}
                className="w-full"
              />
              <NewsHighlightsSection
                title={getLocaleText(locale, 'Eventos', 'Events')}
                viewAllHref="/vida-academica/eventos"
                viewAllInternal
                items={homepageEventHighlights}
                className="w-full"
              />
            </div>
          </div>
        </section>

        <section className="mt-12 bg-slate-50 py-16 lg:mt-16 lg:py-20 xl:mt-20">
          <div className={`${container} px-4 sm:px-6 lg:px-3`}>
            <BestBooksSection
              books={homepageBookHighlights}
              locale={locale}
              title={getLocaleText(locale, 'Livros em destaque', 'Featured books')}
              description={getLocaleText(
                locale,
                'Uma seleção de livros do Laboratório Cultural e dos clubes.',
                'A curated selection of books from the Cultural Lab and clubs.'
              )}
              viewAllHref="/laboratorio-cultural"
              viewAllLabel={getLocaleText(locale, 'Explorar o laboratório', 'Explore the lab')}
              detailBaseHref="/laboratorio-cultural/livros"
              limit={10}
            />
            
          </div>
        </section>

        <section className="mb-6 mt-8 bg-white md:mb-8 md:mt-10 lg:mb-10 lg:mt-12 xl:mb-16 xl:mt-16">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-black xl:text-4xl 2xl:text-5xl">
              {getLocaleText(locale, 'Testemunhos', 'Testimonials')}
            </h2>
          </div>

          <div className={`${container} mx-auto w-full overflow-hidden lg:max-w-2xl`}>
            <div
              className="w-full touch-pan-y overflow-hidden pb-2 pt-6 md:pb-4 md:pt-8 lg:pb-4 lg:pt-10 xl:pb-6 xl:pt-12"
              onTouchStart={handleTestimonialTouchStart}
              onTouchEnd={handleTestimonialTouchEnd}
            >
              <div
                className="flex w-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonialSlides.map((item) => (
                  <div key={item.name} className="w-full shrink-0">
                    <div className="relative">
                      <div className="absolute -top-4 text-orange-400 opacity-20 sm:-left-1 sm:-top-5">
                        <svg className="h-20 w-20 sm:h-28 sm:w-28" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23 5.655c-3.008 1.475-4.511 3.208-4.511 5.2 1.282.148 2.342.67 3.18 1.567.838.897 1.257 1.936 1.257 3.116 0 1.254-.407 2.311-1.22 3.171-.814.86-1.837 1.291-3.069 1.291-1.38 0-2.576-.559-3.587-1.678-1.011-1.119-1.516-2.477-1.516-4.075 0-4.794 2.687-8.543 8.061-11.247L23 5.655zm-13.534 0c-3.032 1.475-4.548 3.208-4.548 5.2 1.307.148 2.379.67 3.217 1.567.838.897 1.257 1.936 1.257 3.116 0 1.254-.413 2.311-1.239 3.171C7.327 19.569 6.298 20 5.065 20c-1.38 0-2.57-.559-3.568-1.678-.998-1.119-1.498-2.477-1.498-4.075C-.001 9.453 2.674 5.704 8.023 3l1.442 2.655z" />
                        </svg>
                      </div>
                      <blockquote className="text-center text-lg sm:text-lg">
                        {item.quote}
                      </blockquote>
                    </div>

                    <div className="mt-7 flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="block h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow"
                      />

                      <div className="ml-5 font-medium">
                        <p className="text-xl">{item.name}</p>
                        <p className="text-base text-gray-500">{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex w-full items-center justify-center">
              <button
                type="button"
                onClick={showPreviousTestimonial}
                disabled={activeTestimonial === 0}
                className="p-2 text-gray-700 transition hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <SliderArrowIcon direction="left" />
              </button>

              <button
                type="button"
                onClick={showNextTestimonial}
                disabled={activeTestimonial === testimonialSlides.length - 1}
                className="p-2 text-gray-700 transition hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <SliderArrowIcon direction="right" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default HomePage;
