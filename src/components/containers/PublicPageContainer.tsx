import { ReactNode } from 'react';
import Breadcrumbs from '../ui/Breadcrumbs';
import Footer from '../layout/Footer';
import HeaderNav from '../layout/HeaderNav';
import TopBar from '../layout/TopBar';
import { container, contentSection, mainContent } from '../../styles/ui';

type PublicPageContainerProps = {
  title: string;
  description: string;
  parentLabel: string;
  parentHref: string;
  currentLabel: string;
  currentHref: string;
  children: ReactNode;
};

function PublicPageContainer({
  title,
  description,
  parentLabel,
  parentHref,
  currentLabel,
  currentHref,
  children
}: PublicPageContainerProps) {
  return (
    <>
      <TopBar />
      <HeaderNav />
      <Breadcrumbs
        title={title}
        description={description}
        parentLabel={parentLabel}
        parentHref={parentHref}
        currentLabel={currentLabel}
        currentHref={currentHref}
      />

      <main className={mainContent}>
        <section className={contentSection}>
          <div className={`${container} relative z-10 mb-12 mt-6 px-4 sm:px-6 xl:px-8`}>
            {children}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default PublicPageContainer;
