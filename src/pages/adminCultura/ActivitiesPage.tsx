import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';

import AdminPageHero from './components/AdminPageHero.js';
import GoogleMapsLocationField from '../../components/ui/GoogleMapsLocationField.js';
import { getLocaleText, useLocale } from '../../i18n/locale';
import { adminNamePattern, adminNameTitle } from './nameValidation.js';
import { ActivityTab, BookFormState, CategoryFormState, EventFormState, SessionFormState } from './types';
import { formatAdminDateTime, getWorkflowStatusLabel, normalizeWorkflowStatus } from './utils';
import { EVENT_WORKFLOW_ORDER } from './constants';
import {
  adminActions,
  adminBtnDanger,
  adminBtnEdit,
  adminBtnPrimary,
  adminBtnSecondary,
  adminError,
  adminField,
  adminFieldSpaced,
  adminFormGridSpaced,
  adminHeaderRow,
  adminInfo,
  adminInput,
  adminLabel,
  adminList,
  adminListDesc,
  adminListHeader,
  adminListItem,
  adminListMeta,
  adminListTitle,
  adminListTools,
  adminListTop,
  adminListBadge,
  adminListCheckbox,
  adminPanelCard,
  adminPanelForm,
  adminTextarea,
  blockText,
  blockTitle,
} from '../../styles/ui';
import {
  InfoCulturaBook,
  InfoCulturaCategory,
  InfoCulturaClub,
  InfoCulturaEvent,
  InfoCulturaSession,
  EventbriteOrdersPage,
  EventbriteRefundStatus,
  EventbriteConnectionStatus,
  resolveInfoCulturaAssetUrl,
} from '../../api/infoculturaApi';

type AdminHeroStat = { label: string; value: string | number };

type CountryOption = {
  code: string;
  label: string;
};

type PtDataDistrict = {
  code: string;
  name: string;
};

const PORTUGAL_COUNTRY_CODE = 'PT';
const DEFAULT_COUNTRY_OPTIONS: CountryOption[] = [{ code: PORTUGAL_COUNTRY_CODE, label: 'Portugal' }];
const PORTUGAL_DISTRICT_OPTIONS = [
  'Aveiro',
  'Beja',
  'Braga',
  'Bragança',
  'Castelo Branco',
  'Coimbra',
  'Évora',
  'Faro',
  'Guarda',
  'Leiria',
  'Lisboa',
  'Portalegre',
  'Porto',
  'Santarém',
  'Setúbal',
  'Viana do Castelo',
  'Vila Real',
  'Viseu',
  'Região Autónoma da Madeira',
  'Região Autónoma dos Açores',
];
const PORTUGAL_FALLBACK_MUNICIPALITIES_BY_DISTRICT: Record<string, string[]> = {
  Porto: [
    'Amarante',
    'Baião',
    'Felgueiras',
    'Gondomar',
    'Lousada',
    'Maia',
    'Marco de Canaveses',
    'Matosinhos',
    'Paços de Ferreira',
    'Paredes',
    'Penafiel',
    'Porto',
    'Póvoa de Varzim',
    'Santo Tirso',
    'Trofa',
    'Valongo',
    'Vila do Conde',
    'Vila Nova de Gaia',
  ],
};

function normalizeCountryOptions(payload: unknown): CountryOption[] {
  if (!Array.isArray(payload)) {
    return DEFAULT_COUNTRY_OPTIONS;
  }

  const options = payload
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const code = 'cca2' in item && typeof item.cca2 === 'string' ? item.cca2 : '';
      const name =
        'translations' in item &&
        item.translations &&
        typeof item.translations === 'object' &&
        'por' in item.translations &&
        item.translations.por &&
        typeof item.translations.por === 'object' &&
        'common' in item.translations.por &&
        typeof item.translations.por.common === 'string'
          ? item.translations.por.common
          : 'name' in item &&
              item.name &&
              typeof item.name === 'object' &&
              'common' in item.name &&
              typeof item.name.common === 'string'
            ? item.name.common
            : '';

      if (!code || !name) {
        return null;
      }

      return { code, label: name };
    })
    .filter((item): item is CountryOption => item !== null)
    .sort((left, right) => left.label.localeCompare(right.label, 'pt-PT'));

  return options.length > 0 ? options : DEFAULT_COUNTRY_OPTIONS;
}

function normalizePtDataDistricts(payload: unknown): PtDataDistrict[] {
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !payload.data || typeof payload.data !== 'object') {
    return [];
  }

  const districts =
    'districts' in payload.data && Array.isArray(payload.data.districts) ? payload.data.districts : [];

  return districts
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const code = 'code' in item && typeof item.code === 'string' ? item.code : '';
      const name = 'name' in item && typeof item.name === 'string' ? item.name : '';
      if (!code || !name) {
        return null;
      }

      return { code, name };
    })
    .filter((item): item is PtDataDistrict => item !== null);
}

function normalizePtDataMunicipalities(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !payload.data || typeof payload.data !== 'object') {
    return [];
  }

  const municipalities =
    'municipalities' in payload.data && Array.isArray(payload.data.municipalities)
      ? payload.data.municipalities
      : [];

  return municipalities
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      return 'name' in item && typeof item.name === 'string' ? item.name : null;
    })
    .filter((item): item is string => item !== null)
    .sort((left, right) => left.localeCompare(right, 'pt-PT'));
}

export type ActivitiesPageProps = {
  activitySectionLabel: string;
  activitySectionDescription: string;
  activityOverviewStats: AdminHeroStat[];
  showActivityFiltersAndList: boolean;
  canManageUsers: boolean;
  clubs: InfoCulturaClub[];
  activityClubFilter: string;
  setActivityClubFilter: Dispatch<SetStateAction<string>>;
  activityCategoryFilter: string;
  setActivityCategoryFilter: Dispatch<SetStateAction<string>>;
  activityStatusFilter: string;
  setActivityStatusFilter: Dispatch<SetStateAction<string>>;
  activityBookFeaturedFilter: string;
  setActivityBookFeaturedFilter: Dispatch<SetStateAction<string>>;
  activitySessionLocationFilter: string;
  setActivitySessionLocationFilter: Dispatch<SetStateAction<string>>;
  activitySessionRegistrationsFilter: string;
  setActivitySessionRegistrationsFilter: Dispatch<SetStateAction<string>>;
  activityEventCityFilter: string;
  setActivityEventCityFilter: Dispatch<SetStateAction<string>>;
  activityEventLocationFilter: string;
  setActivityEventLocationFilter: Dispatch<SetStateAction<string>>;
  activityError: string;
  handleApplyActivitySearch: (event: FormEvent<HTMLFormElement>) => void;
  activitySearchInput: string;
  setActivitySearchInput: Dispatch<SetStateAction<string>>;
  setActivitySearch: Dispatch<SetStateAction<string>>;
  setActivityPage: Dispatch<SetStateAction<number>>;
  activityDateFrom: string;
  setActivityDateFrom: Dispatch<SetStateAction<string>>;
  activityDateTo: string;
  setActivityDateTo: Dispatch<SetStateAction<string>>;
  activityOrder: string;
  setActivityOrder: Dispatch<SetStateAction<string>>;
  activityTab: ActivityTab;
  selectedBookIds: number[];
  setSelectedBookIds: Dispatch<SetStateAction<number[]>>;
  sortedBooks: InfoCulturaBook[];
  isDeletingBulkBooks: boolean;
  handleBulkDeleteBooks: () => void | Promise<void>;
  selectedEventIds: number[];
  setSelectedEventIds: Dispatch<SetStateAction<number[]>>;
  sortedEvents: InfoCulturaEvent[];
  bulkEventStatus: string;
  setBulkEventStatus: Dispatch<SetStateAction<string>>;
  availableEventStatuses: string[];
  isApplyingBulkEvents: boolean;
  handleApplyBulkEventStatus: () => void | Promise<void>;
  isDeletingBulkEvents: boolean;
  handleBulkDeleteEvents: () => void | Promise<void>;
  showActivityForm: boolean;
  handleSaveBook: (event: FormEvent<HTMLFormElement>) => void;
  editingBookId: number | null;
  bookForm: BookFormState;
  setBookForm: Dispatch<SetStateAction<BookFormState>>;
  bookImageFileKey: number;
  isUploadingBookImage: boolean;
  handleUploadBookImage: (file: File | null) => void | Promise<void>;
  bookFormError: string;
  isSavingBook: boolean;
  resetBookForm: () => void;
  handleEditBook: (book: InfoCulturaBook) => void;
  deletingBookId: number | null;
  handleDeleteBook: (id: number) => void | Promise<void>;
  changingBookStatusId: number | null;
  handleToggleBookActive: (id: number, shouldActivate: boolean) => void | Promise<void>;
  isLoadingActivities: boolean;
  activityTotal: number;
  activityPage: number;
  activityTotalPages: number;
  handleSaveSession: (event: FormEvent<HTMLFormElement>) => void;
  editingSessionId: number | null;
  sessionForm: SessionFormState;
  setSessionForm: Dispatch<SetStateAction<SessionFormState>>;
  sessionFormError: string;
  isSavingSession: boolean;
  resetSessionForm: () => void;
  handleEditSession: (session: InfoCulturaSession) => void;
  deletingSessionId: number | null;
  handleDeleteSession: (id: number) => void | Promise<void>;
  changingSessionStatusId: number | null;
  handleToggleSessionActive: (id: number, shouldActivate: boolean) => void | Promise<void>;
  sortedSessions: InfoCulturaSession[];
  handleSaveEvent: (event: FormEvent<HTMLFormElement>) => void;
  editingEventId: number | null;
  eventForm: EventFormState;
  setEventForm: Dispatch<SetStateAction<EventFormState>>;
  eventImageFileKey: number;
  isUploadingEventImage: boolean;
  handleUploadEventImage: (file: File | null) => void | Promise<void>;
  eventFormError: string;
  isSavingEvent: boolean;
  resetEventForm: () => void;
  handleEditEvent: (eventItem: InfoCulturaEvent) => void;
  deletingEventId: number | null;
  handleDeleteEvent: (id: number) => void | Promise<void>;
  changingEventStatusId: number | null;
  handleToggleEventActive: (id: number, shouldActivate: boolean) => void | Promise<void>;
  syncingEventbriteId: number | null;
  handleSyncEventbrite: (id: number, publish?: boolean) => void | Promise<void>;
  eventbriteConnection?: EventbriteConnectionStatus | null;
  isCheckingEventbriteConnection?: boolean;
  handleCheckEventbriteConnection?: () => void | Promise<void>;
  loadingEventbriteOrdersId: number | null;
  eventbriteRefundStatus: EventbriteRefundStatus;
  setEventbriteRefundStatus: Dispatch<SetStateAction<EventbriteRefundStatus>>;
  eventbriteOrdersByEventId: Record<number, EventbriteOrdersPage>;
  handleLoadEventbriteOrders: (id: number, refundStatus?: EventbriteRefundStatus) => void | Promise<void>;
  showEventCategories: boolean;
  handleSaveCategory: (event: FormEvent<HTMLFormElement>) => void;
  categoryForm: CategoryFormState;
  setCategoryForm: Dispatch<SetStateAction<CategoryFormState>>;
  categoryFormError: string;
  isSavingCategory: boolean;
  editingCategoryId: number | null;
  resetCategoryForm: () => void;
  sortedCategories: InfoCulturaCategory[];
  isLoadingCategories: boolean;
  handleEditCategory: (category: InfoCulturaCategory) => void;
  deletingCategoryId: number | null;
  handleDeleteCategory: (id: number) => void | Promise<void>;
  toggleSelectedId: (setter: Dispatch<SetStateAction<number[]>>, id: number) => void;
};

