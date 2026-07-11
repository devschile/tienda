import { Package } from 'lucide-react';

export function ProductListPage() {
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Productos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de catálogo</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors">
          + Nuevo producto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Package className="h-6 w-6 text-slate-400" />
        </div>
        <p className="font-medium text-slate-600">Tabla de productos</p>
        <p className="text-sm text-slate-400">Disponible en Phase 3 — lista con filtros, toggles inline y edición</p>
      </div>
    </div>
  );
}
