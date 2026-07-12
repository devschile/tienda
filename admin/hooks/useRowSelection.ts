// Hook reutilizable para selección de filas en tablas del admin
import { useState, useCallback } from 'react';

export function useRowSelection<T extends { id: string }>(rows: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const allIds = rows.map(r => r.id);
    const allSelected = allIds.every(id => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(allIds));
  }, [rows, selected]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected  = rows.length > 0 && rows.every(r => selected.has(r.id));
  const someSelected = rows.some(r => selected.has(r.id)) && !allSelected;
  const count        = selected.size;

  return { selected, toggle, toggleAll, clear, allSelected, someSelected, count };
}
