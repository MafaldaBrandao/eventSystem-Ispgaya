import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Ticket } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  createAdminEvent,
  createAdminEventbriteTicketClass,
  EventPayload,
  EventbriteAttendeesPage,
  EventbriteEventDetail,
  EventbriteOrdersPage,
  fetchAdminEventbriteAttendees,
  fetchAdminEventbriteConnection,
  fetchAdminEventbriteEventDetail,
  fetchAdminEventbriteOrders,
  InfoCulturaClub,
  InfoCulturaEvent,
  InfoCulturaUser,
  syncAdminEventToEventbrite,
  fetchAdminEventSeating,
  saveAdminEventSeating,
  paintAdminEventSeat,
  syncAdminEventSeating,
  EventSeatSyncIssue,
} from '../../../api/infoculturaApi';
import {
  adminActions,
  adminBtnEdit,
  adminBtnPrimary,
  adminBtnSecondary,
  adminError,
  adminField,
  adminFormGridSpaced,
  adminInfo,
  adminInput,
  adminLabel,
  adminList,
  adminListItem,
  adminListMeta,
  adminListTitle,
  adminListTools,
  adminPanelCard,
  adminPanelForm,
  blockText,
  blockTitle,
} from '../../../styles/ui';
import AdminPageHero from '../components/AdminPageHero';
import { getEventbriteSubpage, getEventbriteRoute } from '../utils';
import { formatAdminDateTime, getWorkflowStatusLabel } from '../utils';
import { getLocaleText, useLocale } from '../../../i18n/locale';

type EventbritePageProps = {
  token: string;
  currentUser: InfoCulturaUser;
  canManageUsers: boolean;
  clubs: InfoCulturaClub[];
  events: InfoCulturaEvent[];
  setEvents: (updater: (items: InfoCulturaEvent[]) => InfoCulturaEvent[]) => void;
};

type EventbriteDraftForm = {
  club_id: string;
  title: string;
  description: string;
  event_date: string;
  start_date: string;
  end_date: string;
  city: string;
  location: string;
  capacity: string;
  venue_id: string;
  venue_name: string;
  venue_address: string;
  venue_postal_code: string;
  venue_country: string;
  ticket_name: string;
  ticket_type: 'free' | 'paid' | 'donation';
  ticket_quantity: string;
  ticket_price: string;
  publish: boolean;
};

type LocalVenueConfig = {
  name: string;
  rows: number;
  seatsPerRow: number;
  prefix: string;
  notes: string;
  layout_mode?: 'local_layout' | 'eventbrite_reserved_seating';
};

type SeatStatus = 'available' | 'held' | 'blocked' | 'vip';

type LocalSeat = {
  id: string;
  rowLabel: string;
  seatNumber: number;
  status: SeatStatus;
  attendee_name?: string;
  attendee_email?: string;
};

type LocalTicketPreset = {
  id: string;
  name: string;
  type: 'free' | 'paid' | 'donation';
  price: string;
  quantity: string;
  description: string;
};

const initialForm: EventbriteDraftForm = {
  club_id: '',
  title: '',
  description: '',
  event_date: '',
  start_date: '',
  end_date: '',
  city: 'Vila Nova de Gaia',
  location: '',
  capacity: '',
  venue_id: '',
  venue_name: '',
  venue_address: '',
  venue_postal_code: '',
  venue_country: 'PT',
  ticket_name: 'Entrada geral',
  ticket_type: 'free',
  ticket_quantity: '',
  ticket_price: '',
  publish: false,
};

const defaultVenueConfig: LocalVenueConfig = {
  name: '',
  rows: 5,
  seatsPerRow: 10,
  prefix: 'Fila',
  notes: '',
  layout_mode: 'local_layout',
};

const defaultTicketPreset = (): LocalTicketPreset => ({
  id: crypto.randomUUID(),
  name: 'Bilhete normal',
  type: 'free',
  price: '',
  quantity: '50',
  description: '',
});

function getTicketClassLabel(ticket: Record<string, unknown>): string {
  const name = String(ticket.name || ticket.ticket_class_name || 'Ticket');
  const quantity = ticket.quantity_total || ticket.quantity_sold || '';
  const sold = ticket.quantity_sold;
  return `${name}${quantity ? ` · ${quantity}` : ''}${sold ? ` · vendidos ${sold}` : ''}`;
}

