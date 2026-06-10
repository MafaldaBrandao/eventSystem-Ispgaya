import {
  ContentPayload,
  BookPayload,
  CategoryPayload,
  ClubPayload,
  EventPayload,
  InfoCulturaAdminCollectionPage,
  InfoCulturaAdminNotification,
  InfoCulturaActivityLog,
  InfoCulturaBook,
  InfoCulturaCategory,
  InfoCulturaClub,
  InfoCulturaDashboardStats,
  InfoCulturaEvent,
  InfoCulturaNews,
  InfoCulturaNewsletter,
  InfoCulturaNewsletterSubscriber,
  InfoCulturaNewsStatus,
  InfoCulturaRegistration,
  InfoCulturaRegistrationPage,
  InfoCulturaRegistrationStatus,
  InfoCulturaSession,
  InfoCulturaMetricsOverview,
  EventbriteAttendeesPage,
  EventbriteConnectionStatus,
  EventbriteEventDetail,
  EventbriteOrdersPage,
  EventbriteRefundStatus,
  EventbriteTicketClassPayload,
  NewsPayload,
  NewsletterPayload,
  NewsletterSubscriberPayload,
  PhotoPayload,
  SessionPayload,
  InfoCulturaPhoto,
  InfoCulturaUser,
} from './types.js';
import {
  normalizeItemResponse,
  normalizeItemsResponse,
  request,
  requestBlob,
  ApiBulkDeleteResponse,
  ApiBulkEventResponse,
  ApiBulkNewsResponse,
  ApiBulkRegistrationResponse,
  ApiImageUploadResponse,
  ApiItemResponse,
} from './client.js';
import { CulturalItem } from '../data/culturalContent.js';

function normalizeRegistration<T extends { id?: number; registration_id?: number }>(
  registration: T
): T & { id: number } {
  return {
    ...registration,
    id: registration.id ?? registration.registration_id ?? 0,
  };
}

export async function fetchAdminContent(token: string): Promise<CulturalItem[]> {
  const data = await request<{ items: CulturalItem[] } | CulturalItem[]>('/content/admin/', {}, token);
  return normalizeItemsResponse(data);
}

