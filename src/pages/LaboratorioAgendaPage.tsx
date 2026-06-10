import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Footer from '../components/layout/Footer';
import HeaderNav from '../components/layout/HeaderNav';
import TopBar from '../components/layout/TopBar';
import {
  fetchPublicCategories,
  fetchPublicClubs,
  fetchPublicEvents,
  InfoCulturaCategory,
  InfoCulturaClub,
  InfoCulturaEvent,
  resolveInfoCulturaAssetUrl
} from '../api/infoculturaApi';
import {
  adminBtnSecondary,
  adminField,
  adminFormGridSpaced,
  adminInput,
  adminLabel,
  container,
  contentEmpty,
  labResearchLink,
  mainContent
} from '../styles/ui';
import { getLocaleText, useLocale } from '../i18n/locale.js';

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getEventTimeState(item: InfoCulturaEvent): 'upcoming' | 'ongoing' | 'past' {
  const now = Date.now();
  const start = new Date(item.start_date).getTime();
  const end = new Date(item.end_date).getTime();

  if (!Number.isNaN(end) && end < now) return 'past';
  if (!Number.isNaN(start) && start > now) return 'upcoming';
  return 'ongoing';
}

function formatMonthLabel(date: Date, locale: 'pt' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function formatDateLabel(value: string, locale: 'pt' | 'en'): string {
  const safeDate = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(safeDate);
}

function getDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getStartOfWeek(date: Date): Date {
  const weekday = (date.getDay() + 6) % 7;
  return addDays(date, -weekday);
}

function getRangeBounds(start: string, end: string): { from: string; to: string } | null {
  if (!start && !end) return null;
  if (start && !end) return { from: start, to: start };
  if (!start && end) return { from: end, to: end };
  return start <= end ? { from: start, to: end } : { from: end, to: start };
}

function isDateInRange(dateKey: string, start: string, end: string): boolean {
  const bounds = getRangeBounds(start, end);
  if (!bounds) return false;
  return dateKey >= bounds.from && dateKey <= bounds.to;
}

function formatWeekLabel(date: Date, locale: 'pt' | 'en'): string {
  const weekStart = getStartOfWeek(date);
  const weekEnd = addDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    day: '2-digit',
    month: 'short',
  });

  return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
}

function getClubNameById(clubs: InfoCulturaClub[], clubId?: number | null): string {
  if (!clubId) return '';
  return clubs.find((club) => club.id === clubId)?.name || '';
}

