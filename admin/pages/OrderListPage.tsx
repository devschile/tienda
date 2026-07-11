import { ShoppingBag } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:          { label: 'Pendiente',     color: 'bg-amber-100 text-amber-700'  },
  approved:         { label: 'Aprobado',      color: 'bg-green-100 text-green-700'  },
  rejected:         { label: 'Rechazado',     color: 'bg-red-100 text-red-700'      },
  pending_transfer: { label: 'Transferencia', color: 'bg-blue-100 text-blue-700'    },
  refunded:         { label: 'Reembolsado',   color: 'bg-slate-100 text-slate-600'  },
  cancelled:        { label: 'Cancelado',     color: 'bg-slate-100 text-slate-400'  },
};

export function OrderListPage() {
  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Pedidos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gestión de órdenes de compra</p>
      </div>

      {/* Status filters placeholder */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
          <button
            key={key}
            className={`px-3 py-1 rounded-full text-xs font-medium ${color} opacity-60 cursor-not-allowed`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <ShoppingBag className="h-6 w-6 text-slate-400" />
        </div>
        <p className="font-medium text-slate-600">Tabla de pedidos</p>
        <p className="text-sm text-slate-400">Disponible en Phase 4 — lista, detalle y cambio de estado</p>
      </div>
    </div>
  );
}