export async function createAdminContent(
  token: string,
  payload: ContentPayload
): Promise<CulturalItem> {
  const data = await request<ApiItemResponse | CulturalItem>(
    '/content/admin/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );

  return normalizeItemResponse(data);
}

export async function updateAdminContent(
  token: string,
  id: string,
  payload: ContentPayload
): Promise<CulturalItem> {
  const data = await request<ApiItemResponse | CulturalItem>(
    `/content/admin/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );

  return normalizeItemResponse(data);
}

export async function deleteAdminContent(token: string, id: string): Promise<void> {
  await request<void>(
    `/content/admin/${id}/`,
    {
      method: 'DELETE'
    },
    token
  );
}

export async function fetchAdminPhotos(
  token: string,
  filters?: {
    section?: string;
    isActive?: boolean;
  }
): Promise<InfoCulturaPhoto[]> {
  const search = new URLSearchParams();
  if (filters?.section?.trim()) {
    search.set('section', filters.section.trim());
  }
  if (typeof filters?.isActive === 'boolean') {
    search.set('is_active', filters.isActive ? 'true' : 'false');
  }
  const query = search.toString();
  return request<InfoCulturaPhoto[]>(`/photos/admin/${query ? `?${query}` : ''}`, {}, token);
}

export async function createAdminPhoto(
  token: string,
  payload: PhotoPayload
): Promise<InfoCulturaPhoto> {
  return request<InfoCulturaPhoto>(
    '/photos/admin/',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateAdminPhoto(
  token: string,
  id: string,
  payload: PhotoPayload
): Promise<InfoCulturaPhoto> {
  return request<InfoCulturaPhoto>(
    `/photos/admin/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function deleteAdminPhoto(token: string, id: string): Promise<void> {
  await request<void>(
    `/photos/admin/${id}/`,
    {
      method: 'DELETE',
    },
    token
  );
}

export async function fetchAdminClubs(token: string): Promise<InfoCulturaClub[]> {
  return request<InfoCulturaClub[]>('/clubs/admin/', {}, token);
}

export async function fetchAdminCategories(token: string): Promise<InfoCulturaCategory[]> {
  return request<InfoCulturaCategory[]>('/categories/admin/', {}, token);
}

export async function createAdminCategory(
  token: string,
  payload: CategoryPayload
): Promise<InfoCulturaCategory> {
  return request<InfoCulturaCategory>(
    '/categories/admin/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminCategory(
  token: string,
  id: number,
  payload: CategoryPayload
): Promise<InfoCulturaCategory> {
  return request<InfoCulturaCategory>(
    `/categories/admin/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function deleteAdminCategory(token: string, id: number): Promise<void> {
  await request<void>(
    `/categories/admin/${id}/`,
    {
      method: 'DELETE'
    },
    token
  );
}

export async function fetchAdminDashboard(token: string): Promise<InfoCulturaDashboardStats> {
  return request<InfoCulturaDashboardStats>('/dashboard/admin/', {}, token);
}

export async function fetchAdminNotifications(token: string): Promise<InfoCulturaAdminNotification[]> {
  return request<InfoCulturaAdminNotification[]>('/dashboard/admin/notifications/', {}, token);
}

export async function fetchAdminActivityLogs(
  token: string,
  filters?: {
    source?: 'audit' | 'editorial';
    action?: string;
    contentType?: string;
    search?: string;
    clubId?: number;
    limit?: number;
  }
): Promise<{ items: InfoCulturaActivityLog[]; total: number }> {
  const search = new URLSearchParams();
  if (filters?.source) {
    search.set('source', filters.source);
  }
  if (filters?.action?.trim()) {
    search.set('action', filters.action.trim());
  }
  if (filters?.contentType?.trim()) {
    search.set('content_type', filters.contentType.trim());
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (typeof filters?.limit === 'number' && filters.limit > 0) {
    search.set('limit', String(filters.limit));
  }

  const query = search.toString();
  return request<{ items: InfoCulturaActivityLog[]; total: number }>(
    `/dashboard/admin/logs/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function fetchAdminMetricsOverview(
  token: string,
  filters?: {
    period?: 'day' | 'week' | 'month';
    limit?: number;
  }
): Promise<InfoCulturaMetricsOverview> {
  const search = new URLSearchParams();
  if (filters?.period) {
    search.set('period', filters.period);
  }
  if (typeof filters?.limit === 'number' && filters.limit > 0) {
    search.set('limit', String(filters.limit));
  }

  const query = search.toString();
  return request<InfoCulturaMetricsOverview>(
    `/metrics/admin/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function fetchAdminNewsStatuses(token: string): Promise<InfoCulturaNewsStatus[]> {
  return request<InfoCulturaNewsStatus[]>('/news/admin/statuses/', {}, token);
}

export async function fetchAdminNews(
  token: string,
  filters?: {
    clubId?: number;
    status?: string;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
    exportMode?: 'csv';
  }
): Promise<InfoCulturaAdminCollectionPage<InfoCulturaNews>> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (filters?.status && filters.status !== 'all') {
    search.set('status', filters.status);
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  if (typeof filters?.page === 'number' && filters.page > 0) {
    search.set('page', String(filters.page));
  }
  if (typeof filters?.pageSize === 'number' && filters.pageSize > 0) {
    search.set('page_size', String(filters.pageSize));
  }
  if (filters?.exportMode === 'csv') {
    search.set('export', 'csv');
  }
  const query = search.toString();
  return request<InfoCulturaAdminCollectionPage<InfoCulturaNews>>(
    `/news/admin/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function fetchAdminNewsletters(
  token: string,
  filters?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    exportMode?: 'csv';
  }
): Promise<InfoCulturaAdminCollectionPage<InfoCulturaNewsletter>> {
  const search = new URLSearchParams();

  if (filters?.status && filters.status !== 'all') {
    search.set('status', filters.status);
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (typeof filters?.page === 'number' && filters.page > 0) {
    search.set('page', String(filters.page));
  }
  if (typeof filters?.pageSize === 'number' && filters.pageSize > 0) {
    search.set('page_size', String(filters.pageSize));
  }
  if (filters?.exportMode === 'csv') {
    search.set('export', 'csv');
  }

  const query = search.toString();
  return request<InfoCulturaAdminCollectionPage<InfoCulturaNewsletter>>(
    `/newsletters/admin/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function createAdminNewsletter(
  token: string,
  payload: NewsletterPayload
): Promise<InfoCulturaNewsletter> {
  return request<InfoCulturaNewsletter>(
    '/newsletters/admin/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminNewsletter(
  token: string,
  id: number,
  payload: NewsletterPayload
): Promise<InfoCulturaNewsletter> {
  return request<InfoCulturaNewsletter>(
    `/newsletters/admin/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function deleteAdminNewsletter(token: string, id: number): Promise<void> {
  await request<void>(
    `/newsletters/admin/${id}/`,
    {
      method: 'DELETE'
    },
    token
  );
}

export async function sendAdminNewsletter(
  token: string,
  id: number
): Promise<{ newsletter: InfoCulturaNewsletter; sent: number }> {
  return request<{ newsletter: InfoCulturaNewsletter; sent: number }>(
    `/newsletters/admin/${id}/send/`,
    {
      method: 'POST'
    },
    token
  );
}

export async function fetchAdminNewsletterSubscribers(
  token: string,
  filters?: {
    search?: string;
    isActive?: boolean | 'all';
    page?: number;
    pageSize?: number;
    exportMode?: 'csv';
  }
): Promise<InfoCulturaAdminCollectionPage<InfoCulturaNewsletterSubscriber>> {
  const search = new URLSearchParams();

  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.isActive === true) {
    search.set('is_active', 'true');
  } else if (filters?.isActive === false) {
    search.set('is_active', 'false');
  }
  if (typeof filters?.page === 'number' && filters.page > 0) {
    search.set('page', String(filters.page));
  }
  if (typeof filters?.pageSize === 'number' && filters.pageSize > 0) {
    search.set('page_size', String(filters.pageSize));
  }
  if (filters?.exportMode === 'csv') {
    search.set('export', 'csv');
  }

  const query = search.toString();
  return request<InfoCulturaAdminCollectionPage<InfoCulturaNewsletterSubscriber>>(
    `/newsletters/admin/subscribers/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function createAdminNewsletterSubscriber(
  token: string,
  payload: NewsletterSubscriberPayload
): Promise<InfoCulturaNewsletterSubscriber> {
  return request<InfoCulturaNewsletterSubscriber>(
    '/newsletters/admin/subscribers/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminNewsletterSubscriber(
  token: string,
  id: number,
  payload: NewsletterSubscriberPayload
): Promise<InfoCulturaNewsletterSubscriber> {
  return request<InfoCulturaNewsletterSubscriber>(
    `/newsletters/admin/subscribers/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function deleteAdminNewsletterSubscriber(
  token: string,
  id: number
): Promise<void> {
  await request<void>(
    `/newsletters/admin/subscribers/${id}/`,
    {
      method: 'DELETE'
    },
    token
  );
}

export async function fetchAdminRegistrationStatuses(
  token: string
): Promise<InfoCulturaRegistrationStatus[]> {
  return request<InfoCulturaRegistrationStatus[]>('/registrations/admin/statuses/', {}, token);
}

export async function fetchAdminRegistrations(
  token: string,
  filters?: {
    clubId?: number;
    status?: string;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
    exportMode?: 'csv';
  }
): Promise<InfoCulturaRegistrationPage> {
  const search = new URLSearchParams();

  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }

  if (filters?.status && filters.status !== 'all') {
    search.set('status', filters.status);
  }

  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }

  if (typeof filters?.page === 'number' && filters.page > 0) {
    search.set('page', String(filters.page));
  }

  if (typeof filters?.pageSize === 'number' && filters.pageSize > 0) {
    search.set('page_size', String(filters.pageSize));
  }
  if (filters?.exportMode === 'csv') {
    search.set('export', 'csv');
  }

  const query = search.toString();
  const data = await request<InfoCulturaRegistrationPage & {
    items: Array<InfoCulturaRegistration & { registration_id?: number }>;
  }>(
    `/registrations/admin/${query ? `?${query}` : ''}`,
    {},
    token
  );

  return {
    ...data,
    items: data.items.map((item) => normalizeRegistration(item)),
  };
}

export async function exportAdminRegistrationsCsv(
  token: string,
  filters?: {
    clubId?: number;
    status?: string;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<Blob> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (filters?.status && filters.status !== 'all') {
    search.set('status', filters.status);
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  search.set('export', 'csv');
  return requestBlob(`/registrations/admin/?${search.toString()}`, {}, token);
}

export async function updateAdminRegistrationStatus(
  token: string,
  registrationId: number,
  status: string
): Promise<InfoCulturaRegistration> {
  const data = await request<{ registration: InfoCulturaRegistration }>(
    `/registrations/admin/${registrationId}/status/`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status })
    },
    token
  );

  return normalizeRegistration(data.registration);
}

export async function bulkUpdateAdminRegistrationStatus(
  token: string,
  ids: number[],
  status: string
): Promise<InfoCulturaRegistration[]> {
  const data = await request<ApiBulkRegistrationResponse>(
    '/registrations/admin/bulk-status/',
    {
      method: 'POST',
      body: JSON.stringify({ ids, status })
    },
    token
  );

  return data.items.map((item) => normalizeRegistration(item));
}

export async function createAdminNews(
  token: string,
  payload: NewsPayload
): Promise<InfoCulturaNews> {
  return request<InfoCulturaNews>(
    '/news/admin/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminNews(
  token: string,
  id: number,
  payload: NewsPayload
): Promise<InfoCulturaNews> {
  return request<InfoCulturaNews>(
    `/news/admin/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function deleteAdminNews(token: string, id: number): Promise<void> {
  await request<void>(
    `/news/admin/${id}/`,
    {
      method: 'DELETE'
    },
    token
  );
}

export async function exportAdminNewsCsv(
  token: string,
  filters?: {
    clubId?: number;
    status?: string;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<Blob> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (filters?.status && filters.status !== 'all') {
    search.set('status', filters.status);
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  search.set('export', 'csv');
  return requestBlob(`/news/admin/?${search.toString()}`, {}, token);
}

export async function bulkUpdateAdminNewsStatus(
  token: string,
  ids: number[],
  status: string
): Promise<InfoCulturaNews[]> {
  const data = await request<ApiBulkNewsResponse>(
    '/news/admin/bulk-status/',
    {
      method: 'POST',
      body: JSON.stringify({ ids, status })
    },
    token
  );

  return data.items;
}

export async function bulkDeleteAdminNews(token: string, ids: number[]): Promise<number> {
  const data = await request<ApiBulkDeleteResponse>(
    '/news/admin/bulk-delete/',
    {
      method: 'POST',
      body: JSON.stringify({ ids })
    },
    token
  );

  return data.deleted;
}

export async function uploadAdminImage(
  token: string,
  file: File,
  folder: 'news' | 'events' | 'books' | 'clubs' | 'photos'
): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  body.append('folder', folder);

  const data = await request<ApiImageUploadResponse>(
    '/uploads/images/',
    {
      method: 'POST',
      body
    },
    token
  );

  return data.path;
}

export async function fetchAdminBooks(
  token: string,
  filters?: {
    clubId?: number;
    isActive?: boolean;
    featured?: boolean;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
    exportMode?: 'csv';
  }
): Promise<InfoCulturaAdminCollectionPage<InfoCulturaBook>> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (typeof filters?.isActive === 'boolean') {
    search.set('is_active', filters.isActive ? 'true' : 'false');
  }
  if (typeof filters?.featured === 'boolean') {
    search.set('featured', filters.featured ? 'true' : 'false');
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  if (typeof filters?.page === 'number' && filters.page > 0) {
    search.set('page', String(filters.page));
  }
  if (typeof filters?.pageSize === 'number' && filters.pageSize > 0) {
    search.set('page_size', String(filters.pageSize));
  }
  if (filters?.exportMode === 'csv') {
    search.set('export', 'csv');
  }
  const query = search.toString();
  return request<InfoCulturaAdminCollectionPage<InfoCulturaBook>>(
    `/books/admin/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function createAdminBook(
  token: string,
  payload: BookPayload
): Promise<InfoCulturaBook> {
  return request<InfoCulturaBook>(
    '/books/admin/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminBook(
  token: string,
  id: number,
  payload: BookPayload
): Promise<InfoCulturaBook> {
  return request<InfoCulturaBook>(
    `/books/admin/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function deleteAdminBook(token: string, id: number): Promise<void> {
  await request<void>(
    `/books/admin/${id}/`,
    {
      method: 'DELETE'
    },
    token
  );
}

export async function exportAdminBooksCsv(
  token: string,
  filters?: {
    clubId?: number;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<Blob> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  search.set('export', 'csv');
  return requestBlob(`/books/admin/?${search.toString()}`, {}, token);
}

export async function bulkDeleteAdminBooks(token: string, ids: number[]): Promise<number> {
  const data = await request<ApiBulkDeleteResponse>(
    '/books/admin/bulk-delete/',
    {
      method: 'POST',
      body: JSON.stringify({ ids })
    },
    token
  );

  return data.deleted;
}

export async function fetchAdminSessions(
  token: string,
  filters?: {
    clubId?: number;
    isActive?: boolean;
    registrations?: 'all' | 'open' | 'closed';
    location?: string;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
    exportMode?: 'csv';
  }
): Promise<InfoCulturaAdminCollectionPage<InfoCulturaSession>> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (typeof filters?.isActive === 'boolean') {
    search.set('is_active', filters.isActive ? 'true' : 'false');
  }
  if (filters?.registrations && filters.registrations !== 'all') {
    search.set('registrations', filters.registrations);
  }
  if (filters?.location?.trim()) {
    search.set('location', filters.location.trim());
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  if (typeof filters?.page === 'number' && filters.page > 0) {
    search.set('page', String(filters.page));
  }
  if (typeof filters?.pageSize === 'number' && filters.pageSize > 0) {
    search.set('page_size', String(filters.pageSize));
  }
  if (filters?.exportMode === 'csv') {
    search.set('export', 'csv');
  }
  const query = search.toString();
  return request<InfoCulturaAdminCollectionPage<InfoCulturaSession>>(
    `/sessions/admin/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function createAdminSession(
  token: string,
  payload: SessionPayload
): Promise<InfoCulturaSession> {
  return request<InfoCulturaSession>(
    '/sessions/admin/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminSession(
  token: string,
  id: number,
  payload: SessionPayload
): Promise<InfoCulturaSession> {
  return request<InfoCulturaSession>(
    `/sessions/admin/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function deleteAdminSession(token: string, id: number): Promise<void> {
  await request<void>(
    `/sessions/admin/${id}/`,
    {
      method: 'DELETE'
    },
    token
  );
}

export async function exportAdminSessionsCsv(
  token: string,
  filters?: {
    clubId?: number;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<Blob> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  search.set('export', 'csv');
  return requestBlob(`/sessions/admin/?${search.toString()}`, {}, token);
}

export async function fetchAdminEvents(
  token: string,
  filters?: {
    clubId?: number;
    categoryId?: number;
    isActive?: boolean;
    status?: string;
    city?: string;
    location?: string;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
    exportMode?: 'csv';
  }
): Promise<InfoCulturaAdminCollectionPage<InfoCulturaEvent>> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (typeof filters?.categoryId === 'number') {
    search.set('category_id', String(filters.categoryId));
  }
  if (typeof filters?.isActive === 'boolean') {
    search.set('is_active', filters.isActive ? 'true' : 'false');
  }
  if (filters?.status && filters.status !== 'all') {
    search.set('status', filters.status);
  }
  if (filters?.city?.trim()) {
    search.set('city', filters.city.trim());
  }
  if (filters?.location?.trim()) {
    search.set('location', filters.location.trim());
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  if (typeof filters?.page === 'number' && filters.page > 0) {
    search.set('page', String(filters.page));
  }
  if (typeof filters?.pageSize === 'number' && filters.pageSize > 0) {
    search.set('page_size', String(filters.pageSize));
  }
  if (filters?.exportMode === 'csv') {
    search.set('export', 'csv');
  }
  const query = search.toString();
  return request<InfoCulturaAdminCollectionPage<InfoCulturaEvent>>(
    `/events/admin/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function createAdminEvent(
  token: string,
  payload: EventPayload
): Promise<InfoCulturaEvent> {
  return request<InfoCulturaEvent>(
    '/events/admin/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminEvent(
  token: string,
  id: number,
  payload: EventPayload
): Promise<InfoCulturaEvent> {
  return request<InfoCulturaEvent>(
    `/events/admin/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function deleteAdminEvent(token: string, id: number): Promise<void> {
  await request<void>(
    `/events/admin/${id}/`,
    {
      method: 'DELETE'
    },
    token
  );
}

export async function fetchAdminEventbriteConnection(
  token: string
): Promise<EventbriteConnectionStatus> {
  return request<EventbriteConnectionStatus>('/events/admin/eventbrite/connection/', {}, token);
}

export async function syncAdminEventToEventbrite(
  token: string,
  id: number,
  publish = false
): Promise<InfoCulturaEvent> {
  const data = await request<ApiItemResponse<InfoCulturaEvent> | InfoCulturaEvent>(
    `/events/admin/${id}/eventbrite/sync/`,
    {
      method: 'POST',
      body: JSON.stringify({ publish })
    },
    token
  );

  return normalizeItemResponse(data);
}

export async function fetchAdminEventbriteEventDetail(
  token: string,
  id: number
): Promise<EventbriteEventDetail> {
  return request<EventbriteEventDetail>(`/events/admin/${id}/eventbrite/`, {}, token);
}

export async function createAdminEventbriteTicketClass(
  token: string,
  id: number,
  payload: EventbriteTicketClassPayload
): Promise<{ ticket_class: Record<string, unknown> }> {
  return request<{ ticket_class: Record<string, unknown> }>(
    `/events/admin/${id}/eventbrite/ticket-classes/`,
    {
      method: 'POST',
      body: JSON.stringify({ ticket_class: payload })
    },
    token
  );
}

export async function fetchAdminEventbriteAttendees(
  token: string,
  id: number,
  continuation = ''
): Promise<EventbriteAttendeesPage> {
  const search = new URLSearchParams();
  if (continuation) {
    search.set('continuation', continuation);
  }
  const query = search.toString();
  return request<EventbriteAttendeesPage>(
    `/events/admin/${id}/eventbrite/attendees/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function fetchAdminEventbriteOrders(
  token: string,
  id: number,
  refundStatus: EventbriteRefundStatus = ''
): Promise<EventbriteOrdersPage> {
  const search = new URLSearchParams();
  if (refundStatus) {
    search.set('refund_request_statuses', refundStatus);
  }
  const query = search.toString();
  return request<EventbriteOrdersPage>(
    `/events/admin/${id}/eventbrite/orders/${query ? `?${query}` : ''}`,
    {},
    token
  );
}

export async function exportAdminEventsCsv(
  token: string,
  filters?: {
    clubId?: number;
    categoryId?: number;
    status?: string;
    search?: string;
    ordering?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<Blob> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (typeof filters?.categoryId === 'number') {
    search.set('category_id', String(filters.categoryId));
  }
  if (filters?.status && filters.status !== 'all') {
    search.set('status', filters.status);
  }
  if (filters?.search?.trim()) {
    search.set('search', filters.search.trim());
  }
  if (filters?.ordering?.trim()) {
    search.set('ordering', filters.ordering.trim());
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  search.set('export', 'csv');
  return requestBlob(`/events/admin/?${search.toString()}`, {}, token);
}

export async function bulkUpdateAdminEventStatus(
  token: string,
  ids: number[],
  status: string
): Promise<InfoCulturaEvent[]> {
  const data = await request<ApiBulkEventResponse>(
    '/events/admin/bulk-status/',
    {
      method: 'POST',
      body: JSON.stringify({ ids, status })
    },
    token
  );

  return data.items;
}

export async function bulkDeleteAdminEvents(token: string, ids: number[]): Promise<number> {
  const data = await request<ApiBulkDeleteResponse>(
    '/events/admin/bulk-delete/',
    {
      method: 'POST',
      body: JSON.stringify({ ids })
    },
    token
  );

  return data.deleted;
}

export async function createAdminClub(
  token: string,
  payload: ClubPayload
): Promise<InfoCulturaClub> {
  return request<InfoCulturaClub>(
    '/clubs/admin/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminClub(
  token: string,
  id: number,
  payload: ClubPayload
): Promise<InfoCulturaClub> {
  return request<InfoCulturaClub>(
    `/clubs/admin/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function deleteAdminClub(token: string, id: number): Promise<void> {
  await request<void>(
    `/clubs/admin/${id}/`,
    {
      method: 'DELETE'
    },
    token
  );
}

export async function assignUserToClub(
  token: string,
  clubId: number,
  userId: number
): Promise<InfoCulturaUser> {
  const data = await request<{ user: InfoCulturaUser }>(
    `/clubs/admin/${clubId}/members/`,
    {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    },
    token
  );

  return data.user;
}

// ============================================================================
// SOFT-DELETE OPERATIONS (Deactivate/Activate)
// ============================================================================

export async function deactivateAdminClub(
  token: string,
  id: number
): Promise<InfoCulturaClub> {
  const data = await request<{ club: InfoCulturaClub }>(
    `/clubs/admin/${id}/deactivate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.club;
}

export async function activateAdminClub(
  token: string,
  id: number
): Promise<InfoCulturaClub> {
  const data = await request<{ club: InfoCulturaClub }>(
    `/clubs/admin/${id}/activate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.club;
}

export async function deactivateAdminEvent(
  token: string,
  id: number
): Promise<InfoCulturaEvent> {
  const data = await request<{ event: InfoCulturaEvent }>(
    `/events/admin/${id}/deactivate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.event;
}

export async function activateAdminEvent(
  token: string,
  id: number
): Promise<InfoCulturaEvent> {
  const data = await request<{ event: InfoCulturaEvent }>(
    `/events/admin/${id}/activate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.event;
}

export async function deactivateAdminNews(
  token: string,
  id: number
): Promise<InfoCulturaNews> {
  const data = await request<{ news: InfoCulturaNews }>(
    `/news/admin/${id}/deactivate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.news;
}

export async function activateAdminNews(
  token: string,
  id: number
): Promise<InfoCulturaNews> {
  const data = await request<{ news: InfoCulturaNews }>(
    `/news/admin/${id}/activate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.news;
}

export async function deactivateAdminBook(
  token: string,
  id: number
): Promise<InfoCulturaBook> {
  const data = await request<{ book: InfoCulturaBook }>(
    `/books/admin/${id}/deactivate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.book;
}

export async function activateAdminBook(
  token: string,
  id: number
): Promise<InfoCulturaBook> {
  const data = await request<{ book: InfoCulturaBook }>(
    `/books/admin/${id}/activate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.book;
}

export async function deactivateAdminSession(
  token: string,
  id: number
): Promise<InfoCulturaSession> {
  const data = await request<{ session: InfoCulturaSession }>(
    `/sessions/admin/${id}/deactivate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.session;
}

export async function activateAdminSession(
  token: string,
  id: number
): Promise<InfoCulturaSession> {
  const data = await request<{ session: InfoCulturaSession }>(
    `/sessions/admin/${id}/activate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.session;
}

export async function deactivateAdminClubMember(
  token: string,
  clubId: number,
  userId: number
): Promise<InfoCulturaUser> {
  const data = await request<{ user: InfoCulturaUser }>(
    `/clubs/admin/${clubId}/members/${userId}/deactivate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.user;
}
export async function removeUserFromClub(
  token: string,
  clubId: number,
  userId: number
): Promise<InfoCulturaUser> {
  const data = await request<{ user: InfoCulturaUser }>(
    `/clubs/admin/${clubId}/members/${userId}/`,
    {
      method: 'DELETE'
    },
    token
  );

  return data.user;
}

export interface LocalSeat {
  id: number;
  section_label: string;
  row_label: string;
  seat_number: number | null;
  seat_label: string;
  eventbrite_seat_id: string | null;
  eventbrite_attendee_id: string | null;
  eventbrite_order_id: string | null;
  attendee_name: string;
  attendee_email: string;
  ticket_class_name: string;
  status: 'available' | 'blocked' | 'vip' | 'assigned';
}

export interface VenueLayoutConfig {
  id: number;
  layout_mode: 'local_layout' | 'eventbrite_reserved_seating';
  rows: number;
  seats_per_row: number;
  row_prefix: string;
  eventbrite_seat_map_id: string | null;
  notes: string;
}

export interface EventSeatSyncIssue {
  id: number;
  eventbrite_attendee_id: string | null;
  eventbrite_order_id: string | null;
  attendee_name: string;
  attendee_email: string;
  ticket_class_name: string;
  issue_type: 'unassigned' | 'duplicate' | 'seat_not_found' | 'missing_attendee_id';
}

export interface EventSeatingResponse {
  venue_layout: VenueLayoutConfig | null;
  seats: LocalSeat[];
  sync_issues: EventSeatSyncIssue[];
}

export async function fetchAdminEventSeating(
  token: string,
  eventId: number
): Promise<EventSeatingResponse> {
  return request<EventSeatingResponse>(`/events/admin/${eventId}/seating/`, {}, token);
}

export async function saveAdminEventSeating(
  token: string,
  eventId: number,
  payload: {
    layout_mode: string;
    rows: number;
    seats_per_row: number;
    row_prefix: string;
    notes?: string;
    eventbrite_seat_map_id?: string | null;
  }
): Promise<EventSeatingResponse> {
  return request<EventSeatingResponse>(
    `/events/admin/${eventId}/seating/`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function paintAdminEventSeat(
  token: string,
  eventId: number,
  seatId: number,
  status: string
): Promise<{ message: string; seat_id: number; status: string }> {
  return request<{ message: string; seat_id: number; status: string }>(
    `/events/admin/${eventId}/seating/paint/`,
    {
      method: 'POST',
      body: JSON.stringify({ seat_id: seatId, status })
    },
    token
  );
}

export async function syncAdminEventSeating(
  token: string,
  eventId: number
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/events/admin/${eventId}/seating/sync/`,
    {
      method: 'POST'
    },
    token
  );
}

