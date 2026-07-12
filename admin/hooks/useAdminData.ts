// Hooks genéricos para el data layer del admin
import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '../utils/adminFetch';

// ── useAdminList — lista paginada ─────────────────────────────────────────────
export interface ListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  on_sale?: string;
  visible?: string;
  low_stock?: string;
}

export interface ListResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function useAdminList<T>(resource: string, params: ListParams = {}) {
  const [result, setResult] = useState<ListResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params.page) qs.set('page', String(params.page));
      if (params.pageSize) qs.set('pageSize', String(params.pageSize));
      if (params.status) qs.set('status', params.status);
      if (params.search) qs.set('search', params.search);
      const data = await adminFetch<ListResult<T>>(`${resource}?${qs}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [resource, params.page, params.pageSize, params.status, params.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...result, loading, error, refetch: fetchData };
}

// ── useAdminOne — detalle de un recurso ───────────────────────────────────────
export function useAdminOne<T>(resource: string, id: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<{ data: T }>(`${resource}/${id}`);
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [resource, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ── useAdminMutation — update de un recurso ────────────────────────────────────
export function useAdminMutation<T>(resource: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (id: string, body: Partial<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminFetch<{ data: T }>(`${resource}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        return res.data;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [resource],
  );

  const create = useCallback(
    async (body: Partial<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminFetch<{ data: T }>(resource, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return res.data;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al crear');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [resource],
  );

  return { update, create, loading, error };
}
