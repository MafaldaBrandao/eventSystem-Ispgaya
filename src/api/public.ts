import { CulturalArea, CulturalItem } from '../data/culturalContent.js';
import {
  InfoCulturaBook,
  InfoCulturaCategory,
  InfoCulturaClub,
  InfoCulturaEvent,
  InfoCulturaNews,
  InfoCulturaNewsStatus,
  InfoCulturaPhoto,
  InfoCulturaSession,
  UniversitySearchResult,
  ClubRegistrationPayload,
  MetricViewPayload,
} from './types.js';
import {
  normalizeItemsResponse,
  request,
  requestBlob,
  ApiPublicRegistrationResponse,
} from './client.js';

export async function fetchPublicContent(area: CulturalArea): Promise<CulturalItem[]> {
  const data = await request<{ items: CulturalItem[] } | CulturalItem[]>(`/content/?area=${area}`);
  return normalizeItemsResponse(data);
}

export async function fetchPublicPhotos(section?: string): Promise<InfoCulturaPhoto[]> {
  const query = section?.trim() ? `?section=${encodeURIComponent(section.trim())}` : '';
  return request<InfoCulturaPhoto[]>(`/photos/${query}`);
}

export async function fetchPublicClubs(): Promise<InfoCulturaClub[]> {
  return request<InfoCulturaClub[]>('/clubs/');
}

export async function fetchPublicClub(id: number): Promise<InfoCulturaClub> {
  return request<InfoCulturaClub>(`/clubs/${id}/`);
}

export async function createClubRegistration(
  clubId: number,
  payload: ClubRegistrationPayload
): Promise<void> {
  await request<void>(`/clubs/${clubId}/registrations/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchPublicNewsStatuses(): Promise<InfoCulturaNewsStatus[]> {
  return request<InfoCulturaNewsStatus[]>('/news/statuses/');
}

export async function fetchPublicNews(clubId?: number): Promise<InfoCulturaNews[]> {
  const query = typeof clubId === 'number' ? `?club_id=${clubId}` : '';
  return request<InfoCulturaNews[]>(`/news/${query}`);
}

export async function fetchPublicNewsItem(id: number): Promise<InfoCulturaNews> {
  return request<InfoCulturaNews>(`/news/${id}/`);
}

export async function fetchPublicBooks(clubId?: number): Promise<InfoCulturaBook[]> {
  const query = typeof clubId === 'number' ? `?club_id=${clubId}` : '';
  return request<InfoCulturaBook[]>(`/books/${query}`);
}

export async function fetchPublicBookItem(id: number): Promise<InfoCulturaBook> {
  return request<InfoCulturaBook>(`/books/${id}/`);
}

export async function fetchPublicSessions(clubId?: number): Promise<InfoCulturaSession[]> {
  const query = typeof clubId === 'number' ? `?club_id=${clubId}` : '';
  return request<InfoCulturaSession[]>(`/sessions/${query}`);
}

export async function fetchPublicSessionItem(id: number): Promise<InfoCulturaSession> {
  return request<InfoCulturaSession>(`/sessions/${id}/`);
}

export async function fetchPublicCategories(): Promise<InfoCulturaCategory[]> {
  return request<InfoCulturaCategory[]>('/categories/');
}

export async function fetchPublicEvents(filters?: {
  clubId?: number;
  categoryId?: number;
  city?: string;
  state?: 'upcoming' | 'ongoing' | 'past';
  dateFrom?: string;
  dateTo?: string;
}): Promise<InfoCulturaEvent[]> {
  const search = new URLSearchParams();
  if (typeof filters?.clubId === 'number') {
    search.set('club_id', String(filters.clubId));
  }
  if (typeof filters?.categoryId === 'number') {
    search.set('category_id', String(filters.categoryId));
  }
  if (filters?.city?.trim()) {
    search.set('city', filters.city.trim());
  }
  if (filters?.state) {
    search.set('state', filters.state);
  }
  if (filters?.dateFrom) {
    search.set('date_from', filters.dateFrom);
  }
  if (filters?.dateTo) {
    search.set('date_to', filters.dateTo);
  }
  const query = search.toString();
  return request<InfoCulturaEvent[]>(`/events/${query ? `?${query}` : ''}`);
}

export async function fetchPublicEventItem(id: number): Promise<InfoCulturaEvent> {
  return request<InfoCulturaEvent>(`/events/${id}/`);
}

export async function createSessionRegistration(
  sessionId: number,
  payload: ClubRegistrationPayload
): Promise<ApiPublicRegistrationResponse> {
  return request<ApiPublicRegistrationResponse>(`/sessions/${sessionId}/registrations/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createEventRegistration(
  eventId: number,
  payload: ClubRegistrationPayload
): Promise<ApiPublicRegistrationResponse> {
  return request<ApiPublicRegistrationResponse>(`/events/${eventId}/registrations/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function downloadSessionCalendar(sessionId: number): Promise<Blob> {
  return requestBlob(`/sessions/${sessionId}/calendar/`);
}

export async function downloadEventCalendar(eventId: number): Promise<Blob> {
  return requestBlob(`/events/${eventId}/calendar/`);
}

export async function searchUniversities(filters?: {
  name?: string;
  country?: string;
  limit?: number;
  offset?: number;
}): Promise<UniversitySearchResult[]> {
  const search = new URLSearchParams();

  if (filters?.name?.trim()) {
    search.set('name', filters.name.trim());
  }
  if (filters?.country?.trim()) {
    search.set('country', filters.country.trim());
  }
  if (typeof filters?.limit === 'number' && filters.limit > 0) {
    search.set('limit', String(filters.limit));
  }
  if (typeof filters?.offset === 'number' && filters.offset > 0) {
    search.set('offset', String(filters.offset));
  }

  const query = search.toString();
  const response = await request<{ items?: UniversitySearchResult[] } | UniversitySearchResult[]>(
    `/universities/search/${query ? `?${query}` : ''}`
  );

  return Array.isArray(response) ? response : response.items || [];
}

export async function trackInfoCulturaView(payload: MetricViewPayload): Promise<void> {
  try {
    await request<void>(
      '/metrics/view/',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      undefined,
      false
    );
  } catch {
    // tracking should never block the user flow
  }
}