function ActivitiesPage({
  activitySectionLabel,
  activitySectionDescription,
  activityOverviewStats,
  showActivityFiltersAndList,
  canManageUsers,
  clubs,
  activityClubFilter,
  setActivityClubFilter,
  activityCategoryFilter,
  setActivityCategoryFilter,
  activityStatusFilter,
  setActivityStatusFilter,
  activityBookFeaturedFilter,
  setActivityBookFeaturedFilter,
  activitySessionLocationFilter,
  setActivitySessionLocationFilter,
  activitySessionRegistrationsFilter,
  setActivitySessionRegistrationsFilter,
  activityEventCityFilter,
  setActivityEventCityFilter,
  activityEventLocationFilter,
  setActivityEventLocationFilter,
  activityError,
  handleApplyActivitySearch,
  activitySearchInput,
  setActivitySearchInput,
  setActivitySearch,
  setActivityPage,
  activityDateFrom,
  setActivityDateFrom,
  activityDateTo,
  setActivityDateTo,
  activityOrder,
  setActivityOrder,
  activityTab,
  selectedBookIds,
  setSelectedBookIds,
  sortedBooks,
  isDeletingBulkBooks,
  handleBulkDeleteBooks,
  selectedEventIds,
  setSelectedEventIds,
  sortedEvents,
  bulkEventStatus,
  setBulkEventStatus,
  availableEventStatuses,
  isApplyingBulkEvents,
  handleApplyBulkEventStatus,
  isDeletingBulkEvents,
  handleBulkDeleteEvents,
  showActivityForm,
  handleSaveBook,
  editingBookId,
  bookForm,
  setBookForm,
  bookImageFileKey,
  isUploadingBookImage,
  handleUploadBookImage,
  bookFormError,
  isSavingBook,
  resetBookForm,
  handleEditBook,
  deletingBookId,
  handleDeleteBook,
  changingBookStatusId,
  handleToggleBookActive,
  isLoadingActivities,
  activityTotal,
  activityPage,
  activityTotalPages,
  handleSaveSession,
  editingSessionId,
  sessionForm,
  setSessionForm,
  sessionFormError,
  isSavingSession,
  resetSessionForm,
  handleEditSession,
  deletingSessionId,
  handleDeleteSession,
  changingSessionStatusId,
  handleToggleSessionActive,
  sortedSessions,
  handleSaveEvent,
  editingEventId,
  eventForm,
  setEventForm,
  eventImageFileKey,
  isUploadingEventImage,
  handleUploadEventImage,
  eventFormError,
  isSavingEvent,
  resetEventForm,
  handleEditEvent,
  deletingEventId,
  handleDeleteEvent,
  changingEventStatusId,
  handleToggleEventActive,
  syncingEventbriteId,
  handleSyncEventbrite,
  eventbriteConnection,
  isCheckingEventbriteConnection = false,
  handleCheckEventbriteConnection,
  loadingEventbriteOrdersId,
  eventbriteRefundStatus,
  setEventbriteRefundStatus,
  eventbriteOrdersByEventId,
  handleLoadEventbriteOrders,
  showEventCategories,
  handleSaveCategory,
  categoryForm,
  setCategoryForm,
  categoryFormError,
  isSavingCategory,
  editingCategoryId,
  resetCategoryForm,
  sortedCategories,
  isLoadingCategories,
  handleEditCategory,
  deletingCategoryId,
  handleDeleteCategory,
  toggleSelectedId,
}: ActivitiesPageProps) {
  const { locale } = useLocale();
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>(DEFAULT_COUNTRY_OPTIONS);
  const [portugalDistricts, setPortugalDistricts] = useState<string[]>(PORTUGAL_DISTRICT_OPTIONS);
  const [portugalDistrictCodesByName, setPortugalDistrictCodesByName] = useState<Record<string, string>>({});
  const [municipalitiesByDistrict, setMunicipalitiesByDistrict] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let active = true;

    async function loadCountryOptions() {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,translations,name');
        if (!response.ok) {
          throw new Error('Countries API unavailable');
        }

        const payload = (await response.json()) as unknown;
        if (!active) {
          return;
        }

        setCountryOptions(normalizeCountryOptions(payload));
      } catch {
        if (active) {
          setCountryOptions(DEFAULT_COUNTRY_OPTIONS);
        }
      }
    }

    void loadCountryOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      eventForm.country_code !== PORTUGAL_COUNTRY_CODE ||
      !eventForm.district ||
      municipalitiesByDistrict[eventForm.district]
    ) {
      return;
    }

    let active = true;

    async function loadDistrictMunicipalities() {
      try {
        const districtCode = portugalDistrictCodesByName[eventForm.district];
        if (!districtCode) {
          throw new Error('District code unavailable');
        }

        const response = await fetch(
          `https://api.ptdata.org/v1/geo/municipalities?district=${encodeURIComponent(districtCode)}&limit=500`
        );
        if (!response.ok) {
          throw new Error('District municipalities API unavailable');
        }

        const payload = (await response.json()) as unknown;
        if (!active) {
          return;
        }

        const municipios = normalizePtDataMunicipalities(payload);

        if (municipios.length === 0) {
          return;
        }

        setMunicipalitiesByDistrict((prev) => ({
          ...prev,
          [eventForm.district]: [...municipios].sort((left, right) =>
            left.localeCompare(right, 'pt-PT')
          ),
        }));
      } catch {
        if (!active) {
          return;
        }

        const fallbackMunicipalities =
          PORTUGAL_FALLBACK_MUNICIPALITIES_BY_DISTRICT[eventForm.district];
        if (!fallbackMunicipalities?.length) {
          return;
        }

        setMunicipalitiesByDistrict((prev) => ({
          ...prev,
          [eventForm.district]: fallbackMunicipalities,
        }));
      }
    }

    void loadDistrictMunicipalities();

    return () => {
      active = false;
    };
  }, [eventForm.country_code, eventForm.district, municipalitiesByDistrict]);

  useEffect(() => {
    let active = true;

    async function loadPortugalDistricts() {
      try {
        const response = await fetch('https://api.ptdata.org/v1/geo/districts');
        if (!response.ok) {
          throw new Error('ptdata unavailable');
        }

        const payload = (await response.json()) as unknown;
        if (!active) {
          return;
        }

        const normalized = normalizePtDataDistricts(payload);
        const nextDistricts = normalized
          .map((item) => item.name)
          .sort((left, right) => left.localeCompare(right, 'pt-PT'));
        const nextCodes = normalized.reduce<Record<string, string>>((accumulator, item) => {
          accumulator[item.name] = item.code;
          return accumulator;
        }, {});

        setPortugalDistricts(nextDistricts.length > 0 ? nextDistricts : PORTUGAL_DISTRICT_OPTIONS);
        setPortugalDistrictCodesByName(nextCodes);
      } catch {
        if (!active) {
          return;
        }
        setPortugalDistricts(PORTUGAL_DISTRICT_OPTIONS);
        setPortugalDistrictCodesByName({});
        setMunicipalitiesByDistrict({});
      }
    }

    void loadPortugalDistricts();

    return () => {
      active = false;
    };
  }, []);

  const allPortugalMunicipalities = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(municipalitiesByDistrict).flatMap((municipalities) => municipalities)
        )
      ).sort((left, right) => left.localeCompare(right, 'pt-PT')),
    [municipalitiesByDistrict]
  );

  const districtByMunicipality = useMemo(
    () =>
      Object.entries(municipalitiesByDistrict).reduce<Record<string, string>>(
        (accumulator, [district, municipalities]) => {
          municipalities.forEach((municipality) => {
            accumulator[municipality] = district;
          });
          return accumulator;
        },
        {}
      ),
    [municipalitiesByDistrict]
  );

  const currentDistrictMunicipalities = useMemo(() => {
    if (eventForm.country_code !== PORTUGAL_COUNTRY_CODE || !eventForm.district) {
      return [];
    }

    return (
      municipalitiesByDistrict[eventForm.district] ||
      PORTUGAL_FALLBACK_MUNICIPALITIES_BY_DISTRICT[eventForm.district] ||
      []
    );
  }, [eventForm.country_code, eventForm.district, municipalitiesByDistrict]);

  useEffect(() => {
    if (
      eventForm.country_code !== PORTUGAL_COUNTRY_CODE ||
      !eventForm.municipality ||
      eventForm.district ||
      !districtByMunicipality[eventForm.municipality]
    ) {
      return;
    }

    setEventForm((prev) =>
      prev.country_code === PORTUGAL_COUNTRY_CODE &&
      prev.municipality &&
      !prev.district &&
      districtByMunicipality[prev.municipality]
        ? {
            ...prev,
            district: districtByMunicipality[prev.municipality],
            eventbrite_venue_region:
              prev.eventbrite_venue_region || districtByMunicipality[prev.municipality],
          }
        : prev
    );
  }, [
    districtByMunicipality,
    eventForm.country_code,
    eventForm.district,
    eventForm.municipality,
    setEventForm,
  ]);

  const existingEventCities = useMemo(
    () =>
      Array.from(
        new Set(
          sortedEvents
            .map((item) => item.city.trim())
            .filter((city) => city.length > 0)
        )
      ).sort((left, right) => left.localeCompare(right, 'pt-PT')),
    [sortedEvents]
  );

  const existingEventLocations = useMemo(
    () =>
      Array.from(
        new Set(
          sortedEvents
            .map((item) => item.location.trim())
            .filter((location) => location.length > 0)
        )
      ).sort((left, right) => left.localeCompare(right, 'pt-PT')),
    [sortedEvents]
  );

  const existingSessionLocations = useMemo(
    () =>
      Array.from(
        new Set(
          sortedSessions
            .map((item) => item.location.trim())
            .filter((location) => location.length > 0)
        )
      ).sort((left, right) => left.localeCompare(right, 'pt-PT')),
    [sortedSessions]
  );

  return (
    <div className="space-y-6">
      <AdminPageHero
        icon={CalendarClock}
        title={activitySectionLabel}
        description={activitySectionDescription}
        tone="blue"
        stats={activityOverviewStats}
      />

      {showActivityFiltersAndList ? (
        <section className={adminPanelCard}>
          <div className={adminHeaderRow}>
            <div>
              <h2 className={blockTitle}>{activitySectionLabel}</h2>
              <p className={blockText}>{activitySectionDescription}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {canManageUsers ? (
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="activity-club-filter">
                    {getLocaleText(locale, 'Filtrar por clube', 'Filter by club')}
                  </label>
                  <select
                    id="activity-club-filter"
                    className={adminInput}
                    value={activityClubFilter}
                    onChange={(event) => setActivityClubFilter(event.target.value)}
                  >
                    <option value="all">{getLocaleText(locale, 'Todos os clubes', 'All clubs')}</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {activityTab === 'events' ? (
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="activity-category-filter">
                    {getLocaleText(locale, 'Filtrar por categoria', 'Filter by category')}
                  </label>
                  <select
                    id="activity-category-filter"
                    className={adminInput}
                    value={activityCategoryFilter}
                    onChange={(event) => setActivityCategoryFilter(event.target.value)}
                  >
                    <option value="all">{getLocaleText(locale, 'Todas as categorias', 'All categories')}</option>
                    {sortedCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {activityTab === 'events' ? (
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="activity-status-filter">
                    {getLocaleText(locale, 'Estado editorial', 'Editorial status')}
                  </label>
                  <select
                    id="activity-status-filter"
                    className={adminInput}
                    value={activityStatusFilter}
                    onChange={(event) => setActivityStatusFilter(event.target.value)}
                  >
                    <option value="all">{getLocaleText(locale, 'Todos os estados', 'All statuses')}</option>
                    {EVENT_WORKFLOW_ORDER.map((status) => (
                      <option key={status} value={status}>
                        {getWorkflowStatusLabel(status)}
                      </option>
                    ))}
                    </select>
                  </div>
                ) : null}
              {activityTab === 'books' ? (
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="activity-book-featured-filter">
                    {getLocaleText(locale, 'Destaque', 'Featured')}
                  </label>
                  <select
                    id="activity-book-featured-filter"
                    className={adminInput}
                    value={activityBookFeaturedFilter}
                    onChange={(event) => setActivityBookFeaturedFilter(event.target.value)}
                  >
                    <option value="all">{getLocaleText(locale, 'Todos os livros', 'All books')}</option>
                    <option value="featured">{getLocaleText(locale, 'Apenas em destaque', 'Featured only')}</option>
                    <option value="regular">{getLocaleText(locale, 'Sem destaque', 'Not featured')}</option>
                  </select>
                </div>
              ) : null}
              {activityTab === 'sessions' ? (
                <>
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="activity-session-registrations-filter">
                      {getLocaleText(locale, 'Inscrições', 'Registrations')}
                    </label>
                    <select
                      id="activity-session-registrations-filter"
                      className={adminInput}
                      value={activitySessionRegistrationsFilter}
                      onChange={(event) =>
                        setActivitySessionRegistrationsFilter(event.target.value)
                      }
                    >
                      <option value="all">{getLocaleText(locale, 'Todas', 'All')}</option>
                      <option value="open">{getLocaleText(locale, 'Abertas', 'Open')}</option>
                      <option value="closed">{getLocaleText(locale, 'Fechadas', 'Closed')}</option>
                    </select>
                  </div>
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="activity-session-location-filter">
                      {getLocaleText(locale, 'Local', 'Location')}
                    </label>
                    <input
                      id="activity-session-location-filter"
                      className={adminInput}
                      list={
                        existingSessionLocations.length > 0
                          ? 'activity-session-location-suggestions'
                          : undefined
                      }
                      value={activitySessionLocationFilter}
                      onChange={(event) => setActivitySessionLocationFilter(event.target.value)}
                      placeholder={getLocaleText(locale, 'Rua, sala ou local', 'Street, room or location')}
                    />
                    {existingSessionLocations.length > 0 ? (
                      <datalist id="activity-session-location-suggestions">
                        {existingSessionLocations.map((location) => (
                          <option key={location} value={location} />
                        ))}
                      </datalist>
                    ) : null}
                  </div>
                </>
              ) : null}
              {activityTab === 'events' ? (
                <>
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="activity-event-city-filter">
                      {getLocaleText(locale, 'Cidade', 'City')}
                    </label>
                    <input
                      id="activity-event-city-filter"
                      className={adminInput}
                      list={
                        existingEventCities.length > 0
                          ? 'activity-event-city-suggestions'
                          : undefined
                      }
                      value={activityEventCityFilter}
                      onChange={(event) => setActivityEventCityFilter(event.target.value)}
                      placeholder={getLocaleText(locale, 'Cidade ou concelho', 'City or municipality')}
                    />
                    {existingEventCities.length > 0 ? (
                      <datalist id="activity-event-city-suggestions">
                        {existingEventCities.map((city) => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    ) : null}
                  </div>
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="activity-event-location-filter">
                      {getLocaleText(locale, 'Local', 'Location')}
                    </label>
                    <input
                      id="activity-event-location-filter"
                      className={adminInput}
                      list={
                        existingEventLocations.length > 0
                          ? 'activity-event-location-suggestions'
                          : undefined
                      }
                      value={activityEventLocationFilter}
                      onChange={(event) => setActivityEventLocationFilter(event.target.value)}
                      placeholder={getLocaleText(locale, 'Rua, sala ou local', 'Street, room or location')}
                    />
                    {existingEventLocations.length > 0 ? (
                      <datalist id="activity-event-location-suggestions">
                        {existingEventLocations.map((location) => (
                          <option key={location} value={location} />
                        ))}
                      </datalist>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {activityError ? <p className={adminError}>{activityError}</p> : null}

          <div className={`${adminFormGridSpaced} mt-6`}>
            <form onSubmit={handleApplyActivitySearch} className={adminPanelForm}>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="activity-search">
                  {getLocaleText(locale, 'Pesquisar', 'Search')}{' '}
                  {activityTab === 'books'
                    ? getLocaleText(locale, 'livros', 'books')
                    : activityTab === 'sessions'
                      ? getLocaleText(locale, 'sessoes', 'sessions')
                      : getLocaleText(locale, 'eventos', 'events')}
                </label>
                <input
                  id="activity-search"
                  className={adminInput}
                  value={activitySearchInput}
                  onChange={(event) => setActivitySearchInput(event.target.value)}
                  placeholder={
                    activityTab === 'books'
                      ? getLocaleText(locale, 'Titulo, autor, editora ou clube', 'Title, author, publisher or club')
                      : activityTab === 'sessions'
                        ? getLocaleText(locale, 'Nome, titulo, descricao ou clube', 'Name, title, description or club')
                        : getLocaleText(locale, 'Titulo, descricao, local ou clube', 'Title, description, location or club')
                  }
                />
              </div>
              <div className={adminActions}>
                <button type="submit" className={adminBtnPrimary}>
                  {getLocaleText(locale, 'Pesquisar', 'Search')}
                </button>
                <button
                  type="button"
                  className={adminBtnSecondary}
                  onClick={() => {
                    setActivitySearchInput('');
                    setActivitySearch('');
                    setActivityPage(1);
                  }}
                >
                  {getLocaleText(locale, 'Limpar', 'Clear')}
                </button>
              </div>
            </form>


          </div>

          <div className={adminFormGridSpaced}>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="activity-date-from">
                {getLocaleText(locale, 'Data desde', 'Date from')}
              </label>
              <input
                id="activity-date-from"
                type="date"
                className={adminInput}
                value={activityDateFrom}
                onChange={(event) => setActivityDateFrom(event.target.value)}
              />
            </div>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="activity-date-to">
                {getLocaleText(locale, 'Data até', 'Date until')}
              </label>
              <input
                id="activity-date-to"
                type="date"
                className={adminInput}
                value={activityDateTo}
                onChange={(event) => setActivityDateTo(event.target.value)}
              />
            </div>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="activity-order">
                {getLocaleText(locale, 'Ordenar por', 'Sort by')}
              </label>
              <select
                id="activity-order"
                className={adminInput}
                value={activityOrder}
                onChange={(event) => setActivityOrder(event.target.value)}
              >
                {activityTab === 'books' ? (
                  <>
                    <option value="featured">{getLocaleText(locale, 'Destaque primeiro', 'Featured first')}</option>
                    <option value="newest">{getLocaleText(locale, 'Mais recentes', 'Newest')}</option>
                    <option value="oldest">{getLocaleText(locale, 'Mais antigos', 'Oldest')}</option>
                    <option value="title_asc">{getLocaleText(locale, 'Titulo A-Z', 'Title A-Z')}</option>
                    <option value="title_desc">{getLocaleText(locale, 'Titulo Z-A', 'Title Z-A')}</option>
                    <option value="year_desc">{getLocaleText(locale, 'Ano mais recente', 'Most recent year')}</option>
                    <option value="year_asc">{getLocaleText(locale, 'Ano mais antigo', 'Oldest year')}</option>
                    <option value="club_asc">{getLocaleText(locale, 'Clube A-Z', 'Club A-Z')}</option>
                    <option value="club_desc">{getLocaleText(locale, 'Clube Z-A', 'Club Z-A')}</option>
                  </>
                ) : activityTab === 'sessions' ? (
                  <>
                    <option value="date_asc">{getLocaleText(locale, 'Data mais proxima', 'Nearest date')}</option>
                    <option value="date_desc">{getLocaleText(locale, 'Data mais distante', 'Farthest date')}</option>
                    <option value="newest">{getLocaleText(locale, 'Mais recentes', 'Newest')}</option>
                    <option value="oldest">{getLocaleText(locale, 'Mais antigas', 'Oldest')}</option>
                    <option value="title_asc">{getLocaleText(locale, 'Titulo A-Z', 'Title A-Z')}</option>
                    <option value="title_desc">{getLocaleText(locale, 'Titulo Z-A', 'Title Z-A')}</option>
                    <option value="club_asc">{getLocaleText(locale, 'Clube A-Z', 'Club A-Z')}</option>
                    <option value="club_desc">{getLocaleText(locale, 'Clube Z-A', 'Club Z-A')}</option>
                  </>
                ) : (
                  <>
                    <option value="date_asc">{getLocaleText(locale, 'Data mais proxima', 'Nearest date')}</option>
                    <option value="date_desc">{getLocaleText(locale, 'Data mais distante', 'Farthest date')}</option>
                    <option value="newest">{getLocaleText(locale, 'Mais recentes', 'Newest')}</option>
                    <option value="oldest">{getLocaleText(locale, 'Mais antigos', 'Oldest')}</option>
                    <option value="title_asc">{getLocaleText(locale, 'Titulo A-Z', 'Title A-Z')}</option>
                    <option value="title_desc">{getLocaleText(locale, 'Titulo Z-A', 'Title Z-A')}</option>
                    <option value="club_asc">{getLocaleText(locale, 'Clube A-Z', 'Club A-Z')}</option>
                    <option value="club_desc">{getLocaleText(locale, 'Clube Z-A', 'Club Z-A')}</option>
                    <option value="status_asc">{getLocaleText(locale, 'Estado A-Z', 'Status A-Z')}</option>
                    <option value="status_desc">{getLocaleText(locale, 'Estado Z-A', 'Status Z-A')}</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {activityTab === 'books' ? (
            <div className={adminActions}>
              <button
                type="button"
                className={adminBtnSecondary}
                onClick={() =>
                  setSelectedBookIds(
                    selectedBookIds.length === sortedBooks.length
                      ? []
                      : sortedBooks.map((item) => item.id)
                  )
                }
                disabled={sortedBooks.length === 0}
              >
                {selectedBookIds.length === sortedBooks.length && sortedBooks.length > 0
                  ? getLocaleText(locale, 'Limpar seleção', 'Clear selection')
                  : getLocaleText(locale, 'Selecionar página', 'Select page')}
              </button>
              <button
                type="button"
                className={adminBtnDanger}
                disabled={selectedBookIds.length === 0 || isDeletingBulkBooks}
                onClick={() => void handleBulkDeleteBooks()}
              >
                {isDeletingBulkBooks ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar selecionados', 'Delete selected')}
              </button>
            </div>
          ) : null}

          {activityTab === 'events' ? (
            <div className={adminActions}>
              <button
                type="button"
                className={adminBtnSecondary}
                onClick={() =>
                  setSelectedEventIds(
                    selectedEventIds.length === sortedEvents.length
                      ? []
                      : sortedEvents.map((item) => item.id)
                  )
                }
                disabled={sortedEvents.length === 0}
              >
                {selectedEventIds.length === sortedEvents.length && sortedEvents.length > 0
                  ? getLocaleText(locale, 'Limpar seleção', 'Clear selection')
                  : getLocaleText(locale, 'Selecionar página', 'Select page')}
              </button>
              <select
                className={adminInput}
                value={bulkEventStatus}
                onChange={(event) => setBulkEventStatus(event.target.value)}
              >
                {availableEventStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getWorkflowStatusLabel(status)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={adminBtnPrimary}
                disabled={selectedEventIds.length === 0 || isApplyingBulkEvents}
                onClick={() => void handleApplyBulkEventStatus()}
              >
                {isApplyingBulkEvents ? getLocaleText(locale, 'A aplicar...', 'Applying...') : getLocaleText(locale, 'Aplicar em lote', 'Apply in bulk')}
              </button>
              <button
                type="button"
                className={adminBtnDanger}
                disabled={selectedEventIds.length === 0 || isDeletingBulkEvents}
                onClick={() => void handleBulkDeleteEvents()}
              >
                {isDeletingBulkEvents ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar selecionados', 'Delete selected')}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activityTab === 'books' ? (
        <>
          {showActivityForm ? (
            <form id="activity-form" onSubmit={handleSaveBook} className={adminPanelForm}>
              <h2 className={blockTitle}>{editingBookId ? getLocaleText(locale, 'Editar Livro', 'Edit Book') : getLocaleText(locale, 'Novo Livro', 'New Book')}</h2>

              <div className={adminFormGridSpaced}>
                {canManageUsers ? (
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="book-club-id">
                      {getLocaleText(locale, 'Clube', 'Club')}
                    </label>
                    <select
                      id="book-club-id"
                      className={adminInput}
                      value={bookForm.club_id}
                      required={canManageUsers && activityClubFilter === 'all'}
                      onChange={(event) => {
                        const nextClubId = event.target.value;
                        if (import.meta.env.DEV) {
                          console.log('[InfoCultura club select]', { nextClubId });
                        }
                        setBookForm((prev) => ({ ...prev, club_id: nextClubId }));
                        if (canManageUsers) {
                          setActivityClubFilter(nextClubId || 'all');
                        }
                      }}
                    >
                      <option value="">{getLocaleText(locale, 'Seleciona um clube', 'Select a club')}</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="book-title">
                    {getLocaleText(locale, 'Titulo', 'Title')}
                  </label>
                  <input
                    id="book-title"
                    className={adminInput}
                    value={bookForm.title}
                    onChange={(event) =>
                      setBookForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="book-author">
                    {getLocaleText(locale, 'Autor', 'Author')}
                  </label>
                  <input
                    id="book-author"
                    className={adminInput}
                    value={bookForm.author}
                    onChange={(event) =>
                      setBookForm((prev) => ({ ...prev, author: event.target.value }))
                    }
                  />
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="book-year">
                    {getLocaleText(locale, 'Ano', 'Year')}
                  </label>
                  <input
                    id="book-year"
                    type="number"
                    className={adminInput}
                    value={bookForm.publication_year}
                    onChange={(event) =>
                      setBookForm((prev) => ({
                        ...prev,
                        publication_year: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className={adminFormGridSpaced}>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="book-publisher">
                    {getLocaleText(locale, 'Editora', 'Publisher')}
                  </label>
                  <input
                    id="book-publisher"
                    className={adminInput}
                    value={bookForm.publisher}
                    onChange={(event) =>
                      setBookForm((prev) => ({ ...prev, publisher: event.target.value }))
                    }
                  />
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="book-cover">
                    {getLocaleText(locale, 'Capa', 'Cover')}
                  </label>
                  <input
                    id="book-cover"
                    key={bookImageFileKey}
                    type="file"
                    accept="image/*"
                    className={adminInput}
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      void handleUploadBookImage(file);
                    }}
                  />
                  <p className={blockText}>
                    {isUploadingBookImage
                      ? getLocaleText(locale, 'A carregar capa...', 'Uploading cover...')
                      : bookForm.cover_image
                        ? getLocaleText(locale, 'Capa carregada com sucesso.', 'Cover uploaded successfully.')
                        : getLocaleText(locale, 'Seleciona uma imagem do computador ou telemovel.', 'Select an image from your computer or phone.')}
                  </p>
                  {bookForm.cover_image ? (
                    <img
                      src={resolveInfoCulturaAssetUrl(bookForm.cover_image)}
                      alt={getLocaleText(locale, 'Preview da capa', 'Cover preview')}
                      className="mt-3 h-40 w-full rounded-xl object-cover"
                    />
                  ) : null}
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="book-featured">
                    {getLocaleText(locale, 'Destaque', 'Featured')}
                  </label>
                  <select
                    id="book-featured"
                    className={adminInput}
                    value={bookForm.is_featured ? 'sim' : 'nao'}
                    onChange={(event) =>
                      setBookForm((prev) => ({
                        ...prev,
                        is_featured: event.target.value === 'sim',
                      }))
                    }
                  >
                    <option value="nao">{getLocaleText(locale, 'Nao', 'No')}</option>
                    <option value="sim">{getLocaleText(locale, 'Sim', 'Yes')}</option>
                  </select>
                </div>

	                <div className={adminField}>
	                  <label className={adminLabel} htmlFor="book-available-at">
	                    {getLocaleText(locale, 'Publicar em', 'Publish at')}
	                  </label>
                  <input
                    id="book-available-at"
                    type="datetime-local"
                    className={adminInput}
                    value={bookForm.available_at}
                    onChange={(event) =>
                      setBookForm((prev) => ({ ...prev, available_at: event.target.value }))
                    }
                  />
	                  <p className={blockText}>
	                    {getLocaleText(locale, 'Usa "Publicar agora" para publicar imediatamente ou escolhe data/hora futura e clica em "Agendar".', 'Use "Publish now" to publish immediately or choose a future date/time and click "Schedule".')}
	                  </p>
	                </div>
              </div>

              <div className={adminFieldSpaced}>
                <label className={adminLabel} htmlFor="book-summary">
                  {getLocaleText(locale, 'Resumo', 'Summary')}
                </label>
                <textarea
                  id="book-summary"
                  rows={5}
                  className={adminTextarea}
                  value={bookForm.summary}
                  onChange={(event) =>
                    setBookForm((prev) => ({ ...prev, summary: event.target.value }))
                  }
                />
              </div>

              {bookFormError ? <p className={adminError}>{bookFormError}</p> : null}

              <div className={adminActions}>
                <button
                  type="submit"
                  className={adminBtnPrimary}
                  disabled={
                    isSavingBook ||
                    (canManageUsers && activityClubFilter === 'all' && !bookForm.club_id)
                  }
	                >
	                  {isSavingBook ? getLocaleText(locale, 'A guardar...', 'Saving...') : editingBookId ? getLocaleText(locale, 'Atualizar', 'Update') : getLocaleText(locale, 'Guardar', 'Save')}
	                </button>
	                <button
	                  type="submit"
	                  name="bookAction"
	                  value="publish_now"
	                  className={adminBtnSecondary}
	                  disabled={isSavingBook}
	                >
	                  {getLocaleText(locale, 'Publicar agora', 'Publish now')}
	                </button>
	                <button
	                  type="submit"
	                  name="bookAction"
	                  value="schedule"
	                  className={adminBtnSecondary}
	                  disabled={isSavingBook}
	                >
	                  {getLocaleText(locale, 'Agendar', 'Schedule')}
	                </button>
	                <button type="button" onClick={resetBookForm} className={adminBtnSecondary}>
	                  {getLocaleText(locale, 'Limpar', 'Clear')}
	                </button>
              </div>
            </form>
          ) : null}

          {showActivityFiltersAndList ? (
            <div id="activity-list" className={adminList}>
              {isLoadingActivities ? <p className={adminInfo}>{getLocaleText(locale, 'A carregar livros...', 'Loading books...')}</p> : null}
              {!isLoadingActivities && sortedBooks.length === 0 ? (
                <p className={adminInfo}>{getLocaleText(locale, 'Não existem livros para o filtro atual.', 'There are no books for the current filter.')}</p>
              ) : null}
              {sortedBooks.map((item) => (
                <article key={item.id} className={adminListItem}>
                  <div className={adminListTop}>
                    <div className={adminListHeader}>
                      <label className={adminListCheckbox}>
                        <input
                          type="checkbox"
                          checked={selectedBookIds.includes(item.id)}
                          onChange={() => toggleSelectedId(setSelectedBookIds, item.id)}
                        />
                        {getLocaleText(locale, 'Selecionar', 'Select')}
                      </label>
                      <h3 className={adminListTitle}>{item.title}</h3>
                      <p className={adminListMeta}>
                        <span className={adminListBadge}>{item.club_name}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        {item.author} · {item.publication_year}
                      </p>
                    </div>
                    <div className={adminListTools}>
                      <button type="button" className={adminBtnEdit} onClick={() => handleEditBook(item)}>
                        {getLocaleText(locale, 'Editar', 'Edit')}
                      </button>
                      <button
                        type="button"
                        className={item.is_active ? adminBtnSecondary : adminBtnPrimary}
                        disabled={changingBookStatusId === item.id}
                        onClick={() => void handleToggleBookActive(item.id, !item.is_active)}
                      >
                        {changingBookStatusId === item.id
                          ? getLocaleText(locale, 'A atualizar...', 'Updating...')
                          : item.is_active
                            ? getLocaleText(locale, 'Desativar', 'Deactivate')
                            : getLocaleText(locale, 'Ativar', 'Activate')}
                      </button>
                      <button
                        type="button"
                        className={adminBtnDanger}
                        disabled={deletingBookId === item.id}
                        onClick={() => handleDeleteBook(item.id)}
                      >
                        {deletingBookId === item.id ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar', 'Delete')}
                      </button>
                    </div>
                  </div>
                  <p className={adminListDesc}>{item.summary}</p>
                </article>
              ))}
            </div>
          ) : null}
          {showActivityFiltersAndList && !isLoadingActivities ? (
            <div className={`${adminActions} mt-6`}>
              <p className={adminInfo}>
                {activityTotal} {getLocaleText(locale, 'livro(s)', 'book(s)')} · {getLocaleText(locale, 'pagina', 'page')} {activityPage} {getLocaleText(locale, 'de', 'of')} {activityTotalPages || 1}
              </p>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={activityPage <= 1}
                onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
              >
                {getLocaleText(locale, 'Anterior', 'Previous')}
              </button>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={activityTotalPages === 0 || activityPage >= activityTotalPages}
                onClick={() => setActivityPage((prev) => prev + 1)}
              >
                {getLocaleText(locale, 'Seguinte', 'Next')}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {activityTab === 'sessions' ? (
        <>
          {showActivityForm ? (
            <form id="activity-form" onSubmit={handleSaveSession} className={adminPanelForm}>
              <h2 className={blockTitle}>{editingSessionId ? getLocaleText(locale, 'Editar Sessao', 'Edit Session') : getLocaleText(locale, 'Nova Sessao', 'New Session')}</h2>

              <div className={adminFormGridSpaced}>
                {canManageUsers ? (
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="session-club-id">
                      {getLocaleText(locale, 'Clube', 'Club')}
                    </label>
                    <select
                      id="session-club-id"
                      className={adminInput}
                      value={sessionForm.club_id}
                      onChange={(event) =>
                        setSessionForm((prev) => ({ ...prev, club_id: event.target.value }))
                      }
                    >
                      <option value="">{getLocaleText(locale, 'Seleciona um clube', 'Select a club')}</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="session-name">
                    {getLocaleText(locale, 'Nome curto', 'Short name')}
                  </label>
                  <input
                    id="session-name"
                    className={adminInput}
                    pattern={adminNamePattern}
                    title={adminNameTitle}
                    value={sessionForm.name}
                    onChange={(event) =>
                      setSessionForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="session-title">
                    {getLocaleText(locale, 'Titulo', 'Title')}
                  </label>
                  <input
                    id="session-title"
                    className={adminInput}
                    value={sessionForm.title}
                    onChange={(event) =>
                      setSessionForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className={adminFormGridSpaced}>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="session-start">
                    {getLocaleText(locale, 'Inicio', 'Start')}
                  </label>
                  <input
                    id="session-start"
                    type="datetime-local"
                    className={adminInput}
                    value={sessionForm.start_date}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        start_date: event.target.value,
                      }))
                    }
                  />
                </div>

	                <div className={adminField}>
	                  <label className={adminLabel} htmlFor="session-end">
                    {getLocaleText(locale, 'Fim', 'End')}
                  </label>
                  <input
                    id="session-end"
                    type="datetime-local"
                    className={adminInput}
                    value={sessionForm.end_date}
                    onChange={(event) =>
                      setSessionForm((prev) => ({ ...prev, end_date: event.target.value }))
                    }
	                  />
	                </div>

	                <div className={adminField}>
	                  <label className={adminLabel} htmlFor="session-available-at">
	                    {getLocaleText(locale, 'Publicar em', 'Publish at')}
	                  </label>
	                  <input
	                    id="session-available-at"
	                    type="datetime-local"
	                    className={adminInput}
	                    value={sessionForm.available_at}
	                    onChange={(event) =>
	                      setSessionForm((prev) => ({ ...prev, available_at: event.target.value }))
	                    }
	                  />
	                  <p className={blockText}>
	                    {getLocaleText(locale, 'Usa "Publicar agora" para publicar imediatamente ou escolhe data/hora futura e clica em "Agendar".', 'Use "Publish now" to publish immediately or choose a future date/time and click "Schedule".')}
	                  </p>
	                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="session-location">
                    {getLocaleText(locale, 'Local', 'Location')}
                  </label>
                  <GoogleMapsLocationField
                    inputId="session-location"
                    suggestions={existingSessionLocations}
                    citySuggestions={existingEventCities}
                    value={sessionForm.location}
                    onLocationChange={(nextLocation) =>
                      setSessionForm((prev) => ({ ...prev, location: nextLocation }))
                    }
                    onCityChange={() => undefined}
                  />
                </div>

	                <div className={adminField}>
	                  <label className={adminLabel} htmlFor="session-registrations-enabled">
                    {getLocaleText(locale, 'Inscricoes', 'Registrations')}
                  </label>
                  <select
                    id="session-registrations-enabled"
                    className={adminInput}
                    value={sessionForm.enable_registrations ? 'sim' : 'nao'}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        enable_registrations: event.target.value === 'sim',
                      }))
                    }
                  >
                    <option value="nao">{getLocaleText(locale, 'Fechadas', 'Closed')}</option>
                    <option value="sim">{getLocaleText(locale, 'Abertas', 'Open')}</option>
                  </select>
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="session-registration-capacity">
                    {getLocaleText(locale, 'Lotacao', 'Capacity')}
                  </label>
                  <input
                    id="session-registration-capacity"
                    type="number"
                    min="1"
                    className={adminInput}
                    value={sessionForm.registration_capacity}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        registration_capacity: event.target.value,
                      }))
                    }
                  />
                  <p className={blockText}>
                    {getLocaleText(locale, 'Define o numero maximo de lugares antes de ativar lista de espera.', 'Define the maximum number of places before activating the waiting list.')}
                  </p>
                </div>
              </div>

              <div className={adminFieldSpaced}>
                <label className={adminLabel} htmlFor="session-description">
                  {getLocaleText(locale, 'Descricao', 'Description')}
                </label>
                <textarea
                  id="session-description"
                  rows={5}
                  className={adminTextarea}
                  value={sessionForm.description}
                  onChange={(event) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              {sessionFormError ? <p className={adminError}>{sessionFormError}</p> : null}

              <div className={adminActions}>
	                <button type="submit" className={adminBtnPrimary} disabled={isSavingSession}>
	                  {isSavingSession ? getLocaleText(locale, 'A guardar...', 'Saving...') : editingSessionId ? getLocaleText(locale, 'Atualizar', 'Update') : getLocaleText(locale, 'Guardar', 'Save')}
	                </button>
	                <button
	                  type="submit"
	                  name="sessionAction"
	                  value="publish_now"
	                  className={adminBtnSecondary}
	                  disabled={isSavingSession}
	                >
	                  {getLocaleText(locale, 'Publicar agora', 'Publish now')}
	                </button>
	                <button
	                  type="submit"
	                  name="sessionAction"
	                  value="schedule"
	                  className={adminBtnSecondary}
	                  disabled={isSavingSession}
	                >
	                  {getLocaleText(locale, 'Agendar', 'Schedule')}
	                </button>
	                <button type="button" onClick={resetSessionForm} className={adminBtnSecondary}>
	                  {getLocaleText(locale, 'Limpar', 'Clear')}
	                </button>
              </div>
            </form>
          ) : null}

          {showActivityFiltersAndList ? (
            <div id="activity-list" className={adminList}>
              {isLoadingActivities ? <p className={adminInfo}>{getLocaleText(locale, 'A carregar sessoes...', 'Loading sessions...')}</p> : null}
              {!isLoadingActivities && sortedSessions.length === 0 ? (
                <p className={adminInfo}>{getLocaleText(locale, 'Nao existem sessoes para o filtro atual.', 'There are no sessions for the current filter.')}</p>
              ) : null}
              {sortedSessions.map((item) => (
                <article key={item.id} className={adminListItem}>
                  <div className={adminListTop}>
                    <div className={adminListHeader}>
                      <h3 className={adminListTitle}>{item.title}</h3>
                      <p className={adminListMeta}>
                        <span className={adminListBadge}>{item.club_name}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        {formatAdminDateTime(item.start_date)}
                      </p>
                    </div>
                    <div className={adminListTools}>
                      <button type="button" className={adminBtnEdit} onClick={() => handleEditSession(item)}>
                        {getLocaleText(locale, 'Editar', 'Edit')}
                      </button>
                      <button
                        type="button"
                        className={item.is_active ? adminBtnSecondary : adminBtnPrimary}
                        disabled={changingSessionStatusId === item.id}
                        onClick={() => void handleToggleSessionActive(item.id, !item.is_active)}
                      >
                        {changingSessionStatusId === item.id
                          ? getLocaleText(locale, 'A atualizar...', 'Updating...')
                          : item.is_active
                            ? getLocaleText(locale, 'Desativar', 'Deactivate')
                            : getLocaleText(locale, 'Ativar', 'Activate')}
                      </button>
                      <button
                        type="button"
                        className={adminBtnDanger}
                        disabled={deletingSessionId === item.id}
                        onClick={() => handleDeleteSession(item.id)}
                      >
                        {deletingSessionId === item.id ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar', 'Delete')}
                      </button>
                    </div>
                  </div>
                  <p className={adminListDesc}>{item.description}</p>
                  <p className={adminListMeta}>
                    {item.location ? `${getLocaleText(locale, 'Local', 'Location')} ${item.location} · ` : ''}
                    {getLocaleText(locale, 'Inscricoes', 'Registrations')} {item.enable_registrations ? getLocaleText(locale, 'abertas', 'open') : getLocaleText(locale, 'fechadas', 'closed')} ·
                    {getLocaleText(locale, 'Confirmadas', 'Confirmed')} {item.confirmed_registrations} · {getLocaleText(locale, 'Espera', 'Waitlist')} {item.waitlist_registrations}
                    {item.registration_capacity !== null && item.registration_capacity !== undefined
                      ? ` · ${getLocaleText(locale, 'Lotacao', 'Capacity')} ${item.registration_capacity}`
                      : ''}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
          {showActivityFiltersAndList && !isLoadingActivities ? (
            <div className={`${adminActions} mt-6`}>
              <p className={adminInfo}>
                {activityTotal} {getLocaleText(locale, 'sessao(oes)', 'session(s)')} · {getLocaleText(locale, 'pagina', 'page')} {activityPage} {getLocaleText(locale, 'de', 'of')} {activityTotalPages || 1}
              </p>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={activityPage <= 1}
                onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
              >
                {getLocaleText(locale, 'Anterior', 'Previous')}
              </button>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={activityTotalPages === 0 || activityPage >= activityTotalPages}
                onClick={() => setActivityPage((prev) => prev + 1)}
              >
                {getLocaleText(locale, 'Seguinte', 'Next')}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {activityTab === 'events' ? (
        <>
          {showActivityForm ? (
            <form id="activity-form" onSubmit={handleSaveEvent} className={adminPanelForm}>
              <h2 className={blockTitle}>
                {editingEventId
                  ? getLocaleText(locale, 'Editar Evento', 'Edit Event')
                  : getLocaleText(locale, 'Novo Evento', 'New Event')}
              </h2>
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <button
                  type="button"
                  className={adminBtnSecondary}
                  disabled={isCheckingEventbriteConnection || !handleCheckEventbriteConnection}
                  onClick={() => {
                    void handleCheckEventbriteConnection?.();
                  }}
                >
                  {isCheckingEventbriteConnection
                    ? getLocaleText(locale, 'A verificar...', 'Checking...')
                    : getLocaleText(locale, 'Verificar Eventbrite', 'Check Eventbrite')}
                </button>
                {eventbriteConnection ? (
                  <p className={eventbriteConnection.connected ? adminInfo : adminError}>
                    {eventbriteConnection.connected
                      ? `${getLocaleText(locale, 'Ligado a', 'Connected to')} ${eventbriteConnection.organization_name || eventbriteConnection.organization_id || 'Eventbrite'}`
                      : eventbriteConnection.message || getLocaleText(locale, 'Eventbrite nao configurada', 'Eventbrite is not configured')}
                  </p>
                ) : null}
              </div>

              <div className={adminFormGridSpaced}>
                {canManageUsers ? (
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="event-club-id">
                      {getLocaleText(locale, 'Clube', 'Club')}
                    </label>
                    <select
                      id="event-club-id"
                      className={adminInput}
                      value={eventForm.club_id}
                      onChange={(event) =>
                        setEventForm((prev) => ({ ...prev, club_id: event.target.value }))
                      }
                    >
                      <option value="">{getLocaleText(locale, 'Seleciona um clube', 'Select a club')}</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-title">
                    {getLocaleText(locale, 'Titulo', 'Title')}
                  </label>
                  <input
                    id="event-title"
                    className={adminInput}
                    value={eventForm.title}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-status">
                    {getLocaleText(locale, 'Estado', 'Status')}
                  </label>
                  <select
                    id="event-status"
                    className={adminInput}
                    value={eventForm.status}
                    onChange={(event) =>
                      setEventForm((prev) => ({
                        ...prev,
                        status: normalizeWorkflowStatus(event.target.value),
                      }))
                    }
                  >
                    {availableEventStatuses.map((status) => (
                      <option key={status} value={status}>
                        {getWorkflowStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <p className={blockText}>
                    {canManageUsers
                      ? getLocaleText(locale, 'Podes rever, publicar ou arquivar o evento.', 'You can review, publish or archive the event.')
                      : getLocaleText(locale, 'O evento pode ficar em rascunho ou seguir para revisao.', 'The event can stay in draft or move to review.')}
                  </p>
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-categories">
                    {getLocaleText(locale, 'Categorias', 'Categories')}
                  </label>
                  <select
                    id="event-categories"
                    multiple
                    className={adminInput}
                    value={eventForm.category_ids}
                    onChange={(event) =>
                      setEventForm((prev) => ({
                        ...prev,
                        category_ids: Array.from(event.target.selectedOptions).map(
                          (option) => option.value
                        ),
                      }))
                    }
                  >
                    {sortedCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={adminFormGridSpaced}>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-start">
                    {getLocaleText(locale, 'Inicio', 'Start')}
                  </label>
                  <input
                    id="event-start"
                    type="datetime-local"
                    className={adminInput}
                    value={eventForm.start_date}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, start_date: event.target.value }))
                    }
                  />
                </div>

	                <div className={adminField}>
	                  <label className={adminLabel} htmlFor="event-end">
                    {getLocaleText(locale, 'Fim', 'End')}
                  </label>
                  <input
                    id="event-end"
                    type="datetime-local"
                    className={adminInput}
                    value={eventForm.end_date}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, end_date: event.target.value }))
                    }
	                  />
	                </div>

	                <div className={adminField}>
	                  <label className={adminLabel} htmlFor="event-publish-at">
	                    {getLocaleText(locale, 'Publicar em', 'Publish at')}
	                  </label>
	                  <input
	                    id="event-publish-at"
	                    type="datetime-local"
	                    className={adminInput}
	                    value={eventForm.publish_at}
	                    onChange={(event) =>
	                      setEventForm((prev) => ({ ...prev, publish_at: event.target.value }))
	                    }
	                  />
	                  <p className={blockText}>
	                    {getLocaleText(locale, 'Usa "Publicar agora" para publicar imediatamente ou escolhe data/hora futura e clica em "Agendar".', 'Use "Publish now" to publish immediately or choose a future date/time and click "Schedule".')}
	                  </p>
	                </div>

	                <div className={adminField}>
	                  <label className={adminLabel} htmlFor="event-external">
                    {getLocaleText(locale, 'Externo', 'External')}
                  </label>
                  <select
                    id="event-external"
                    className={adminInput}
                    value={eventForm.is_external ? 'sim' : 'nao'}
                    onChange={(event) =>
                      setEventForm((prev) => ({
                        ...prev,
                        is_external: event.target.value === 'sim',
                      }))
                    }
                  >
                    <option value="nao">{getLocaleText(locale, 'Nao', 'No')}</option>
                    <option value="sim">{getLocaleText(locale, 'Sim', 'Yes')}</option>
                  </select>
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-registrations-enabled">
                    {getLocaleText(locale, 'Inscricoes', 'Registrations')}
                  </label>
                  <select
                    id="event-registrations-enabled"
                    className={adminInput}
                    value={eventForm.enable_registrations ? 'sim' : 'nao'}
                    onChange={(event) =>
                      setEventForm((prev) => ({
                        ...prev,
                        enable_registrations: event.target.value === 'sim',
                      }))
                    }
                  >
                    <option value="nao">{getLocaleText(locale, 'Fechadas', 'Closed')}</option>
                    <option value="sim">{getLocaleText(locale, 'Abertas', 'Open')}</option>
                  </select>
                </div>
              </div>

              <div className={adminFormGridSpaced}>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-country">
                    País
                  </label>
                  <select
                    id="event-country"
                    className={adminInput}
                    value={eventForm.country_code}
                    onChange={(event) => {
                      const nextCountryCode = event.target.value;
                      setEventForm((prev) => ({
                        ...prev,
                        country_code: nextCountryCode,
                        district: nextCountryCode === PORTUGAL_COUNTRY_CODE ? prev.district : '',
                        municipality: nextCountryCode === PORTUGAL_COUNTRY_CODE ? prev.municipality : '',
                        eventbrite_venue_country: nextCountryCode,
                        eventbrite_venue_region:
                          nextCountryCode === PORTUGAL_COUNTRY_CODE ? prev.eventbrite_venue_region : '',
                      }));
                    }}
                  >
                    {countryOptions.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>

                {eventForm.country_code === PORTUGAL_COUNTRY_CODE ? (
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="event-district">
                      {getLocaleText(locale, 'Distrito', 'District')}
                    </label>
                    <select
                      id="event-district"
                      className={adminInput}
                      value={eventForm.district}
                      onChange={(event) => {
                        const nextDistrict = event.target.value;
                        setEventForm((prev) => ({
                          ...prev,
                          district: nextDistrict,
                          municipality: '',
                          eventbrite_venue_region: nextDistrict,
                          eventbrite_venue_city: '',
                          city: '',
                        }));
                      }}
                    >
                      <option value="">{getLocaleText(locale, 'Seleciona um distrito', 'Select a district')}</option>
                      {portugalDistricts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {eventForm.country_code === PORTUGAL_COUNTRY_CODE ? (
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="event-municipality">
                      {getLocaleText(locale, 'Concelho', 'Municipality')}
                    </label>
                    <select
                      id="event-municipality"
                      className={adminInput}
                      value={eventForm.municipality}
                      onChange={(event) => {
                        const nextMunicipality = event.target.value;
                        setEventForm((prev) => ({
                          ...prev,
                          municipality: nextMunicipality,
                          city: nextMunicipality,
                          eventbrite_venue_city: nextMunicipality,
                        }));
                      }}
                      disabled={!eventForm.district}
                    >
                      <option value="">
                        {eventForm.district
                          ? getLocaleText(locale, 'Seleciona um concelho', 'Select a municipality')
                          : getLocaleText(locale, 'Escolhe primeiro o distrito', 'Choose the district first')}
                      </option>
                      {currentDistrictMunicipalities.map((municipality) => (
                        <option key={municipality} value={municipality}>
                          {municipality}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-city">
                    {getLocaleText(locale, 'Cidade / Localidade', 'City / Locality')}
                  </label>
                  <input
                    id="event-city"
                    className={adminInput}
                    list={
                      eventForm.country_code === PORTUGAL_COUNTRY_CODE
                        ? 'event-city-suggestions'
                        : existingEventCities.length > 0
                          ? 'event-city-suggestions'
                          : undefined
                    }
                    value={eventForm.city}
                    onChange={(event) => {
                      const nextCity = event.target.value;
                      setEventForm((prev) => ({
                        ...prev,
                        city: nextCity,
                        municipality:
                          prev.country_code === PORTUGAL_COUNTRY_CODE &&
                          allPortugalMunicipalities.includes(nextCity)
                            ? nextCity
                            : prev.country_code === PORTUGAL_COUNTRY_CODE
                              ? ''
                              : prev.municipality,
                      }));
                    }}
                  />
                  {eventForm.country_code === PORTUGAL_COUNTRY_CODE || existingEventCities.length > 0 ? (
                    <datalist id="event-city-suggestions">
                      {(eventForm.country_code === PORTUGAL_COUNTRY_CODE
                        ? allPortugalMunicipalities
                        : existingEventCities
                      ).map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  ) : null}
                  {eventForm.country_code === PORTUGAL_COUNTRY_CODE ? (
                    <p className={blockText}>
                      {getLocaleText(locale, 'Lista com municípios de Portugal carregada a partir da GEO API PT.', 'List of Portuguese municipalities loaded from the GEO API PT.')}
                    </p>
                  ) : null}
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-location">
                    {getLocaleText(locale, 'Local', 'Location')}
                  </label>
                  <GoogleMapsLocationField
                    inputId="event-location"
                    suggestions={existingEventLocations}
                    citySuggestions={
                      eventForm.country_code === PORTUGAL_COUNTRY_CODE
                        ? allPortugalMunicipalities
                        : existingEventCities
                    }
                    value={eventForm.location}
                    onLocationChange={(nextLocation) =>
                      setEventForm((prev) => ({ ...prev, location: nextLocation }))
                    }
                    onCityChange={(nextCity) =>
                      setEventForm((prev) => ({ ...prev, city: nextCity }))
                    }
                  />
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-registration-capacity">
                    {getLocaleText(locale, 'Lotacao', 'Capacity')}
                  </label>
                  <input
                    id="event-registration-capacity"
                    type="number"
                    min="1"
                    className={adminInput}
                    value={eventForm.registration_capacity}
                    onChange={(event) =>
                      setEventForm((prev) => ({
                        ...prev,
                        registration_capacity: event.target.value,
                      }))
                    }
                  />
                  <p className={blockText}>
                    {getLocaleText(locale, 'Quando a lotacao for atingida, novas inscricoes passam para espera.', 'When capacity is reached, new registrations move to the waitlist.')}
                  </p>
                </div>
              </div>

              <h3 className={blockTitle}>{getLocaleText(locale, 'Eventbrite', 'Eventbrite')}</h3>
              <div className={adminFormGridSpaced}>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-venue-id">
                    {getLocaleText(locale, 'ID da sala', 'Venue ID')}
                  </label>
                  <input
                    id="eventbrite-venue-id"
                    className={adminInput}
                    value={eventForm.eventbrite_venue_id}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, eventbrite_venue_id: event.target.value }))
                    }
                  />
                  <p className={blockText}>
                    {getLocaleText(locale, 'Usa uma sala existente ou deixa vazio para criar pela morada abaixo.', 'Use an existing venue or leave it empty to create one from the address below.')}
                  </p>
                </div>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-venue-name">
                    {getLocaleText(locale, 'Sala', 'Venue')}
                  </label>
                  <input
                    id="eventbrite-venue-name"
                    className={adminInput}
                    value={eventForm.eventbrite_venue_name}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, eventbrite_venue_name: event.target.value }))
                    }
                  />
                </div>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-venue-address">
                    {getLocaleText(locale, 'Morada', 'Address')}
                  </label>
                  <input
                    id="eventbrite-venue-address"
                    className={adminInput}
                    value={eventForm.eventbrite_venue_address_1}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, eventbrite_venue_address_1: event.target.value }))
                    }
                  />
                </div>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-venue-postal">
                    {getLocaleText(locale, 'Codigo postal', 'Postal code')}
                  </label>
                  <input
                    id="eventbrite-venue-postal"
                    className={adminInput}
                    value={eventForm.eventbrite_venue_postal_code}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, eventbrite_venue_postal_code: event.target.value }))
                    }
                  />
                </div>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-venue-city">
                    {getLocaleText(locale, 'Cidade Eventbrite', 'Eventbrite city')}
                  </label>
                  <input
                    id="eventbrite-venue-city"
                    className={adminInput}
                    value={eventForm.eventbrite_venue_city}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, eventbrite_venue_city: event.target.value }))
                    }
                  />
                </div>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-venue-country">
                    {getLocaleText(locale, 'Pais', 'Country')}
                  </label>
                  <input
                    id="eventbrite-venue-country"
                    className={adminInput}
                    value={eventForm.eventbrite_venue_country}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, eventbrite_venue_country: event.target.value }))
                    }
                  />
                </div>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-ticket-name">
                    {getLocaleText(locale, 'Ticket', 'Ticket')}
                  </label>
                  <input
                    id="eventbrite-ticket-name"
                    className={adminInput}
                    value={eventForm.eventbrite_ticket_name}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, eventbrite_ticket_name: event.target.value }))
                    }
                  />
                </div>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-ticket-type">
                    {getLocaleText(locale, 'Tipo', 'Type')}
                  </label>
                  <select
                    id="eventbrite-ticket-type"
                    className={adminInput}
                    value={eventForm.eventbrite_ticket_type}
                    onChange={(event) =>
                      setEventForm((prev) => ({
                        ...prev,
                        eventbrite_ticket_type: event.target.value as EventFormState['eventbrite_ticket_type'],
                      }))
                    }
                  >
                    <option value="free">{getLocaleText(locale, 'Gratis', 'Free')}</option>
                    <option value="paid">{getLocaleText(locale, 'Pago', 'Paid')}</option>
                    <option value="donation">{getLocaleText(locale, 'Donativo', 'Donation')}</option>
                  </select>
                </div>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-ticket-quantity">
                    {getLocaleText(locale, 'Quantidade', 'Quantity')}
                  </label>
                  <input
                    id="eventbrite-ticket-quantity"
                    type="number"
                    min="1"
                    className={adminInput}
                    value={eventForm.eventbrite_ticket_quantity}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, eventbrite_ticket_quantity: event.target.value }))
                    }
                  />
                </div>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eventbrite-ticket-price">
                    {getLocaleText(locale, 'Preco', 'Price')}
                  </label>
                  <input
                    id="eventbrite-ticket-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className={adminInput}
                    disabled={eventForm.eventbrite_ticket_type !== 'paid'}
                    value={eventForm.eventbrite_ticket_price}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, eventbrite_ticket_price: event.target.value }))
                    }
                  />
                </div>
                <label className={`${adminLabel} flex items-center gap-2`}>
                  <input
                    type="checkbox"
                    checked={eventForm.sync_eventbrite_on_save}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, sync_eventbrite_on_save: event.target.checked }))
                    }
                  />
                  {getLocaleText(locale, 'Sincronizar ao guardar', 'Sync on save')}
                </label>
                <label className={`${adminLabel} flex items-center gap-2`}>
                  <input
                    type="checkbox"
                    checked={eventForm.publish_eventbrite_on_save}
                    onChange={(event) =>
                      setEventForm((prev) => ({
                        ...prev,
                        publish_eventbrite_on_save: event.target.checked,
                        sync_eventbrite_on_save: event.target.checked || prev.sync_eventbrite_on_save,
                      }))
                    }
                  />
                  {getLocaleText(locale, 'Publicar na Eventbrite ao guardar', 'Publish to Eventbrite on save')}
                </label>
              </div>

              <div className={adminFormGridSpaced}>
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="event-image">
                    {getLocaleText(locale, 'Imagem', 'Image')}
                  </label>
                  <input
                    id="event-image"
                    key={eventImageFileKey}
                    type="file"
                    accept="image/*"
                    className={adminInput}
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      void handleUploadEventImage(file);
                    }}
                  />
                  <p className={blockText}>
                    {isUploadingEventImage
                      ? getLocaleText(locale, 'A carregar imagem...', 'Uploading image...')
                      : eventForm.image
                        ? getLocaleText(locale, 'Imagem carregada com sucesso.', 'Image uploaded successfully.')
                        : getLocaleText(locale, 'Seleciona uma imagem para o evento.', 'Select an image for the event.')}
                  </p>
                  {eventForm.image ? (
                    <img
                      src={resolveInfoCulturaAssetUrl(eventForm.image)}
                      alt={getLocaleText(locale, 'Preview do evento', 'Event preview')}
                      className="mt-3 h-40 w-full rounded-xl object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <div className={adminFieldSpaced}>
                <label className={adminLabel} htmlFor="event-description">
                  {getLocaleText(locale, 'Descricao', 'Description')}
                </label>
                <textarea
                  id="event-description"
                  rows={5}
                  className={adminTextarea}
                  value={eventForm.description}
                  onChange={(event) =>
                    setEventForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              {eventFormError ? <p className={adminError}>{eventFormError}</p> : null}

              <div className={adminActions}>
	                <button type="submit" className={adminBtnPrimary} disabled={isSavingEvent}>
	                  {isSavingEvent
                      ? getLocaleText(locale, 'A guardar...', 'Saving...')
                      : editingEventId
                        ? getLocaleText(locale, 'Atualizar', 'Update')
                        : getLocaleText(locale, 'Guardar', 'Save')}
	                </button>
	                <button
	                  type="submit"
	                  name="eventAction"
	                  value="publish_now"
	                  className={adminBtnSecondary}
	                  disabled={isSavingEvent}
	                >
	                  {getLocaleText(locale, 'Publicar agora', 'Publish now')}
	                </button>
	                <button
	                  type="submit"
	                  name="eventAction"
	                  value="schedule"
	                  className={adminBtnSecondary}
	                  disabled={isSavingEvent}
	                >
	                  {getLocaleText(locale, 'Agendar', 'Schedule')}
	                </button>
	                <button type="button" onClick={resetEventForm} className={adminBtnSecondary}>
	                  {getLocaleText(locale, 'Limpar', 'Clear')}
	                </button>
              </div>
            </form>
          ) : null}

          {showActivityFiltersAndList ? (
            <div id="activity-list" className={adminList}>
              {isLoadingActivities ? <p className={adminInfo}>{getLocaleText(locale, 'A carregar eventos...', 'Loading events...')}</p> : null}
              {!isLoadingActivities && sortedEvents.length === 0 ? (
                <p className={adminInfo}>{getLocaleText(locale, 'Nao existem eventos para o filtro atual.', 'There are no events for the current filter.')}</p>
              ) : null}
              {sortedEvents.map((item) => (
                <article key={item.id} className={adminListItem}>
                  <div className={adminListTop}>
                    <div className={adminListHeader}>
                      <label className={adminListCheckbox}>
                        <input
                          type="checkbox"
                          checked={selectedEventIds.includes(item.id)}
                          onChange={() => toggleSelectedId(setSelectedEventIds, item.id)}
                        />
                        {getLocaleText(locale, 'Selecionar', 'Select')}
                      </label>
                      <h3 className={adminListTitle}>{item.title}</h3>
                      <p className={adminListMeta}>
                        <span className={adminListBadge}>{item.club_name || getLocaleText(locale, 'Sem clube', 'No club')}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        {getWorkflowStatusLabel(item.status)} ·{' '}
                        {formatAdminDateTime(item.start_date)}
                      </p>
                    </div>
                    <div className={adminListTools}>
                      <button
                        type="button"
                        className={adminBtnSecondary}
                        disabled={syncingEventbriteId === item.id}
                        onClick={() => handleSyncEventbrite(item.id, false)}
                      >
                        {syncingEventbriteId === item.id ? getLocaleText(locale, 'A sincronizar...', 'Syncing...') : getLocaleText(locale, 'Eventbrite', 'Eventbrite')}
                      </button>
                      <button
                        type="button"
                        className={adminBtnSecondary}
                        disabled={syncingEventbriteId === item.id}
                        onClick={() => handleSyncEventbrite(item.id, true)}
                      >
                        {getLocaleText(locale, 'Publicar EB', 'Publish EB')}
                      </button>
                      <button
                        type="button"
                        className={adminBtnSecondary}
                        disabled={loadingEventbriteOrdersId === item.id || !item.eventbrite_event_id}
                        onClick={() => handleLoadEventbriteOrders(item.id)}
                      >
                        {loadingEventbriteOrdersId === item.id ? getLocaleText(locale, 'A carregar...', 'Loading...') : getLocaleText(locale, 'Pedidos EB', 'EB Orders')}
                      </button>
                      <button type="button" className={adminBtnEdit} onClick={() => handleEditEvent(item)}>
                        {getLocaleText(locale, 'Editar', 'Edit')}
                      </button>
                      <button
                        type="button"
                        className={item.is_active ? adminBtnSecondary : adminBtnPrimary}
                        disabled={changingEventStatusId === item.id}
                        onClick={() => void handleToggleEventActive(item.id, !item.is_active)}
                      >
                        {changingEventStatusId === item.id
                          ? getLocaleText(locale, 'A atualizar...', 'Updating...')
                          : item.is_active
                            ? getLocaleText(locale, 'Desativar', 'Deactivate')
                            : getLocaleText(locale, 'Ativar', 'Activate')}
                      </button>
                      <button
                        type="button"
                        className={adminBtnDanger}
                        disabled={deletingEventId === item.id}
                        onClick={() => handleDeleteEvent(item.id)}
                      >
                        {deletingEventId === item.id ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar', 'Delete')}
                      </button>
                    </div>
                  </div>
                  <p className={adminListDesc}>{item.description}</p>
                  <p className={adminListMeta}>
                    {getLocaleText(locale, 'Inscricoes', 'Registrations')} {item.enable_registrations ? getLocaleText(locale, 'abertas', 'open') : getLocaleText(locale, 'fechadas', 'closed')} ·
                    {getLocaleText(locale, 'Confirmadas', 'Confirmed')} {item.confirmed_registrations} · {getLocaleText(locale, 'Espera', 'Waitlist')} {item.waitlist_registrations}
                    {item.registration_capacity !== null && item.registration_capacity !== undefined
                      ? ` · ${getLocaleText(locale, 'Lotacao', 'Capacity')} ${item.registration_capacity}`
                      : ''}
                  </p>
                  {item.categories.length > 0 ? (
                    <p className={adminListMeta}>
                      {getLocaleText(locale, 'Categorias', 'Categories')}: {item.categories.map((category) => category.name).join(', ')}
                    </p>
                  ) : null}
                  {item.eventbrite_event_id ? (
                    <p className={adminListMeta}>
                      Eventbrite: {item.eventbrite_status || getLocaleText(locale, 'sincronizado', 'synced')} ·{' '}
                      {item.eventbrite_url ? (
                        <a className="underline" href={item.eventbrite_url} target="_blank" rel="noreferrer">
                          {getLocaleText(locale, 'abrir', 'open')}
                        </a>
                      ) : (
                        item.eventbrite_event_id
                      )}
                    </p>
                  ) : null}
                  {item.eventbrite_venue_id || item.eventbrite_ticket_classes?.length ? (
                    <p className={adminListMeta}>
                      {item.eventbrite_venue_id
                        ? `${getLocaleText(locale, 'Sala EB', 'EB venue')} ${item.eventbrite_venue_id}`
                        : getLocaleText(locale, 'Sala EB por criar', 'EB venue to be created')}
                      {item.eventbrite_ticket_classes?.length
                        ? ` · ${getLocaleText(locale, 'Tickets', 'Tickets')}: ${item.eventbrite_ticket_classes
                            .map((ticket) => `${ticket.name} (${ticket.quantity_total})`)
                            .join(', ')}`
                        : ''}
                    </p>
                  ) : null}
                  {item.eventbrite_last_error ? (
                    <p className={adminError}>Eventbrite: {item.eventbrite_last_error}</p>
                  ) : null}
                  {item.eventbrite_event_id ? (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className={adminField}>
                          <label className={adminLabel} htmlFor={`eventbrite-refund-${item.id}`}>
                            {getLocaleText(locale, 'Reembolsos', 'Refunds')}
                          </label>
                          <select
                            id={`eventbrite-refund-${item.id}`}
                            className={adminInput}
                            value={eventbriteRefundStatus}
                            onChange={(event) => {
                              const nextStatus = event.target.value as EventbriteRefundStatus;
                              setEventbriteRefundStatus(nextStatus);
                              void handleLoadEventbriteOrders(item.id, nextStatus);
                            }}
                          >
                            <option value="">{getLocaleText(locale, 'Todos os pedidos', 'All orders')}</option>
                            <option value="pending">{getLocaleText(locale, 'Reembolso pendente', 'Pending refund')}</option>
                            <option value="completed">{getLocaleText(locale, 'Reembolso concluido', 'Completed refund')}</option>
                            <option value="outside_policy">{getLocaleText(locale, 'Fora da politica', 'Outside policy')}</option>
                            <option value="disputed">{getLocaleText(locale, 'Em disputa', 'Disputed')}</option>
                            <option value="denied">{getLocaleText(locale, 'Negado', 'Denied')}</option>
                          </select>
                        </div>
                        {eventbriteOrdersByEventId[item.id]?.eventbrite_manage_orders_url ? (
                          <a
                            className={adminBtnSecondary}
                            href={eventbriteOrdersByEventId[item.id].eventbrite_manage_orders_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {getLocaleText(locale, 'Gerir na Eventbrite', 'Manage on Eventbrite')}
                          </a>
                        ) : null}
                      </div>
                      {eventbriteOrdersByEventId[item.id] ? (
                        <div className="mt-3 space-y-2">
                          <p className={adminListMeta}>
                            {eventbriteOrdersByEventId[item.id].pagination.object_count ?? eventbriteOrdersByEventId[item.id].orders.length}{' '}
                            {getLocaleText(locale, 'pedido(s) encontrados', 'order(s) found')}
                          </p>
                          {eventbriteOrdersByEventId[item.id].orders.slice(0, 5).map((order) => (
                            <p key={order.id} className={adminListMeta}>
                              {order.name || order.email || order.id} · {order.status || getLocaleText(locale, 'sem estado', 'no status')} ·{' '}
                              {formatAdminDateTime(order.created)}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className={`${adminListMeta} mt-3`}>
                          {getLocaleText(locale, 'Carrega em “Pedidos EB” para ver encomendas e pedidos de reembolso.', 'Click “EB Orders” to view orders and refund requests.')}
                        </p>
                      )}
                    </div>
                  ) : null}
                  {item.editorial_history && item.editorial_history.length > 0 ? (
                    <div className="mt-3 space-y-1">
                      {item.editorial_history.slice(0, 3).map((history, index) => (
                        <p key={`${item.id}-${index}`} className={adminListMeta}>
                          {history.actor_name} ·{' '}
                          {history.from_status
                            ? `${getWorkflowStatusLabel(history.from_status)} -> `
                            : ''}
                          {getWorkflowStatusLabel(history.to_status)} ·{' '}
                          {formatAdminDateTime(history.created_at || '')}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
          {showActivityFiltersAndList && !isLoadingActivities ? (
            <div className={`${adminActions} mt-6`}>
              <p className={adminInfo}>
                {activityTotal} {getLocaleText(locale, 'evento(s)', 'event(s)')} · {getLocaleText(locale, 'pagina', 'page')} {activityPage} {getLocaleText(locale, 'de', 'of')} {activityTotalPages || 1}
              </p>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={activityPage <= 1}
                onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
              >
                {getLocaleText(locale, 'Anterior', 'Previous')}
              </button>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={activityTotalPages === 0 || activityPage >= activityTotalPages}
                onClick={() => setActivityPage((prev) => prev + 1)}
              >
                {getLocaleText(locale, 'Seguinte', 'Next')}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {showEventCategories ? (
        <section id="event-categories" className={adminPanelCard}>
          <h2 className={blockTitle}>{getLocaleText(locale, 'Categorias de eventos', 'Event categories')}</h2>
          <p className={blockText}>
            {getLocaleText(locale, 'Cria categorias para classificar eventos e usar filtros no painel e no publico.', 'Create categories to classify events and use filters in the panel and on the public site.')}
          </p>

          <form onSubmit={handleSaveCategory} className={adminPanelForm}>
            <div className={adminFormGridSpaced}>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="category-name">
                  {getLocaleText(locale, 'Nome', 'Name')}
                </label>
                <input
                  id="category-name"
                  className={adminInput}
                  pattern={adminNamePattern}
                  title={adminNameTitle}
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>

              <div className={adminField}>
                <label className={adminLabel} htmlFor="category-description">
                  {getLocaleText(locale, 'Descricao', 'Description')}
                </label>
                <textarea
                  id="category-description"
                  rows={3}
                  className={adminTextarea}
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {categoryFormError ? <p className={adminError}>{categoryFormError}</p> : null}

            <div className={adminActions}>
              <button type="submit" className={adminBtnPrimary} disabled={isSavingCategory}>
                {isSavingCategory
                  ? getLocaleText(locale, 'A guardar...', 'Saving...')
                  : editingCategoryId
                    ? getLocaleText(locale, 'Atualizar categoria', 'Update category')
                    : getLocaleText(locale, 'Criar categoria', 'Create category')}
              </button>
              <button type="button" onClick={resetCategoryForm} className={adminBtnSecondary}>
                {getLocaleText(locale, 'Limpar', 'Clear')}
              </button>
            </div>
          </form>

          <div className={adminList}>
            {isLoadingCategories ? <p className={adminInfo}>{getLocaleText(locale, 'A carregar categorias...', 'Loading categories...')}</p> : null}
            {!isLoadingCategories && sortedCategories.length === 0 ? (
              <p className={adminInfo}>{getLocaleText(locale, 'Nao existem categorias registadas.', 'There are no categories registered.')}</p>
            ) : null}
            {sortedCategories.map((category) => (
              <article key={category.id} className={adminListItem}>
                <div className={adminListTop}>
                  <div>
                    <h3 className={adminListTitle}>{category.name}</h3>
                    <p className={adminListMeta}>{category.description}</p>
                  </div>
                </div>
                <div className={adminListTools}>
                  <button type="button" className={adminBtnEdit} onClick={() => handleEditCategory(category)}>
                    {getLocaleText(locale, 'Editar', 'Edit')}
                  </button>
                  <button
                    type="button"
                    className={adminBtnDanger}
                    disabled={deletingCategoryId === category.id}
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    {deletingCategoryId === category.id ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar', 'Delete')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ActivitiesPage;
