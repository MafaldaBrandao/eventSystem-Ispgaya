import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLocale, getLocaleText } from '../../i18n/locale.js';

type PublicMediaListItemProps = {
  title: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  dateTime: string;
  formattedDate: string;
  description: string;
  tags?: ReactNode;
};

function PublicMediaListItem({
  title,
  href,
  imageUrl,
  imageAlt,
  dateTime,
  formattedDate,
  description,
  tags
}: PublicMediaListItemProps) {
  const { locale } = useLocale();
  return (
    <article>
      {tags ? <div className="flex flex-wrap gap-2">{tags}</div> : null}

      <div className="mt-2 flex flex-col items-start gap-5 lg:flex-row lg:gap-14">
        <div className="order-2 w-full grow lg:order-1 lg:w-auto">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            <Link to={href} className="underline-offset-3 hover:underline">
              {title}
            </Link>
          </h2>

          <time className="mt-3 inline-block text-sm font-medium capitalize text-gray-500" dateTime={dateTime}>
            {formattedDate}
          </time>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
            {description}
          </p>

          <div className="mt-3">
            <Link
              to={href}
              className="flex items-center text-sm font-medium text-orange-400 underline-offset-2 hover:underline"
            >
              <span>{getLocaleText(locale, 'Ler Mais', 'Read More')}</span>
              <ArrowRight aria-hidden="true" className="ml-2 mt-0.5 h-5 w-5" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="relative order-1 w-full shrink-0 overflow-hidden rounded shadow-xl lg:order-2 lg:w-auto">
          <Link to={href}>
            <img
              className="aspect-[16/9] w-full object-cover transition-transform duration-300 ease-in-out hover:scale-105 lg:aspect-[4/2] lg:max-w-lg lg:mx-auto"
              src={imageUrl}
              alt={imageAlt}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PublicMediaListItem;
