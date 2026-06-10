import { CulturalArea } from '../../data/culturalContent.js';

export type FormState = {
  area: CulturalArea;
  title: string;
  description: string;
  date: string;
  status: 'rascunho' | 'publicado';
};

export type UserFormState = {
  name: string;
  email: string;
  role: string;
  club_id: string;
  password: string;
  generate_password: boolean;
};

export type ClubFormState = {
  name: string;
  description: string;
  mission: string;
  image: string;
  is_active: boolean;
  enable_registrations: boolean;
};

export type NewsFormState = {
  title: string;
  summary: string;
  image: string;
  content: string;
  news_status: string;
  published_at: string;
  club_id: string;
};

export type BookFormState = {
  title: string;
  author: string;
  publisher: string;
  publication_year: string;
  cover_image: string;
  summary: string;
  is_featured: boolean;
  available_at: string;
  club_id: string;
};

export type SessionFormState = {
  name: string;
  title: string;
  description: string;
  session_date: string;
  start_date: string;
  end_date: string;
  available_at: string;
  location: string;
  enable_registrations: boolean;
  registration_capacity: string;
  club_id: string;
};

export type EventFormState = {
  title: string;
  description: string;
  event_date: string;
  start_date: string;
  end_date: string;
  publish_at: string;
  image: string;
  is_external: boolean;
  enable_registrations: boolean;
  registration_capacity: string;
  status: string;
  country_code: string;
  district: string;
  municipality: string;
  city: string;
  location: string;
  eventbrite_venue_id: string;
  eventbrite_venue_name: string;
  eventbrite_venue_address_1: string;
  eventbrite_venue_address_2: string;
  eventbrite_venue_city: string;
  eventbrite_venue_region: string;
  eventbrite_venue_postal_code: string;
  eventbrite_venue_country: string;
  eventbrite_venue_capacity: string;
  eventbrite_ticket_name: string;
  eventbrite_ticket_type: 'free' | 'paid' | 'donation';
  eventbrite_ticket_quantity: string;
  eventbrite_ticket_price: string;
  sync_eventbrite_on_save: boolean;
  publish_eventbrite_on_save: boolean;
  club_id: string;
  category_ids: string[];
};

export type CategoryFormState = {
  name: string;
  description: string;
};

export type PhotoFormState = {
  section: string;
  title: string;
  caption: string;
  image: string;
  alt_text: string;
  display_order: string;
  is_active: boolean;
};

export type ActivityTab = 'books' | 'sessions' | 'events';
export type ActivitySection = 'livros' | 'sessoes' | 'eventos';

export type AdminSection =
  | 'resumo'
  | 'metricas'
  | 'logs'
  | 'notificacoes'
  | 'newsletters'
  | 'galeria'
  | 'utilizadores'
  | 'conteudos'
  | 'noticias'
  | 'livros'
  | 'sessoes'
  | 'eventos'
  | 'eventbrite'
  | 'atividades'
  | 'clubes'
  | 'inscricoes';

export type UserPage =
  | { mode: 'list' }
  | { mode: 'create' }
  | { mode: 'profile'; userId: number }
  | { mode: 'edit'; userId: number }
  | { mode: 'deactivate'; userId: number }
  | { mode: 'activate'; userId: number };

export type NewsSubpage = 'form' | 'list';
export type ActivitySubpage = 'form' | 'list' | 'categories';
export type ContentSubpage = 'form' | 'list';
export type PhotoSubpage = 'form' | 'list';
export type EventbriteSubpage = 'overview' | 'venues' | 'seating' | 'tickets';

export type AdminContextLink = {
  label: string;
  href: string;
};
