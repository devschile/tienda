// Stub providers para Phase 0 — reemplazados en Phase 1 (auth) y Phase 2 (data)
import type { AuthProvider, DataProvider } from '@refinedev/core';

export const stubAuthProvider: AuthProvider = {
  login: async () => ({ success: false, error: new Error('Auth no implementado aún') }),
  logout: async () => ({ success: true, redirectTo: '/admin/login' }),
  check: async () => ({ authenticated: true }), // siempre auth en Phase 0
  getIdentity: async () => ({ id: 1, name: 'Admin', avatar: '' }),
  onError: async () => ({}),
};

export const stubDataProvider: DataProvider = {
  getList: async () => ({ data: [], total: 0 }),
  getOne: async () => ({ data: {} as never }),
  create: async () => ({ data: {} as never }),
  update: async () => ({ data: {} as never }),
  deleteOne: async () => ({ data: {} as never }),
  getApiUrl: () => '/admin-api',
};