function LaboratorioAgendaPage() {
  const { locale } = useLocale();
  const [clubs, setClubs] = useState<InfoCulturaClub[]>([]);
  const [categories, setCategories] = useState<InfoCulturaCategory[]>([]);
  const [events, setEvents] = useState<InfoCulturaEvent[]>([]);
  const [eventClubFilter, setEventClubFilter] = useState('all');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
  const [eventCityFilter, setEventCityFilter] = useState('all');
  const [eventStateFilter, setEventStateFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'past'>(
    'all'
  );
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [visibleDate, setVisibleDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [rangeStartDate, setRangeStartDate] = useState('');
  const [rangeEndDate, setRangeEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [nextClubs, nextCategories, nextEvents] = await Promise.all([
          fetchPublicClubs(),
          fetchPublicCategories(),
          fetchPublicEvents()
        ]);

        if (!active) return;
        setClubs(nextClubs);
        setCategories(nextCategories);
        setEvents(nextEvents);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : getLocaleText(locale, 'Não foi possível carregar a agenda.', 'Unable to load the agenda.');
        setLoadError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [locale]);

  const eventCities = useMemo(
    () =>
      Array.from(
        new Set(events.map((item) => (item.city || item.location || '').trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'pt')),
    [events]
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((item) => {
        const itemDate = item.event_date.slice(0, 10);
        const hasRange = Boolean(rangeStartDate || rangeEndDate);
        const matchesRange = !hasRange || isDateInRange(itemDate, rangeStartDate, rangeEndDate);

        return (
          (eventClubFilter === 'all' || String(item.club_id || '') === eventClubFilter) &&
          (eventCategoryFilter === 'all' || item.category_ids.includes(Number(eventCategoryFilter))) &&
          (eventCityFilter === 'all' ||
            normalizeLabel(item.city || item.location || '') === normalizeLabel(eventCityFilter)) &&
          (eventStateFilter === 'all' || getEventTimeState(item) === eventStateFilter) &&
          matchesRange
        );
      }),
    [events, eventClubFilter, eventCategoryFilter, eventCityFilter, eventStateFilter, rangeStartDate, rangeEndDate]
  );

  const calendarEventsByDate = useMemo(() => {
    const map = new Map<string, InfoCulturaEvent[]>();

    events.forEach((item) => {
      const dateKey = item.event_date.slice(0, 10);

      if (
        (eventClubFilter !== 'all' && String(item.club_id || '') !== eventClubFilter) ||
        (eventCategoryFilter !== 'all' && !item.category_ids.includes(Number(eventCategoryFilter))) ||
        (eventCityFilter !== 'all' &&
          normalizeLabel(item.city || item.location || '') !== normalizeLabel(eventCityFilter)) ||
        (eventStateFilter !== 'all' && getEventTimeState(item) !== eventStateFilter)
      ) {
        return;
      }

      const currentItems = map.get(dateKey) || [];
      currentItems.push(item);
      map.set(dateKey, currentItems);
    });

    return map;
  }, [events, eventClubFilter, eventCategoryFilter, eventCityFilter, eventStateFilter]);

  const calendarDays = useMemo(() => {
    if (calendarView === 'week') {
      const weekStart = getStartOfWeek(visibleDate);
      return Array.from({ length: 7 }, (_, index) => ({
        date: addDays(weekStart, index),
        inMonth: true,
      }));
    }

    const monthStart = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1);
    const monthEnd = new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 0);
    const startWeekday = (monthStart.getDay() + 6) % 7;
    const totalDays = monthEnd.getDate();
    const cells: Array<{ date: Date; inMonth: boolean }> = [];

    for (let index = 0; index < startWeekday; index += 1) {
      cells.push({
        date: new Date(monthStart.getFullYear(), monthStart.getMonth(), index - startWeekday + 1),
        inMonth: false
      });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push({
        date: new Date(monthStart.getFullYear(), monthStart.getMonth(), day),
        inMonth: true
      });
    }

    while (cells.length % 7 !== 0) {
      const lastDate = cells[cells.length - 1]?.date || monthEnd;
      cells.push({
        date: new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1),
        inMonth: false
      });
    }

    return cells;
  }, [calendarView, visibleDate]);

  const selectedRange = useMemo(
    () => getRangeBounds(rangeStartDate, rangeEndDate),
    [rangeStartDate, rangeEndDate]
  );

  function handleCalendarDateClick(dateKey: string) {
    if (!rangeStartDate || (rangeStartDate && rangeEndDate)) {
      setRangeStartDate(dateKey);
      setRangeEndDate('');
      return;
    }

    if (rangeStartDate === dateKey) {
      setRangeStartDate('');
      setRangeEndDate('');
      return;
    }

    if (dateKey < rangeStartDate) {
      setRangeStartDate(dateKey);
      setRangeEndDate(rangeStartDate);
      return;
    }

    setRangeEndDate(dateKey);
  }

  return (
    <>
      <TopBar />
      <HeaderNav />
      <Breadcrumbs
        title={getLocaleText(locale, 'Agenda Cultural', 'Cultural Agenda')}
        description={getLocaleText(locale, 'Consulta a agenda geral do Laboratório Cultural, filtra eventos e percorre o calendário de forma visual.', 'Browse the Cultural Lab agenda, filter events and move through the calendar visually.')}
        parentLabel={getLocaleText(locale, 'Laboratorio Cultural', 'Cultural Lab')}
        parentHref="/laboratorio-cultural"
        currentLabel={getLocaleText(locale, 'Agenda', 'Agenda')}
        currentHref="/laboratorio-cultural/agenda"
      />

      <main className={mainContent}>
        <section className="py-8 md:py-14">
          <div className={`${container} px-4 sm:px-6 lg:px-3 xl:px-8`}>
            {isLoading ? <p className={contentEmpty}>{getLocaleText(locale, 'A carregar agenda...', 'Loading agenda...')}</p> : null}
            {loadError ? <p className={contentEmpty}>{loadError}</p> : null}

            {!isLoading && !loadError ? (
              <div className="space-y-6 md:space-y-10">
                <section className="border-b border-slate-200 pb-6 md:pb-8">
                  <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dd8609]">
                        {getLocaleText(locale, 'Explorar agenda', 'Explore agenda')}
                      </p>
                      <h2 className="mt-3 break-words font-heading text-2xl font-semibold text-slate-900 sm:text-3xl">
                        {getLocaleText(locale, 'Vê todos os eventos por filtro', 'See all events by filter')}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">
                        {getLocaleText(locale, 'Filtra por clube, categoria, cidade e estado. Depois navega no calendário para perceber rapidamente o que acontece em cada data.', 'Filter by club, category, city and status. Then browse the calendar to quickly understand what happens on each date.')}
                      </p>
                    </div>
                    <Link to="/laboratorio-cultural" className={`${adminBtnSecondary} w-full text-center sm:w-auto`}>
                      {getLocaleText(locale, 'Voltar ao laboratório', 'Back to laboratory')}
                    </Link>
                  </div>
                </section>

                <section className="border-b border-slate-200 pb-6">
                  <div className={adminFormGridSpaced}>
                    <div className={adminField}>
                      <label className={adminLabel} htmlFor="agenda-event-club-filter">
                        {getLocaleText(locale, 'Clube', 'Club')}
                      </label>
                      <select
                        id="agenda-event-club-filter"
                        className={adminInput}
                        value={eventClubFilter}
                        onChange={(event) => setEventClubFilter(event.target.value)}
                      >
                        <option value="all">{getLocaleText(locale, 'Todos', 'All')}</option>
                        {clubs.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={adminField}>
                      <label className={adminLabel} htmlFor="agenda-event-category-filter">
                        {getLocaleText(locale, 'Categoria', 'Category')}
                      </label>
                      <select
                        id="agenda-event-category-filter"
                        className={adminInput}
                        value={eventCategoryFilter}
                        onChange={(event) => setEventCategoryFilter(event.target.value)}
                      >
                        <option value="all">{getLocaleText(locale, 'Todas', 'All')}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={adminField}>
                      <label className={adminLabel} htmlFor="agenda-event-city-filter">
                        {getLocaleText(locale, 'Cidade', 'City')}
                      </label>
                      <select
                        id="agenda-event-city-filter"
                        className={adminInput}
                        value={eventCityFilter}
                        onChange={(event) => setEventCityFilter(event.target.value)}
                      >
                        <option value="all">{getLocaleText(locale, 'Todas', 'All')}</option>
                        {eventCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={adminField}>
                      <label className={adminLabel} htmlFor="agenda-event-state-filter">
                        {getLocaleText(locale, 'Estado', 'Status')}
                      </label>
                      <select
                        id="agenda-event-state-filter"
                        className={adminInput}
                        value={eventStateFilter}
                        onChange={(event) =>
                          setEventStateFilter(
                            event.target.value as 'all' | 'upcoming' | 'ongoing' | 'past'
                          )
                        }
                      >
                        <option value="all">{getLocaleText(locale, 'Todos', 'All')}</option>
                        <option value="upcoming">{getLocaleText(locale, 'Próximos', 'Upcoming')}</option>
                        <option value="ongoing">{getLocaleText(locale, 'A decorrer', 'Ongoing')}</option>
                        <option value="past">{getLocaleText(locale, 'Concluídos', 'Past')}</option>
                      </select>
                    </div>

                    <div className={adminField}>
                      <label className={adminLabel} htmlFor="agenda-range-start">
                        {getLocaleText(locale, 'Início', 'Start')}
                      </label>
                      <input
                        id="agenda-range-start"
                        type="date"
                        className={adminInput}
                        value={rangeStartDate}
                        onChange={(event) => setRangeStartDate(event.target.value)}
                      />
                    </div>

                    <div className={adminField}>
                      <label className={adminLabel} htmlFor="agenda-range-end">
                        {getLocaleText(locale, 'Fim', 'End')}
                      </label>
                      <input
                        id="agenda-range-end"
                        type="date"
                        className={adminInput}
                        value={rangeEndDate}
                        min={rangeStartDate || undefined}
                        onChange={(event) => setRangeEndDate(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                    <button
                      type="button"
                      className={`${adminBtnSecondary} w-full text-center sm:w-auto`}
                      onClick={() => {
                        setEventClubFilter('all');
                        setEventCategoryFilter('all');
                        setEventCityFilter('all');
                        setEventStateFilter('all');
                        setRangeStartDate('');
                        setRangeEndDate('');
                      }}
                    >
                      {getLocaleText(locale, 'Limpar filtros', 'Clear filters')}
                    </button>
                    {selectedRange ? (
                      <button
                        type="button"
                        className={`${adminBtnSecondary} w-full text-center sm:w-auto`}
                        onClick={() => {
                          setRangeStartDate('');
                          setRangeEndDate('');
                        }}
                      >
                        {getLocaleText(locale, 'Limpar intervalo', 'Clear range')}
                      </button>
                    ) : null}
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:gap-8">
                  <div className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-5 sm:gap-4">
                      <div className="inline-flex rounded-md border border-slate-200 p-1">
                        <button
                          type="button"
                          className={`rounded px-3 py-1.5 text-sm font-medium ${
                            calendarView === 'month'
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                          onClick={() => setCalendarView('month')}
                        >
                          {getLocaleText(locale, 'Mês', 'Month')}
                        </button>
                        <button
                          type="button"
                          className={`rounded px-3 py-1.5 text-sm font-medium ${
                            calendarView === 'week'
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                          onClick={() => setCalendarView('week')}
                        >
                          {getLocaleText(locale, 'Semana', 'Week')}
                        </button>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleDate(
                            (current) =>
                              calendarView === 'week'
                                ? addDays(current, -7)
                                : new Date(current.getFullYear(), current.getMonth() - 1, 1)
                          )
                        }
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-[#dd8609] hover:text-[#dd8609] sm:h-10 sm:w-10"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <h2 className="min-w-0 break-words text-center font-heading text-xl font-semibold capitalize text-slate-900 sm:text-2xl">
                        {calendarView === 'week'
                          ? formatWeekLabel(visibleDate, locale)
                          : formatMonthLabel(visibleDate, locale)}
                      </h2>
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleDate(
                            (current) =>
                              calendarView === 'week'
                                ? addDays(current, 7)
                                : new Date(current.getFullYear(), current.getMonth() + 1, 1)
                          )
                        }
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-[#dd8609] hover:text-[#dd8609] sm:h-10 sm:w-10"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-semibold uppercase tracking-[0.04em] text-slate-500 sm:gap-2 sm:text-xs sm:tracking-[0.12em]">
                      {(locale === 'en'
                        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                        : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
                      ).map((day) => (
                          <div key={day} className="py-1.5 sm:py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
                      {calendarDays.map(({ date, inMonth }) => {
                        const dateKey = getDateKey(date);
                        const items = calendarEventsByDate.get(dateKey) || [];
                        const isSelected = selectedRange?.from === dateKey && selectedRange?.to === dateKey;
                        const isInSelectedRange = isDateInRange(dateKey, rangeStartDate, rangeEndDate);

                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() => handleCalendarDateClick(dateKey)}
                            className={`min-h-[46px] border-b border-r border-slate-200 p-1.5 text-left transition sm:min-h-[88px] sm:p-2 ${
                              isSelected
                                ? 'bg-orange-50 text-[#dd8609]'
                                : isInSelectedRange
                                  ? 'bg-amber-50 text-[#b86708]'
                                : inMonth
                                  ? 'bg-white hover:bg-slate-50'
                                  : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            <span className="block text-xs font-semibold sm:text-sm">{date.getDate()}</span>
                            {items.length > 0 ? (
                              <span className="mt-1 block text-[9px] leading-tight text-slate-600 sm:mt-2 sm:text-xs">
                                <span className="sm:hidden">{items.length}</span>
                                <span className="hidden sm:inline">
                                  {items.length} {getLocaleText(locale, 'evento(s)', 'event(s)')}
                                </span>
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-w-0 border-t border-slate-200 pt-6 xl:border-t-0 xl:pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="break-words font-heading text-xl font-semibold text-slate-900 sm:text-2xl">
                          {selectedRange
                            ? selectedRange.from === selectedRange.to
                              ? `${getLocaleText(locale, 'Eventos em', 'Events on')} ${formatDateLabel(selectedRange.from, locale)}`
                              : `${getLocaleText(locale, 'Eventos entre', 'Events between')} ${formatDateLabel(selectedRange.from, locale)} ${getLocaleText(locale, 'e', 'and')} ${formatDateLabel(selectedRange.to, locale)}`
                            : getLocaleText(locale, 'Visão geral filtrada', 'Filtered overview')}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {selectedRange
                            ? selectedRange.from === selectedRange.to
                              ? getLocaleText(locale, 'Selecionaste um dia específico no calendário.', 'You selected a specific day in the calendar.')
                              : getLocaleText(locale, 'Selecionaste um intervalo temporal no calendário interativo.', 'You selected a time range in the interactive calendar.')
                            : getLocaleText(locale, 'Seleciona uma ou duas datas para reduzir a agenda a um dia ou intervalo.', 'Select one or two dates to narrow the agenda to a day or range.')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {filteredEvents.length === 0 ? (
                        <p className={contentEmpty}>{getLocaleText(locale, 'Não existem eventos para os filtros atuais.', 'There are no events for the current filters.')}</p>
                      ) : (
                        filteredEvents.map((item) => (
                          <article
                            key={item.id}
                            className="border-b border-slate-200 pb-5"
                          >
                            {item.image ? (
                              <img
                                src={resolveInfoCulturaAssetUrl(item.image)}
                                alt={item.title}
                                className="h-32 w-full object-cover sm:h-40"
                              />
                            ) : null}
                            <div className={item.image ? 'pt-4 sm:pt-5' : ''}>
                              <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                                <h3 className="min-w-0 break-words text-base font-semibold text-slate-900 sm:text-lg">{item.title}</h3>
                                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#dd8609]">
                                  {getEventTimeState(item) === 'upcoming'
                                    ? getLocaleText(locale, 'Próximo', 'Upcoming')
                                    : getEventTimeState(item) === 'ongoing'
                                      ? getLocaleText(locale, 'A decorrer', 'Ongoing')
                                      : getLocaleText(locale, 'Concluído', 'Past')}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-slate-500">
                                {getClubNameById(clubs, item.club_id)} · {formatDateLabel(item.event_date, locale)}
                              </p>
                              <p className="mt-3 text-sm leading-6 text-slate-700">{item.description}</p>
                              <div className="mt-4">
                                <Link to={`/laboratorio-cultural/eventos/${item.id}`} className={labResearchLink}>
                                  {getLocaleText(locale, 'Ver detalhe', 'View details')}
                                </Link>
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default LaboratorioAgendaPage;
