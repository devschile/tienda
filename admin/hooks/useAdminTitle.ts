import { useEffect } from 'react';

const SUFFIX = 'Admin — devsChile™';

export function useAdminTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} — ${SUFFIX}` : SUFFIX;
    return () => {
      // Restore store title when unmounting (e.g. navigating away from /admin)
      document.title = 'Tienda devsChile™ — Productos de la comunidad';
    };
  }, [page]);
}