// buildRowLabel has been removed since row generation is handled on the backend.

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function EventbritePage({
  token,
  currentUser,
  canManageUsers,
  clubs,
  events,
  setEvents,
}: EventbritePageProps) {
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const activeSubpage = getEventbriteSubpage(location.pathname) ?? 'overview';
  const [form, setForm] = useState<EventbriteDraftForm>(() => ({
    ...initialForm,
    club_id: canManageUsers ? '' : currentUser.club_id ? String(currentUser.club_id) : '',
  }));
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoadingEventbrite, setIsLoadingEventbrite] = useState(false);
  const [error, setError] = useState('');
  const [connectionLabel, setConnectionLabel] = useState('');
  const [detailsByEventId, setDetailsByEventId] = useState<Record<number, EventbriteEventDetail>>({});
  const [ordersByEventId, setOrdersByEventId] = useState<Record<number, EventbriteOrdersPage>>({});
  const [attendeesByEventId, setAttendeesByEventId] = useState<Record<number, EventbriteAttendeesPage>>({});
  const [ticketName, setTicketName] = useState('Entrada extra');
  const [ticketQuantity, setTicketQuantity] = useState('25');
  const [ticketType, setTicketType] = useState<'free' | 'paid' | 'donation'>('free');
  const [ticketPrice, setTicketPrice] = useState('');
  const [venueConfigByEventId, setVenueConfigByEventId] = useState<Record<number, LocalVenueConfig>>({});
  const [seatMapByEventId, setSeatMapByEventId] = useState<Record<number, LocalSeat[]>>({});
  const [syncIssuesByEventId, setSyncIssuesByEventId] = useState<Record<number, EventSeatSyncIssue[]>>({});
  const [ticketPresetsByEventId, setTicketPresetsByEventId] = useState<Record<number, LocalTicketPreset[]>>(
    () => readStorage('infocultura:eventbrite:ticket-presets', {})
  );
  const [seatPaintMode, setSeatPaintMode] = useState<SeatStatus>('available');
  const [draftVenueConfig, setDraftVenueConfig] = useState<LocalVenueConfig>(defaultVenueConfig);

  const eventbriteEvents = useMemo(
    () => events.filter((event) => event.eventbrite_event_id || event.eventbrite_venue_id),
    [events]
  );
  const selectedEvent =
    eventbriteEvents.find((event) => event.id === selectedEventId) ||
    events.find((event) => event.id === selectedEventId) ||
    null;

  useEffect(() => {
    writeStorage('infocultura:eventbrite:ticket-presets', ticketPresetsByEventId);
  }, [ticketPresetsByEventId]);

  // Load layout and seats from Django API when event changes
  useEffect(() => {
    if (!selectedEventId) return;

    let isMounted = true;
    setIsLoadingEventbrite(true);
    fetchAdminEventSeating(token, selectedEventId)
      .then((res) => {
        if (!isMounted) return;
        if (res.venue_layout) {
          setVenueConfigByEventId((prev) => ({
            ...prev,
            [selectedEventId]: {
              name: res.venue_layout!.notes || '',
              rows: res.venue_layout!.rows,
              seatsPerRow: res.venue_layout!.seats_per_row,
              prefix: res.venue_layout!.row_prefix,
              notes: res.venue_layout!.notes,
              layout_mode: res.venue_layout!.layout_mode,
            }
          }));
        } else {
          setVenueConfigByEventId((prev) => ({
            ...prev,
            [selectedEventId]: {
              ...defaultVenueConfig,
              name: selectedEvent?.eventbrite_venue?.name || selectedEvent?.location || '',
            }
          }));
        }
        if (res.seats) {
          setSeatMapByEventId((prev) => ({
            ...prev,
            [selectedEventId]: res.seats.map((seat) => ({
              id: String(seat.id),
              rowLabel: seat.row_label,
              seatNumber: seat.seat_number || 0,
              status: seat.status === 'assigned' ? 'held' : (seat.status as SeatStatus),
              attendee_name: seat.attendee_name,
              attendee_email: seat.attendee_email,
            }))
          }));
        }
        if (res.sync_issues) {
          setSyncIssuesByEventId((prev) => ({
            ...prev,
            [selectedEventId]: res.sync_issues
          }));
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar lugares do evento:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingEventbrite(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEventId, token]);

  useEffect(() => {
    if (!selectedEventId && eventbriteEvents.length > 0) {
      setSelectedEventId(eventbriteEvents[0].id);
    }
  }, [selectedEventId, eventbriteEvents]);

  useEffect(() => {
    if (!selectedEvent) {
      setDraftVenueConfig(defaultVenueConfig);
      return;
    }

    const storedVenue = venueConfigByEventId[selectedEvent.id];
    setDraftVenueConfig(
      storedVenue || {
        ...defaultVenueConfig,
        name: selectedEvent.eventbrite_venue?.name || selectedEvent.location || '',
      }
    );
  }, [selectedEvent, venueConfigByEventId]);

  async function handleCheckConnection() {
    setIsChecking(true);
    setError('');
    try {
      const connection = await fetchAdminEventbriteConnection(token);
      setConnectionLabel(
        connection.connected
          ? `${getLocaleText(locale, 'Ligado a', 'Connected to')} ${connection.organization_name || connection.organization_id || 'Eventbrite'}`
          : connection.message || getLocaleText(locale, 'Eventbrite nao configurada', 'Eventbrite not configured')
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : getLocaleText(locale, 'Nao foi possivel verificar a Eventbrite.', 'Could not verify Eventbrite.');
      setConnectionLabel(message);
      setError(message);
    } finally {
      setIsChecking(false);
    }
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!form.title || !form.description || !form.event_date || !form.start_date || !form.end_date) {
      setError(getLocaleText(locale, 'Preenche titulo, descricao e datas.', 'Fill in title, description and dates.'));
      return;
    }
    if (canManageUsers && !form.club_id) {
      setError(getLocaleText(locale, 'Seleciona o clube.', 'Select the club.'));
      return;
    }

    setIsSaving(true);
    try {
      const capacity = form.capacity ? Number(form.capacity) : Number(form.ticket_quantity || 100);
      const payload: EventPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        event_date: form.event_date,
        start_date: form.start_date,
        end_date: form.end_date,
        image: '',
        is_external: false,
        enable_registrations: true,
        registration_capacity: capacity,
        status: 'published',
        city: form.city.trim(),
        location: form.location.trim(),
        eventbrite_venue_id: form.venue_id.trim(),
        eventbrite_venue:
          form.venue_name || form.venue_address
            ? {
                name: form.venue_name.trim() || form.location.trim(),
                address_1: form.venue_address.trim() || form.location.trim(),
                city: form.city.trim(),
                postal_code: form.venue_postal_code.trim(),
                country: form.venue_country.trim() || 'PT',
                capacity,
              }
            : null,
        eventbrite_ticket_classes: [
          {
            name: form.ticket_name.trim() || getLocaleText(locale, 'Entrada geral', 'General admission'),
            type: form.ticket_type,
            quantity_total: Number(form.ticket_quantity || capacity || 100),
            price: form.ticket_type === 'paid' && form.ticket_price ? Number(form.ticket_price) : null,
          },
        ],
        ...(form.club_id ? { club_id: Number(form.club_id) } : {}),
      };

      const createdEvent = await createAdminEvent(token, payload);
      const syncedEvent = await syncAdminEventToEventbrite(token, createdEvent.id, form.publish);
      setEvents((items) => [...items, syncedEvent]);
      setSelectedEventId(syncedEvent.id);
      setForm({
        ...initialForm,
        club_id: canManageUsers ? '' : currentUser.club_id ? String(currentUser.club_id) : '',
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : getLocaleText(locale, 'Nao foi possivel criar o evento Eventbrite.', 'Could not create the Eventbrite event.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSyncEvent(id: number, publish = false) {
    setIsLoadingEventbrite(true);
    setError('');
    try {
      const synced = await syncAdminEventToEventbrite(token, id, publish);
      setEvents((items) => items.map((item) => (item.id === synced.id ? synced : item)));
      setSelectedEventId(synced.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : getLocaleText(locale, 'Nao foi possivel sincronizar com a Eventbrite.', 'Could not sync with Eventbrite.'));
    } finally {
      setIsLoadingEventbrite(false);
    }
  }

  async function handleLoadEventbriteData(id: number) {
    setIsLoadingEventbrite(true);
    setError('');
    try {
      const [detail, orders, attendees] = await Promise.all([
        fetchAdminEventbriteEventDetail(token, id),
        fetchAdminEventbriteOrders(token, id),
        fetchAdminEventbriteAttendees(token, id),
      ]);
      setDetailsByEventId((items) => ({ ...items, [id]: detail }));
      setOrdersByEventId((items) => ({ ...items, [id]: orders }));
      setAttendeesByEventId((items) => ({ ...items, [id]: attendees }));
      setSelectedEventId(id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : getLocaleText(locale, 'Nao foi possivel carregar dados da Eventbrite.', 'Could not load Eventbrite data.'));
    } finally {
      setIsLoadingEventbrite(false);
    }
  }

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent) return;
    setIsLoadingEventbrite(true);
    setError('');

    try {
      await createAdminEventbriteTicketClass(token, selectedEvent.id, {
        name: ticketName.trim() || getLocaleText(locale, 'Entrada extra', 'Extra ticket'),
        type: ticketType,
        quantity_total: Number(ticketQuantity || 1),
        price: ticketType === 'paid' && ticketPrice ? Number(ticketPrice) : null,
      });
      await handleLoadEventbriteData(selectedEvent.id);
      setTicketName(getLocaleText(locale, 'Entrada extra', 'Extra ticket'));
      setTicketQuantity('25');
      setTicketType('free');
      setTicketPrice('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : getLocaleText(locale, 'Nao foi possivel criar o ticket.', 'Could not create the ticket.'));
      setIsLoadingEventbrite(false);
    }
  }

  async function handleSaveVenueConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent) return;
    setError('');

    const payload = {
      layout_mode: draftVenueConfig.layout_mode || 'local_layout',
      rows: Math.max(1, Number(draftVenueConfig.rows)),
      seats_per_row: Math.max(1, Number(draftVenueConfig.seatsPerRow)),
      row_prefix: draftVenueConfig.prefix,
      notes: draftVenueConfig.notes,
    };

    try {
      setIsSaving(true);
      const res = await saveAdminEventSeating(token, selectedEvent.id, payload);
      if (res.venue_layout) {
        setVenueConfigByEventId((prev) => ({
          ...prev,
          [selectedEvent.id]: {
            name: res.venue_layout!.notes || '',
            rows: res.venue_layout!.rows,
            seatsPerRow: res.venue_layout!.seats_per_row,
            prefix: res.venue_layout!.row_prefix,
            notes: res.venue_layout!.notes,
            layout_mode: res.venue_layout!.layout_mode,
          }
        }));
      }
      setSeatMapByEventId((prev) => ({
        ...prev,
        [selectedEvent.id]: res.seats.map((seat) => ({
          id: String(seat.id),
          rowLabel: seat.row_label,
          seatNumber: seat.seat_number || 0,
          status: seat.status === 'assigned' ? 'held' : (seat.status as SeatStatus),
          attendee_name: seat.attendee_name,
          attendee_email: seat.attendee_email,
        })),
      }));
      if (res.sync_issues) {
        setSyncIssuesByEventId((prev) => ({
          ...prev,
          [selectedEvent.id]: res.sync_issues
        }));
      }
    } catch (caught: any) {
      setError(caught?.message || 'Erro ao guardar a sala.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateSeatMap() {
    if (!selectedEvent) return;
    setError('');

    const payload = {
      layout_mode: draftVenueConfig.layout_mode || 'local_layout',
      rows: Math.max(1, Number(draftVenueConfig.rows)),
      seats_per_row: Math.max(1, Number(draftVenueConfig.seatsPerRow)),
      row_prefix: draftVenueConfig.prefix,
      notes: draftVenueConfig.notes,
    };

    try {
      setIsSaving(true);
      const res = await saveAdminEventSeating(token, selectedEvent.id, payload);
      if (res.venue_layout) {
        setVenueConfigByEventId((prev) => ({
          ...prev,
          [selectedEvent.id]: {
            name: res.venue_layout!.notes || '',
            rows: res.venue_layout!.rows,
            seatsPerRow: res.venue_layout!.seats_per_row,
            prefix: res.venue_layout!.row_prefix,
            notes: res.venue_layout!.notes,
            layout_mode: res.venue_layout!.layout_mode,
          }
        }));
      }
      setSeatMapByEventId((prev) => ({
        ...prev,
        [selectedEvent.id]: res.seats.map((seat) => ({
          id: String(seat.id),
          rowLabel: seat.row_label,
          seatNumber: seat.seat_number || 0,
          status: seat.status === 'assigned' ? 'held' : (seat.status as SeatStatus),
          attendee_name: seat.attendee_name,
          attendee_email: seat.attendee_email,
        })),
      }));
      if (res.sync_issues) {
        setSyncIssuesByEventId((prev) => ({
          ...prev,
          [selectedEvent.id]: res.sync_issues
        }));
      }
    } catch (caught: any) {
      setError(caught?.message || 'Erro ao gerar o mapa de lugares.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePaintSeat(seatId: string) {
    if (!selectedEvent) return;
    setError('');

    const seatIdNum = Number(seatId);
    if (isNaN(seatIdNum)) return;

    try {
      const res = await paintAdminEventSeat(token, selectedEvent.id, seatIdNum, seatPaintMode);
      setSeatMapByEventId((prev) => ({
        ...prev,
        [selectedEvent.id]: (prev[selectedEvent.id] || []).map((seat) =>
          seat.id === seatId ? { ...seat, status: res.status === 'assigned' ? 'held' : (res.status as SeatStatus) } : seat
        ),
      }));
    } catch (caught: any) {
      setError(caught?.message || 'Erro ao pintar o lugar.');
    }
  }

  async function handleSyncSeating() {
    if (!selectedEvent) return;
    setIsLoadingEventbrite(true);
    setError('');
    try {
      await syncAdminEventSeating(token, selectedEvent.id);
      const res = await fetchAdminEventSeating(token, selectedEvent.id);
      if (res.seats) {
        setSeatMapByEventId((prev) => ({
          ...prev,
          [selectedEvent.id]: res.seats.map((seat) => ({
            id: String(seat.id),
            rowLabel: seat.row_label,
            seatNumber: seat.seat_number || 0,
            status: seat.status === 'assigned' ? 'held' : (seat.status as SeatStatus),
          })),
        }));
      }
      if (res.sync_issues) {
        setSyncIssuesByEventId((prev) => ({
          ...prev,
          [selectedEvent.id]: res.sync_issues
        }));
      }
      await handleLoadEventbriteData(selectedEvent.id);
    } catch (caught: any) {
      setError(caught?.message || 'Erro ao sincronizar lugares.');
    } finally {
      setIsLoadingEventbrite(false);
    }
  }

  function handleSaveTicketPreset() {
    if (!selectedEvent) return;
    const preset = defaultTicketPreset();

    setTicketPresetsByEventId((prev) => ({
      ...prev,
      [selectedEvent.id]: [
        ...(prev[selectedEvent.id] || []),
        preset,
      ],
    }));
  }

  function handleUpdateTicketPreset(
    presetId: string,
    field: keyof Omit<LocalTicketPreset, 'id'>,
    value: string
  ) {
    if (!selectedEvent) return;

    setTicketPresetsByEventId((prev) => ({
      ...prev,
      [selectedEvent.id]: (prev[selectedEvent.id] || []).map((preset) =>
        preset.id === presetId ? { ...preset, [field]: value } : preset
      ),
    }));
  }

  function handleRemoveTicketPreset(presetId: string) {
    if (!selectedEvent) return;

    setTicketPresetsByEventId((prev) => ({
      ...prev,
      [selectedEvent.id]: (prev[selectedEvent.id] || []).filter((preset) => preset.id !== presetId),
    }));
  }

  function handleUsePreset(preset: LocalTicketPreset) {
    setTicketName(preset.name);
    setTicketType(preset.type);
    setTicketQuantity(preset.quantity);
    setTicketPrice(preset.price);
  }

  const selectedDetails = selectedEvent ? detailsByEventId[selectedEvent.id] : null;
  const selectedOrders = selectedEvent ? ordersByEventId[selectedEvent.id] : null;
  const selectedAttendees = selectedEvent ? attendeesByEventId[selectedEvent.id] : null;
  const selectedSeatMap = selectedEvent ? seatMapByEventId[selectedEvent.id] || [] : [];
  const selectedTicketPresets = selectedEvent ? ticketPresetsByEventId[selectedEvent.id] || [] : [];
  const seatStatusCounts = useMemo(() => {
    return selectedSeatMap.reduce(
      (acc, seat) => {
        acc[seat.status] += 1;
        return acc;
      },
      { available: 0, held: 0, blocked: 0, vip: 0 } as Record<SeatStatus, number>
    );
  }, [selectedSeatMap]);

  const subpageLinks = [
    { label: getLocaleText(locale, 'Visão Geral', 'Overview'), id: 'overview' as const },
    { label: getLocaleText(locale, 'Salas', 'Venues'), id: 'venues' as const },
    { label: getLocaleText(locale, 'Lugares', 'Seating'), id: 'seating' as const },
    { label: 'Tickets', id: 'tickets' as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHero
        icon={Ticket}
        tone="emerald"
        title="Eventbrite"
        description={getLocaleText(locale, 'Criação, publicação, salas, tickets e desenho operacional de lugares para os eventos ligados a Eventbrite.', 'Creation, publishing, venues, tickets and operational seating layout for Eventbrite-connected events.')}
        stats={[
          { label: getLocaleText(locale, 'Eventos ligados', 'Connected events'), value: eventbriteEvents.length },
          { label: getLocaleText(locale, 'Sincronizados', 'Synced'), value: events.filter((event) => event.eventbrite_event_id).length },
          { label: getLocaleText(locale, 'Com sala', 'With venue'), value: events.filter((event) => event.eventbrite_venue_id).length },
        ]}
      />

      <section className={adminPanelCard}>
        <div className="flex flex-wrap gap-2">
          {subpageLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(getEventbriteRoute(item.id))}
              className={activeSubpage === item.id ? adminBtnPrimary : adminBtnSecondary}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className={adminPanelCard}>
        <div className={`${adminFormGridSpaced} items-end`}>
          <div className={adminField}>
            <label className={adminLabel} htmlFor="eventbrite-event-selector">{getLocaleText(locale, 'Evento', 'Event')}</label>
            <select
              id="eventbrite-event-selector"
              className={adminInput}
              value={selectedEventId || ''}
              onChange={(event) => setSelectedEventId(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">{getLocaleText(locale, 'Seleciona um evento', 'Select an event')}</option>
              {eventbriteEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
          {selectedEvent ? (
            <div className={adminActions}>
              <button type="button" className={adminBtnSecondary} disabled={isLoadingEventbrite} onClick={() => handleLoadEventbriteData(selectedEvent.id)}>
                {isLoadingEventbrite ? getLocaleText(locale, 'A carregar...', 'Loading...') : getLocaleText(locale, 'Atualizar dados EB', 'Refresh EB data')}
              </button>
              <button type="button" className={adminBtnSecondary} disabled={isLoadingEventbrite} onClick={() => handleSyncEvent(selectedEvent.id, false)}>
                {getLocaleText(locale, 'Sincronizar', 'Sync')}
              </button>
              <button type="button" className={adminBtnSecondary} disabled={isLoadingEventbrite} onClick={() => handleSyncEvent(selectedEvent.id, true)}>
                {getLocaleText(locale, 'Publicar', 'Publish')}
              </button>
            </div>
          ) : null}
        </div>
        {selectedEvent ? (
          <p className={`${adminListMeta} mt-3`}>
            {selectedEvent.club_name || getLocaleText(locale, 'Sem clube', 'No club')} · {getWorkflowStatusLabel(selectedEvent.status)} ·{' '}
            {formatAdminDateTime(selectedEvent.start_date)}
          </p>
        ) : (
          <p className={adminInfo}>{getLocaleText(locale, 'Seleciona um evento para gerir salas, lugares e tickets.', 'Select an event to manage venues, seating and tickets.')}</p>
        )}
        {error ? <p className={`${adminError} mt-3`}>{error}</p> : null}
      </section>

      {activeSubpage === 'overview' ? (
        <>
          <section className={adminPanelCard}>
            <div className={adminActions}>
              <button type="button" className={adminBtnSecondary} disabled={isChecking} onClick={handleCheckConnection}>
                {isChecking ? getLocaleText(locale, 'A verificar...', 'Checking...') : getLocaleText(locale, 'Verificar ligação', 'Check connection')}
              </button>
              {connectionLabel ? <p className={connectionLabel.includes(getLocaleText(locale, 'Ligado', 'Connected')) ? adminInfo : adminError}>{connectionLabel}</p> : null}
            </div>
          </section>

          <form className={adminPanelForm} onSubmit={handleCreateEvent}>
            <h2 className={blockTitle}>{getLocaleText(locale, 'Criar evento Eventbrite', 'Create Eventbrite event')}</h2>
            <div className={adminFormGridSpaced}>
              {canManageUsers ? (
                <div className={adminField}>
                  <label className={adminLabel} htmlFor="eb-club">{getLocaleText(locale, 'Clube', 'Club')}</label>
                  <select id="eb-club" className={adminInput} value={form.club_id} onChange={(event) => setForm((prev) => ({ ...prev, club_id: event.target.value }))}>
                    <option value="">{getLocaleText(locale, 'Seleciona um clube', 'Select a club')}</option>
                    {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
                  </select>
                </div>
              ) : null}
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-title">{getLocaleText(locale, 'Título', 'Title')}</label>
                <input id="eb-title" className={adminInput} value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-start">{getLocaleText(locale, 'Início', 'Start')}</label>
                <input id="eb-start" type="datetime-local" className={adminInput} value={form.start_date} onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-end">{getLocaleText(locale, 'Fim', 'End')}</label>
                <input id="eb-end" type="datetime-local" className={adminInput} value={form.end_date} onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-date">{getLocaleText(locale, 'Data pública', 'Public date')}</label>
                <input id="eb-date" type="date" className={adminInput} value={form.event_date} onChange={(event) => setForm((prev) => ({ ...prev, event_date: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-city">{getLocaleText(locale, 'Cidade', 'City')}</label>
                <input id="eb-city" className={adminInput} value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-location">{getLocaleText(locale, 'Local', 'Location')}</label>
                <input id="eb-location" className={adminInput} value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
              </div>
            </div>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="eb-description">{getLocaleText(locale, 'Descrição', 'Description')}</label>
              <textarea id="eb-description" rows={4} className={adminInput} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            </div>

            <h3 className={blockTitle}>{getLocaleText(locale, 'Sala', 'Venue')}</h3>
            <div className={adminFormGridSpaced}>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-venue-id">{getLocaleText(locale, 'ID da sala Eventbrite', 'Eventbrite venue ID')}</label>
                <input id="eb-venue-id" className={adminInput} value={form.venue_id} onChange={(event) => setForm((prev) => ({ ...prev, venue_id: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-venue-name">{getLocaleText(locale, 'Nome da sala', 'Venue name')}</label>
                <input id="eb-venue-name" className={adminInput} value={form.venue_name} onChange={(event) => setForm((prev) => ({ ...prev, venue_name: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-venue-address">{getLocaleText(locale, 'Morada', 'Address')}</label>
                <input id="eb-venue-address" className={adminInput} value={form.venue_address} onChange={(event) => setForm((prev) => ({ ...prev, venue_address: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-venue-postal">{getLocaleText(locale, 'Código postal', 'Postal code')}</label>
                <input id="eb-venue-postal" className={adminInput} value={form.venue_postal_code} onChange={(event) => setForm((prev) => ({ ...prev, venue_postal_code: event.target.value }))} />
              </div>
            </div>

            <h3 className={blockTitle}>{getLocaleText(locale, 'Ticket base', 'Base ticket')}</h3>
            <div className={adminFormGridSpaced}>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-ticket-name">{getLocaleText(locale, 'Nome', 'Name')}</label>
                <input id="eb-ticket-name" className={adminInput} value={form.ticket_name} onChange={(event) => setForm((prev) => ({ ...prev, ticket_name: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-ticket-type">{getLocaleText(locale, 'Tipo', 'Type')}</label>
                <select id="eb-ticket-type" className={adminInput} value={form.ticket_type} onChange={(event) => setForm((prev) => ({ ...prev, ticket_type: event.target.value as EventbriteDraftForm['ticket_type'] }))}>
                  <option value="free">{getLocaleText(locale, 'Grátis', 'Free')}</option>
                  <option value="paid">{getLocaleText(locale, 'Pago', 'Paid')}</option>
                  <option value="donation">{getLocaleText(locale, 'Donativo', 'Donation')}</option>
                </select>
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-ticket-quantity">{getLocaleText(locale, 'Quantidade', 'Quantity')}</label>
                <input id="eb-ticket-quantity" type="number" min="1" className={adminInput} value={form.ticket_quantity} onChange={(event) => setForm((prev) => ({ ...prev, ticket_quantity: event.target.value }))} />
              </div>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="eb-ticket-price">{getLocaleText(locale, 'Preço', 'Price')}</label>
                <input id="eb-ticket-price" type="number" min="0" step="0.01" disabled={form.ticket_type !== 'paid'} className={adminInput} value={form.ticket_price} onChange={(event) => setForm((prev) => ({ ...prev, ticket_price: event.target.value }))} />
              </div>
            </div>
            <label className={`${adminLabel} flex items-center gap-2`}>
              <input type="checkbox" checked={form.publish} onChange={(event) => setForm((prev) => ({ ...prev, publish: event.target.checked }))} />
              {getLocaleText(locale, 'Publicar na Eventbrite depois de criar', 'Publish on Eventbrite after creation')}
            </label>
            <div className={adminActions}>
              <button type="submit" className={adminBtnPrimary} disabled={isSaving}>{isSaving ? getLocaleText(locale, 'A criar...', 'Creating...') : getLocaleText(locale, 'Criar e sincronizar', 'Create and sync')}</button>
            </div>
          </form>

          <section className={adminPanelCard}>
            <h2 className={blockTitle}>{getLocaleText(locale, 'Eventos Eventbrite', 'Eventbrite events')}</h2>
            <div className={adminList}>
              {eventbriteEvents.length === 0 ? <p className={adminInfo}>{getLocaleText(locale, 'Ainda nao existem eventos ligados a Eventbrite.', 'There are no Eventbrite-connected events yet.')}</p> : null}
              {eventbriteEvents.map((event) => (
                <article key={event.id} className={adminListItem}>
                  <h3 className={adminListTitle}>{event.title}</h3>
                  <p className={adminListMeta}>
                    {event.club_name || getLocaleText(locale, 'Sem clube', 'No club')} · {getWorkflowStatusLabel(event.status)} · {formatAdminDateTime(event.start_date)}
                  </p>
                  <p className={adminListMeta}>
                    Eventbrite {event.eventbrite_status || getLocaleText(locale, 'por sincronizar', 'to sync')} · {getLocaleText(locale, 'Sala', 'Venue')} {event.eventbrite_venue_id || getLocaleText(locale, 'por criar', 'to create')}
                    {event.eventbrite_url ? <> · <a className="underline" href={event.eventbrite_url} target="_blank" rel="noreferrer">{getLocaleText(locale, 'abrir', 'open')}</a></> : null}
                  </p>
                  <div className={adminListTools}>
                    <button type="button" className={adminBtnSecondary} disabled={isLoadingEventbrite} onClick={() => handleSyncEvent(event.id, false)}>{getLocaleText(locale, 'Sincronizar', 'Sync')}</button>
                    <button type="button" className={adminBtnSecondary} disabled={isLoadingEventbrite} onClick={() => handleSyncEvent(event.id, true)}>{getLocaleText(locale, 'Publicar', 'Publish')}</button>
                    <button type="button" className={adminBtnEdit} disabled={isLoadingEventbrite || !event.eventbrite_event_id} onClick={() => handleLoadEventbriteData(event.id)}>{getLocaleText(locale, 'Gerir', 'Manage')}</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {activeSubpage === 'venues' ? (
        <section className={adminPanelCard}>
          <h2 className={blockTitle}>{getLocaleText(locale, 'Salas do evento', 'Event venues')}</h2>
          <p className={blockText}>
            {getLocaleText(locale, 'Define a estrutura interna da sala no InfoCultura para preparar seating, lotacao e futuras inscricoes por lugar.', 'Define the internal venue structure in InfoCultura to prepare seating, capacity and future seat-based registrations.')}
          </p>
          {!selectedEvent ? <p className={`${adminInfo} mt-4`}>{getLocaleText(locale, 'Seleciona um evento para configurar a sala.', 'Select an event to configure the venue.')}</p> : null}
          {selectedEvent ? (
            <form className={`${adminPanelForm} mt-4`} onSubmit={handleSaveVenueConfig}>
              <div className={adminFormGridSpaced}>
                <div className={adminField}>
                  <label className={adminLabel}>Modo de Layout</label>
                  <select
                    className={adminInput}
                    value={draftVenueConfig.layout_mode || 'local_layout'}
                    onChange={(event) => setDraftVenueConfig((prev) => ({ ...prev, layout_mode: event.target.value as any }))}
                  >
                    <option value="local_layout">Layout Local</option>
                    <option value="eventbrite_reserved_seating">Reserved Seating Eventbrite</option>
                  </select>
                </div>
                <div className={adminField}>
                  <label className={adminLabel}>Modo de Layout</label>
                  <select
                    className={adminInput}
                    value={draftVenueConfig.layout_mode || 'local_layout'}
                    onChange={(event) => setDraftVenueConfig((prev) => ({ ...prev, layout_mode: event.target.value as any }))}
                  >
                    <option value="local_layout">Layout Local</option>
                    <option value="eventbrite_reserved_seating">Reserved Seating Eventbrite</option>
                  </select>
                </div>
                <div className={adminField}>
                  <label className={adminLabel}>{getLocaleText(locale, 'Nome da sala', 'Venue name')}</label>
                  <input className={adminInput} value={draftVenueConfig.name} onChange={(event) => setDraftVenueConfig((prev) => ({ ...prev, name: event.target.value }))} />
                </div>
                {draftVenueConfig.layout_mode !== 'eventbrite_reserved_seating' ? (
                  <>
                    <div className={adminField}>
                      <label className={adminLabel}>{getLocaleText(locale, 'Número de filas', 'Number of rows')}</label>
                      <input className={adminInput} type="number" min="1" value={draftVenueConfig.rows} onChange={(event) => setDraftVenueConfig((prev) => ({ ...prev, rows: Number(event.target.value) }))} />
                    </div>
                    <div className={adminField}>
                      <label className={adminLabel}>{getLocaleText(locale, 'Lugares por fila', 'Seats per row')}</label>
                      <input className={adminInput} type="number" min="1" value={draftVenueConfig.seatsPerRow} onChange={(event) => setDraftVenueConfig((prev) => ({ ...prev, seatsPerRow: Number(event.target.value) }))} />
                    </div>
                    <div className={adminField}>
                      <label className={adminLabel}>{getLocaleText(locale, 'Prefixo das filas', 'Row prefix')}</label>
                      <input className={adminInput} value={draftVenueConfig.prefix} onChange={(event) => setDraftVenueConfig((prev) => ({ ...prev, prefix: event.target.value }))} />
                    </div>
                  </>
                ) : null}
              </div>
              <div className={adminField}>
                <label className={adminLabel}>{getLocaleText(locale, 'Notas operacionais', 'Operational notes')}</label>
                <textarea className={adminInput} rows={4} value={draftVenueConfig.notes} onChange={(event) => setDraftVenueConfig((prev) => ({ ...prev, notes: event.target.value }))} />
              </div>
              <div className={adminActions}>
                <button type="submit" className={adminBtnPrimary} disabled={isSaving}>{getLocaleText(locale, 'Guardar sala', 'Save venue')}</button>
                {draftVenueConfig.layout_mode !== 'eventbrite_reserved_seating' ? (
                  <button type="button" className={adminBtnSecondary} disabled={isSaving} onClick={handleGenerateSeatMap}>{getLocaleText(locale, 'Gerar mapa de lugares', 'Generate seat map')}</button>
                ) : null}
              </div>
              {draftVenueConfig.layout_mode !== 'eventbrite_reserved_seating' ? (
                <p className={`${adminListMeta} mt-3`}>
                  {getLocaleText(locale, 'Configuração atual:', 'Current configuration:')} {draftVenueConfig.rows} {getLocaleText(locale, 'filas', 'rows')} · {draftVenueConfig.seatsPerRow} {getLocaleText(locale, 'lugares por fila', 'seats per row')} · {getLocaleText(locale, 'capacidade teórica', 'theoretical capacity')} {draftVenueConfig.rows * draftVenueConfig.seatsPerRow}
                </p>
              ) : (
                <p className={`${adminListMeta} mt-3`}>
                  Sala sincronizada a partir do Reserved Seating da Eventbrite.
                </p>
              )}
            </form>
          ) : null}
        </section>
      ) : null}

      {activeSubpage === 'seating' ? (
        <section className={adminPanelCard}>
          <h2 className={blockTitle}>{getLocaleText(locale, 'Mapa de lugares', 'Seat map')}</h2>
          <p className={blockText}>
            {getLocaleText(locale, 'Este mapa operacional é gerido no InfoCultura. A Eventbrite publica tickets, mas o desenho detalhado dos assentos fica controlado aqui.', 'This operational map is managed in InfoCultura. Eventbrite publishes tickets, but the detailed seat layout is controlled here.')}
          </p>
          {!selectedEvent ? <p className={`${adminInfo} mt-4`}>{getLocaleText(locale, 'Seleciona um evento para editar os lugares.', 'Select an event to edit seats.')}</p> : null}
          {selectedEvent ? (
            <>
              <div className={`${adminActions} mt-4 flex items-center justify-between flex-wrap gap-3`}>
                <div className="flex flex-wrap gap-2">
                  {(['available', 'held', 'blocked', 'vip'] as SeatStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={seatPaintMode === status ? adminBtnPrimary : adminBtnSecondary}
                      onClick={() => setSeatPaintMode(status)}
                    >
                      {status === 'available'
                        ? getLocaleText(locale, 'Disponível', 'Available')
                        : status === 'held'
                          ? getLocaleText(locale, 'Reservado', 'Held')
                          : status === 'blocked'
                            ? getLocaleText(locale, 'Bloqueado', 'Blocked')
                            : 'VIP'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={adminBtnPrimary}
                  disabled={isLoadingEventbrite}
                  onClick={handleSyncSeating}
                >
                  Sincronizar Lugares
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">{getLocaleText(locale, 'Disponíveis', 'Available')}: {seatStatusCounts.available}</div>
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">{getLocaleText(locale, 'Reservados', 'Held')}: {seatStatusCounts.held}</div>
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">{getLocaleText(locale, 'Bloqueados', 'Blocked')}: {seatStatusCounts.blocked}</div>
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">VIP: {seatStatusCounts.vip}</div>
              </div>

              {syncIssuesByEventId[selectedEvent.id]?.length > 0 ? (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <h3 className="text-sm font-semibold text-rose-900">Anomalias de Sincronização</h3>
                  <div className="mt-2 space-y-2">
                    {syncIssuesByEventId[selectedEvent.id].map((issue) => (
                      <p key={issue.id} className="text-xs text-rose-800">
                        {issue.attendee_name || issue.attendee_email || 'Participante'} ({issue.ticket_class_name || 'Ticket'}) ·{' '}
                        <strong>
                          {issue.issue_type === 'unassigned'
                            ? 'Sem assento atribuído (Sala Cheia / Sem Cadeira)'
                            : issue.issue_type === 'seat_not_found'
                              ? 'Assento Eventbrite não encontrado na sala local'
                              : issue.issue_type === 'missing_attendee_id'
                                ? 'Participante sem ID da Eventbrite'
                                : 'Duplicado'}
                        </strong>
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedSeatMap.length === 0 ? (
                <p className={`${adminInfo} mt-4`}>{getLocaleText(locale, 'Ainda não existe mapa para este evento. Primeiro configura a sala.', 'There is no seat map for this event yet. Configure the venue first.')}</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {Array.from(new Set(selectedSeatMap.map((seat) => seat.rowLabel))).map((rowLabel) => (
                    <div key={rowLabel} className="flex flex-wrap items-center gap-2">
                      <div className="w-24 text-sm font-semibold text-slate-700">{rowLabel}</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSeatMap
                          .filter((seat) => seat.rowLabel === rowLabel)
                          .map((seat) => {
                            const titleText = seat.status === 'held' ? `${seat.attendee_name || 'Reservado'} (${seat.attendee_email || ''})` : `Lugar ${seat.seatNumber}`;
                            return (
                              <button
                                key={seat.id}
                                type="button"
                                title={titleText}
                                onClick={() => handlePaintSeat(seat.id)}
                                className={`h-10 w-10 rounded-md border text-xs font-semibold ${
                                  seat.status === 'available'
                                    ? 'border-slate-200 bg-white text-slate-700'
                                    : seat.status === 'held'
                                      ? 'border-amber-200 bg-amber-100 text-amber-900'
                                      : seat.status === 'blocked'
                                        ? 'border-rose-200 bg-rose-100 text-rose-900'
                                        : 'border-emerald-200 bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {seat.seatNumber || seat.id}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedAttendees ? (
                <div className="mt-6">
                  <h3 className={blockTitle}>{getLocaleText(locale, 'Participantes Eventbrite', 'Eventbrite attendees')}</h3>
                  <p className={adminListMeta}>{selectedAttendees.pagination.object_count ?? selectedAttendees.attendees.length} {getLocaleText(locale, 'participante(s)', 'attendee(s)')}</p>
                  {selectedAttendees.attendees.slice(0, 8).map((attendee) => (
                    <p key={attendee.id} className={adminListMeta}>
                      {attendee.name || attendee.email || attendee.id} · {attendee.ticket_class_name || 'ticket'} · {attendee.checked_in ? getLocaleText(locale, 'check-in feito', 'checked in') : attendee.status || getLocaleText(locale, 'reservado', 'held')}
                    </p>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {activeSubpage === 'tickets' ? (
        <section className={adminPanelCard}>
          <h2 className={blockTitle}>{getLocaleText(locale, 'Tickets e tipologias', 'Tickets and types')}</h2>
          <p className={blockText}>
            {getLocaleText(locale, 'Gere o catálogo de tipos de ticket no InfoCultura e cria tickets adicionais na Eventbrite para o evento selecionado.', 'Manage the ticket type catalog in InfoCultura and create additional Eventbrite tickets for the selected event.')}
          </p>
          {!selectedEvent ? <p className={`${adminInfo} mt-4`}>{getLocaleText(locale, 'Seleciona um evento para gerir tickets.', 'Select an event to manage tickets.')}</p> : null}
          {selectedEvent ? (
            <>
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className={blockTitle}>{getLocaleText(locale, 'Tipos internos de ticket', 'Internal ticket types')}</h3>
                  <button type="button" className={adminBtnSecondary} onClick={handleSaveTicketPreset}>
                    {getLocaleText(locale, 'Adicionar tipo', 'Add type')}
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedTicketPresets.length === 0 ? (
                    <p className={adminInfo}>{getLocaleText(locale, 'Ainda não existem tipos internos de ticket para este evento.', 'There are no internal ticket types for this event yet.')}</p>
                  ) : (
                    selectedTicketPresets.map((preset) => (
                      <div key={preset.id} className="rounded-xl border border-slate-200 p-4">
                        <div className={adminFormGridSpaced}>
                          <input className={adminInput} value={preset.name} onChange={(event) => handleUpdateTicketPreset(preset.id, 'name', event.target.value)} />
                          <select className={adminInput} value={preset.type} onChange={(event) => handleUpdateTicketPreset(preset.id, 'type', event.target.value)}>
                            <option value="free">{getLocaleText(locale, 'Grátis', 'Free')}</option>
                            <option value="paid">{getLocaleText(locale, 'Pago', 'Paid')}</option>
                            <option value="donation">{getLocaleText(locale, 'Donativo', 'Donation')}</option>
                          </select>
                          <input className={adminInput} type="number" min="0" step="0.01" value={preset.price} onChange={(event) => handleUpdateTicketPreset(preset.id, 'price', event.target.value)} />
                          <input className={adminInput} type="number" min="1" value={preset.quantity} onChange={(event) => handleUpdateTicketPreset(preset.id, 'quantity', event.target.value)} />
                        </div>
                        <textarea className={`${adminInput} mt-3`} rows={2} value={preset.description} onChange={(event) => handleUpdateTicketPreset(preset.id, 'description', event.target.value)} />
                        <div className={`${adminListTools} mt-3`}>
                          <button type="button" className={adminBtnSecondary} onClick={() => handleUsePreset(preset)}>{getLocaleText(locale, 'Usar no criador', 'Use in creator')}</button>
                          <button type="button" className={adminBtnEdit} onClick={() => handleRemoveTicketPreset(preset.id)}>{getLocaleText(locale, 'Remover', 'Remove')}</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <form className={`${adminPanelForm} mt-6`} onSubmit={handleCreateTicket}>
                <h3 className={blockTitle}>{getLocaleText(locale, 'Criar ticket adicional na Eventbrite', 'Create additional Eventbrite ticket')}</h3>
                <div className={adminFormGridSpaced}>
                  <input className={adminInput} value={ticketName} onChange={(event) => setTicketName(event.target.value)} aria-label="Nome do ticket" />
                  <select className={adminInput} value={ticketType} onChange={(event) => setTicketType(event.target.value as typeof ticketType)}>
                    <option value="free">{getLocaleText(locale, 'Grátis', 'Free')}</option>
                    <option value="paid">{getLocaleText(locale, 'Pago', 'Paid')}</option>
                    <option value="donation">{getLocaleText(locale, 'Donativo', 'Donation')}</option>
                  </select>
                  <input className={adminInput} type="number" min="1" value={ticketQuantity} onChange={(event) => setTicketQuantity(event.target.value)} aria-label="Quantidade" />
                  <input className={adminInput} type="number" min="0" step="0.01" disabled={ticketType !== 'paid'} value={ticketPrice} onChange={(event) => setTicketPrice(event.target.value)} aria-label="Preco" />
                </div>
                <button type="submit" className={adminBtnPrimary} disabled={isLoadingEventbrite || !selectedEvent.eventbrite_event_id}>{getLocaleText(locale, 'Criar ticket', 'Create ticket')}</button>
              </form>

              <div className="mt-6">
                <h3 className={blockTitle}>{getLocaleText(locale, 'Tickets atuais', 'Current tickets')}</h3>
                {selectedDetails ? (
                  <div className="space-y-2">
                    <p className={adminListMeta}>{getLocaleText(locale, 'Estado', 'Status')}: {selectedDetails.status || selectedEvent.eventbrite_status || getLocaleText(locale, 'sem estado', 'no status')} · {getLocaleText(locale, 'Capacidade', 'Capacity')}: {selectedDetails.capacity ?? selectedEvent.registration_capacity ?? 'n/d'}</p>
                    <p className={adminListMeta}>Tickets: {selectedDetails.ticket_classes.length || 0}</p>
                    {selectedDetails.ticket_classes.map((ticket, index) => (
                      <p key={String(ticket.id || index)} className={adminListMeta}>{getTicketClassLabel(ticket)}</p>
                    ))}
                  </div>
                ) : (
                  <p className={adminInfo}>{getLocaleText(locale, 'Carrega em “Atualizar dados EB” para ver os tickets da Eventbrite.', 'Click “Refresh EB data” to see Eventbrite tickets.')}</p>
                )}
              </div>

              {selectedOrders ? (
                <div className="mt-6">
                  <h3 className={blockTitle}>{getLocaleText(locale, 'Encomendas', 'Orders')}</h3>
                  <p className={adminListMeta}>{selectedOrders.pagination.object_count ?? selectedOrders.orders.length} {getLocaleText(locale, 'pedido(s)', 'order(s)')}</p>
                  {selectedOrders.orders.slice(0, 8).map((order) => (
                    <p key={order.id} className={adminListMeta}>{order.name || order.email || order.id} · {order.status || getLocaleText(locale, 'sem estado', 'no status')} · {formatAdminDateTime(order.created)}</p>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export default EventbritePage;
