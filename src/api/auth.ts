import {
  InfoCulturaRole,
  InfoCulturaUser,
  UserPayload,
} from './types.js';
import { request, setStoredAccessToken } from './client.js';

type ApiLoginResponse = {
  token: string;
  user: InfoCulturaUser;
};

type ApiMeResponse = {
  user: InfoCulturaUser;
};

type ApiUserResponse = {
  user: InfoCulturaUser;
};

export async function loginInfoCultura(username: string, password: string): Promise<string> {
  const data = await request<ApiLoginResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  setStoredAccessToken(data.token);
  return data.token;
}

export async function logoutInfoCultura(): Promise<void> {
  try {
    await request<void>('/auth/logout/', { method: 'POST' });
  } finally {
    setStoredAccessToken('');
  }
}

export async function fetchInfoCulturaMe(token: string): Promise<InfoCulturaUser> {
  const data = await request<ApiMeResponse>('/auth/me/', {}, token);
  return data.user;
}

export async function fetchAdminUsers(token: string): Promise<InfoCulturaUser[]> {
  return request<InfoCulturaUser[]>('/auth/users/', {}, token);
}

export async function fetchAdminUser(token: string, id: number): Promise<InfoCulturaUser> {
  return request<InfoCulturaUser>(`/auth/users/${id}/`, {}, token);
}

export async function fetchAdminRoles(token: string): Promise<InfoCulturaRole[]> {
  return request<InfoCulturaRole[]>('/auth/roles/', {}, token);
}

export async function createAdminUser(
  token: string,
  payload: UserPayload
): Promise<InfoCulturaUser> {
  return request<InfoCulturaUser>(
    '/auth/users/',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminUser(
  token: string,
  id: number,
  payload: UserPayload
): Promise<InfoCulturaUser> {
  return request<InfoCulturaUser>(
    `/auth/users/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function deactivateAdminUser(
  token: string,
  id: number
): Promise<InfoCulturaUser> {
  const data = await request<ApiUserResponse>(
    `/auth/users/${id}/deactivate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.user;
}

export async function activateAdminUser(
  token: string,
  id: number
): Promise<InfoCulturaUser> {
  const data = await request<ApiUserResponse>(
    `/auth/users/${id}/activate/`,
    {
      method: 'POST'
    },
    token
  );

  return data.user;
}
