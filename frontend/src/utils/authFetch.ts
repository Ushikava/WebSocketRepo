async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('vj_refresh_token');
  if (!refreshToken) return null;

  const res = await fetch('/api/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem('vj_token');
    localStorage.removeItem('vj_refresh_token');
    localStorage.removeItem('vj_username');
    return null;
  }

  const data = await res.json();
  localStorage.setItem('vj_token', data.access_token);
  localStorage.setItem('vj_refresh_token', data.refresh_token);
  return data.access_token;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('vj_token');

  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  if (res.status !== 401) return res;

  const newToken = await tryRefresh();
  if (!newToken) {
    window.location.href = '/uflow/auth';
    return res;
  }

  headers.set('Authorization', `Bearer ${newToken}`);
  return fetch(url, { ...options, headers });
}
