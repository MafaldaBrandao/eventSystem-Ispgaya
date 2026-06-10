import {
  ActivitySection,
  ActivityTab,
  AdminSection,
  BookFormState,
  CategoryFormState,
  ClubFormState,
  EventFormState,
  FormState,
  NewsFormState,
  PhotoFormState,
  SessionFormState,
  UserFormState
} from './types.js';

export const TOKEN_KEY = 'ispgaya_cultura_token';
export const NOTIFICATION_READ_KEY = 'ispgaya_cultura_notifications_read';
export const REGISTRATION_PAGE_SIZE = 10;
export const NEWS_PAGE_SIZE = 8;
export const ACTIVITY_PAGE_SIZE = 8;
export const NEWS_WORKFLOW_ORDER = ['draft', 'review', 'published', 'archived'];
export const EVENT_WORKFLOW_ORDER = ['draft', 'review', 'published', 'archived'];

export const WORKFLOW_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  review: 'Em revisão',
  published: 'Publicado',
  archived: 'Arquivado',
  rascunho: 'Rascunho',
  publicado: 'Publicado'
};

export const initialContentForm: FormState = {
  area: 'tuna',
  title: '',
  description: '',
  date: '',
  status: 'rascunho'
};

export const initialUserForm: UserFormState = {
  name: '',
  email: '',
  role: 'club_admin',
  club_id: '',
  password: '',
  generate_password: true
};

export const initialClubForm: ClubFormState = {
  name: '',
  description: '',
  mission: '',
  image: '',
  is_active: true,
  enable_registrations: false
};

export const initialNewsForm: NewsFormState = {
  title: '',
  summary: '',
  image: '',
  content: '',
  news_status: 'draft',
  published_at: '',
  club_id: ''
};

export const initialBookForm: BookFormState = {
  title: '',
  author: '',
  publisher: '',
  publication_year: '',
  cover_image: '',
  summary: '',
  is_featured: false,
  available_at: '',
  club_id: ''
};

export const initialSessionForm: SessionFormState = {
  name: '',
  title: '',
  description: '',
  session_date: '',
  start_date: '',
  end_date: '',
  available_at: '',
  location: '',
  enable_registrations: false,
  registration_capacity: '',
  club_id: ''
};

export const initialEventForm: EventFormState = {
  title: '',
  description: '',
  event_date: '',
  start_date: '',
  end_date: '',
  publish_at: '',
  image: '',
  is_external: false,
  enable_registrations: false,
  registration_capacity: '',
  status: 'draft',
  country_code: 'PT',
  district: '',
  municipality: '',
  city: '',
  location: '',
  eventbrite_venue_id: '',
  eventbrite_venue_name: '',
  eventbrite_venue_address_1: '',
  eventbrite_venue_address_2: '',
  eventbrite_venue_city: '',
  eventbrite_venue_region: '',
  eventbrite_venue_postal_code: '',
  eventbrite_venue_country: 'PT',
  eventbrite_venue_capacity: '',
  eventbrite_ticket_name: 'Entrada geral',
  eventbrite_ticket_type: 'free',
  eventbrite_ticket_quantity: '',
  eventbrite_ticket_price: '',
  sync_eventbrite_on_save: false,
  publish_eventbrite_on_save: false,
  club_id: '',
  category_ids: []
};

export const initialCategoryForm: CategoryFormState = {
  name: '',
  description: ''
};

export const initialPhotoForm: PhotoFormState = {
  section: 'laboratorio-cultural',
  title: '',
  caption: '',
  image: '',
  alt_text: '',
  display_order: '0',
  is_active: true,
};

export const activitySectionByTab: Record<ActivityTab, ActivitySection> = {
  books: 'livros',
  sessions: 'sessoes',
  events: 'eventos'
};

export const activityTabBySection: Record<ActivitySection, ActivityTab> = {
  livros: 'books',
  sessoes: 'sessions',
  eventos: 'events'
};

export const allActivityTabs: ActivityTab[] = ['books', 'sessions', 'events'];

export const adminSections: { id: AdminSection; label: string; href: string }[] = [
  { id: 'resumo', label: 'Resumo', href: '/infocultura/resumo' },
  { id: 'metricas', label: 'Métricas', href: '/infocultura/metricas' },
  { id: 'logs', label: 'Logs', href: '/infocultura/logs' },
  { id: 'notificacoes', label: 'Notificações', href: '/infocultura/notificacoes' },
  { id: 'newsletters', label: 'Newsletters', href: '/infocultura/newsletters' },
  { id: 'galeria', label: 'Galeria', href: '/infocultura/galeria' },
  { id: 'utilizadores', label: 'Utilizadores', href: '/infocultura/utilizadores' },
  { id: 'noticias', label: 'Notícias', href: '/infocultura/noticias' },
  { id: 'livros', label: 'Livros', href: '/infocultura/livros' },
  { id: 'sessoes', label: 'Sessões', href: '/infocultura/sessoes' },
  { id: 'eventos', label: 'Eventos', href: '/infocultura/eventos' },
  { id: 'conteudos', label: 'Conteúdos', href: '/infocultura/conteudos' },
  { id: 'inscricoes', label: 'Inscrições', href: '/infocultura/inscricoes' },
  { id: 'clubes', label: 'Clubes', href: '/infocultura/clubes' }
];

export const adminSectionGroups: {
  title: string;
  ids: AdminSection[];
}[] = [
  { title: 'Painel', ids: ['resumo', 'metricas', 'logs', 'notificacoes'] },
  { title: 'Gestão', ids: ['newsletters', 'galeria', 'utilizadores', 'clubes', 'inscricoes'] },
  { title: 'Conteúdos', ids: ['noticias', 'livros', 'sessoes', 'eventos', 'conteudos'] }
];
