// Fetch autenticado para el admin — adjunta JWT de localStorage
const TOKEN_KEY = 'admin_token';

export async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`/admin-api/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/admin/login';
    throw new Error('Sesión expirada');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}
