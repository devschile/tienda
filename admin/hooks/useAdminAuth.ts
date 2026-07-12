// Hook de autenticación admin — JWT en localStorage, sin dependencias externas
import { useState, useCallback, useEffect } from 'react';

const TOKEN_KEY = 'admin_token';

function decodePayload(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = decodePayload(token);
  if (!payload?.exp) return false;
  return payload.exp > Math.floor(Date.now() / 1000);
}

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = isTokenValid(token);

  // Limpia token expirado al montar
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && !isTokenValid(stored)) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  const identity = token ? decodePayload(token) : null;

  return { isAuthenticated, login, logout, loading, error, identity, getToken };
}

export type AdminAuth = ReturnType<typeof useAdminAuth>;
