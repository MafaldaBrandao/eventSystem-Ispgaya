import { Link } from 'react-router-dom';

import type { InfoCulturaClub, InfoCulturaEvent } from '../../api/infoculturaApi';
import { resolveInfoCulturaAssetUrl } from '../../api/infoculturaApi';
import { adminBtnSecondary, blockText, blockTitle, labResearchLink } from '../../styles/ui';
import { getLocaleText } from '../../i18n/locale';

type LaboratorioEventsSectionProps = {
  events: InfoCulturaEvent[];
  clubs: InfoCulturaClub[];
  locale: 'pt' | 'en';
  title?: string;
  description?: string;
};

function getClubNameById(clubs: InfoCulturaClub[], clubId?: number | null): string {
  if (!clubId) return '';
  return clubs.find((club) => club.id === clubId)?.name || '';
}

function LaboratorioEventsSection({
  events,
  clubs,
  locale,
  title,
  description,
}: LaboratorioEventsSectionProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className={blockTitle}>
            {title || getLocaleText(locale, 'Todos os eventos', 'All events')}
          </h2>
          <p className={blockText}>
            {description ||
              getLocaleText(
                locale,
                'Lista completa dos eventos públicos do Laboratório Cultural.',
                'Complete list of public events from the Cultural Laboratory.'
              )}
          </p>
        </div>
        <Link to="/laboratorio-cultural/agenda" className={adminBtnSecondary}>
          {getLocaleText(locale, 'Abrir agenda', 'Open agenda')}
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {item.image ? (
              <img
                src={resolveInfoCulturaAssetUrl(item.image)}
                alt={item.title}
                className="mb-4 h-44 w-full rounded-xl object-cover"
              />
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {item.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {getClubNameById(clubs, item.club_id)}{item.city ? ` · ${item.city}` : ''}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{item.description}</p>
            <Link to={`/laboratorio-cultural/eventos/${item.id}`} className={`${labResearchLink} mt-4 inline-flex`}>
              {getLocaleText(locale, 'Ver detalhe', 'View details')}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default LaboratorioEventsSection;
