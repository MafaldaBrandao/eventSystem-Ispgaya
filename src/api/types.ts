import { CulturalArea, CulturalItem } from '../data/culturalContent.js';

export type { CulturalArea, CulturalItem };

export type InfoCulturaUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  club_id?: number | null;
  club_name?: string | null;
  created_at?: string | null;
};

export type InfoCulturaRole = {
  id: number;
  name: string;
  description?: string | null;
};

export type InfoCulturaClub = {
  id: number;
  name: string;
  description: string;
  mission: string;
  image?: string;
  is_active: boolean;
  enable_registrations?: boolean | null;
  created_at: string;
};

export type InfoCulturaCategory = {
  id: number;
  name: string;
  description: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type InfoCulturaPhoto = {
  id: string;
  section: string;
  title: string;
  caption: string;
  image: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InfoCulturaNewsStatus = {
  id: number;
  name: string;
  description: string;
};

export type InfoCulturaEditorialHistory = {
  content_type: string;
  object_id: number;
  from_status?: string | null;
  to_status: string;
  actor_user_id?: number | null;
  actor_name: string;
  created_at?: string | null;
};

export type InfoCulturaNews = {
  id: number;
  title: string;
  summary: string;
  image: string;
  content: string;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  news_status_id: number;
  news_status_name: string;
  club_id: number;
  club_name: string;
  editorial_history?: InfoCulturaEditorialHistory[];
};

export type InfoCulturaNewsletter = {
  id: number;
  title: string;
  subject: string;
  content: string;
  image?: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
  user_id: number | null;
  user_name: string | null;
};

export type InfoCulturaNewsletterSubscriber = {
  id: number;
  email: string;
  is_active: boolean;
  subscribed_at: string;
};

export type InfoCulturaBook = {
  id: number;
  title: string;
  author: string;
  publisher: string;
  publication_year: number;
  cover_image: string;
  summary: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string | null;
  club_id: number | null;
  club_name: string;
};

export type InfoCulturaSession = {
  id: number;
  name: string;
  title: string;
  description: string;
  is_active: boolean;
  session_date: string;
  start_date: string;
  end_date: string;
  location: string;
  enable_registrations: boolean;
  registration_capacity?: number | null;
  created_at: string | null;
  updated_at: string | null;
  club_id: number;
  club_name: string;
  confirmed_registrations: number;
  waitlist_registrations: number;
  remaining_slots?: number | null;
  registration_state: 'open' | 'waitlist' | 'closed';
  google_calendar_url: string;
  outlook_calendar_url: string;
};

export type InfoCulturaEvent = {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  event_date: string;
  start_date: string;
  end_date: string;
  image: string;
  is_external: boolean;
  enable_registrations: boolean;
  registration_capacity?: number | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  city: string;
  location: string;
  eventbrite_event_id?: string;
  eventbrite_url?: string;
  eventbrite_status?: string;
  eventbrite_last_synced_at?: string | null;
  eventbrite_last_error?: string;
  eventbrite_venue_id?: string;
  eventbrite_venue?: EventbriteVenuePayload | null;
  eventbrite_ticket_classes?: EventbriteTicketClassPayload[] | null;
  user_id: number;
  club_id?: number | null;
  club_name?: string | null;
  owner_name?: string | null;
  categories: InfoCulturaCategory[];
  category_ids: number[];
  confirmed_registrations: number;
  waitlist_registrations: number;
  remaining_slots?: number | null;
  registration_state: 'open' | 'waitlist' | 'closed';
  google_calendar_url: string;
  outlook_calendar_url: string;
  editorial_history?: InfoCulturaEditorialHistory[];
};

export type EventbriteVenuePayload = {
  name: string;
  address_1: string;
  address_2?: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
  capacity?: number | null;
  age_restriction?: string;
};

export type EventbriteTicketClassPayload = {
  name: string;
  type: 'free' | 'paid' | 'donation';
  quantity_total: number;
  price?: number | null;
  minimum_quantity?: number | null;
  maximum_quantity?: number | null;
};

export type EventbriteConnectionStatus = {
  connected: boolean;
  organization_id?: string;
  organization_name?: string;
  message?: string;
};

export type EventbriteOrder = {
  id: string;
  name: string;
  email: string;
  status: string;
  created: string;
  changed: string;
  costs?: Record<string, unknown>;
  refund_request?: Record<string, unknown>;
};

export type EventbriteAttendee = {
  id: string;
  name: string;
  email: string;
  status: string;
  checked_in: boolean;
  ticket_class_name: string;
  ticket_class_id: string;
  order_id: string;
  created: string;
};

export type EventbriteAttendeesPage = {
  attendees: EventbriteAttendee[];
  pagination: {
    object_count?: number;
    page_number?: number;
    page_size?: number;
    page_count?: number;
    has_more_items?: boolean;
    continuation?: string;
  };
  eventbrite_manage_attendees_url: string;
};

export type EventbriteEventDetail = {
  id: string;
  name: string;
  status: string;
  url: string;
  capacity?: number | null;
  ticket_classes: Array<Record<string, unknown>>;
  venue: Record<string, unknown>;
};

export type EventbriteOrdersPage = {
  orders: EventbriteOrder[];
  pagination: {
    object_count?: number;
    page_number?: number;
    page_size?: number;
    page_count?: number;
    has_more_items?: boolean;
    continuation?: string;
  };
  eventbrite_manage_orders_url: string;
};

export type EventbriteRefundStatus =
  | ''
  | 'pending'
  | 'completed'
  | 'outside_policy'
  | 'disputed'
  | 'denied';

export type PhotoPayload = {
  section: string;
  title: string;
  caption?: string;
  image: string;
  alt_text?: string;
  display_order?: number;
  is_active: boolean;
};

export type InfoCulturaRegistrationStatus = {
  id: number;
  name: string;
  description: string;
};

export type InfoCulturaRegistration = {
  id: number;
  registration_id?: number;
  club_id: number;
  club_name: string;
  registration_type?: 'club' | 'event' | 'session' | string;
  target_title?: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  status: string;
  created_at: string | null;
};

export type InfoCulturaDashboardRecord = {
  id: number;
  title: string;
  club_name?: string | null;
  date?: string | null;
  status?: string | null;
};

export type InfoCulturaDashboardStats = {
  scope_label: string;
  users_total: number;
  active_users: number;
  clubs_total: number;
  active_clubs: number;
  clubs_with_registrations_open: number;
  news_total: number;
  news_draft: number;
  news_review: number;
  news_published: number;
  books_total: number;
  featured_books: number;
  sessions_total: number;
  upcoming_sessions: number;
  events_total: number;
  events_draft: number;
  events_review: number;
  events_published: number;
  registrations_total: number;
  registrations_pending: number;
  registrations_approved: number;
  registrations_rejected: number;
  latest_news?: InfoCulturaDashboardRecord | null;
  next_session?: InfoCulturaDashboardRecord | null;
  next_event?: InfoCulturaDashboardRecord | null;
};

export type InfoCulturaMetricSeriesPoint = {
  label: string;
  value: number;
  period_start: string | null;
  period_end: string | null;
};

export type InfoCulturaMetricTopPage = {
  title: string;
  page_path: string;
  section: string;
  views: number;
  unique_visitors: number;
  last_viewed_at: string | null;
};

export type InfoCulturaMetricSectionBreakdown = {
  section: string;
  views: number;
};

export type InfoCulturaMetricsOverview = {
  period: string;
  total_views: number;
  unique_pages: number;
  unique_visitors: number;
  clubs_created: number;
  news_created: number;
  top_pages: InfoCulturaMetricTopPage[];
  section_breakdown: InfoCulturaMetricSectionBreakdown[];
  series: InfoCulturaMetricSeriesPoint[];
};

export type InfoCulturaAdminNotification = {
  id: string;
  kind: string;
  level: 'warning' | 'info' | 'success' | string;
  title: string;
  message: string;
  href: string;
  created_at?: string | null;
};

export type InfoCulturaActivityLog = {
  source: 'audit' | 'editorial' | string;
  action: string;
  content_type: string;
  object_id: number | null;
  summary: string;
  actor_user_id: number | null;
  actor_name: string;
  club_id: number | null;
  metadata_json: string | null;
  created_at: string | null;
};

export type UniversitySearchResult = {
  name: string;
  country: string;
  domains: string[];
  web_pages: string[];
};

export type InfoCulturaRegistrationPage = {
  items: InfoCulturaRegistration[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type InfoCulturaAdminCollectionPage<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type UserPayload = {
  name: string;
  email: string;
  role: string;
  club_id?: number | null;
  password?: string;
  generate_password?: boolean;
  is_active?: boolean;
};

export type ClubPayload = {
  name: string;
  description: string;
  mission?: string;
  image?: string;
  is_active?: boolean;
  enable_registrations?: boolean;
};

export type NewsPayload = {
  title: string;
  summary: string;
  image: string;
  content: string;
  news_status: string;
  published_at?: string | null;
  club_id?: number;
};

export type NewsletterPayload = {
  title: string;
  subject: string;
  content: string;
  image?: string;
  status: string;
  sent_at?: string | null;
};

export type NewsletterSubscriberPayload = {
  email: string;
  is_active: boolean;
};

export type MetricViewPayload = {
  kind?: string;
  section: string;
  content_type?: string;
  object_id?: number | null;
  title: string;
  page_path: string;
  locale?: string;
  referrer?: string;
  user_agent?: string;
  visitor_key?: string;
  club_id?: number | null;
};

export type BookPayload = {
  title: string;
  author: string;
  publisher: string;
  publication_year: number;
  cover_image: string;
  summary: string;
  is_featured: boolean;
  created_at?: string | null;
  club_id?: number;
};

export type SessionPayload = {
  name: string;
  title: string;
  description: string;
  session_date: string;
  start_date: string;
  end_date: string;
  location: string;
  created_at?: string | null;
  enable_registrations?: boolean;
  registration_capacity?: number | null;
  club_id?: number;
};

export type EventPayload = {
  title: string;
  description: string;
  event_date: string;
  start_date: string;
  end_date: string;
  created_at?: string | null;
  image: string;
  is_external: boolean;
  enable_registrations?: boolean;
  registration_capacity?: number | null;
  status: string;
  city: string;
  location: string;
  eventbrite_venue_id?: string;
  eventbrite_venue?: EventbriteVenuePayload | null;
  eventbrite_ticket_classes?: EventbriteTicketClassPayload[] | null;
  club_id?: number;
  category_ids?: number[];
};

export type CategoryPayload = {
  name: string;
  description: string;
};

export type ClubRegistrationPayload = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
};

export type ContentPayload = {
  area: CulturalArea;
  title: string;
  description: string;
  date: string;
  status: 'rascunho' | 'publicado';
};
