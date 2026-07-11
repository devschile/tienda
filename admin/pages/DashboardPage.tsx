import { LayoutDashboard, Package, ShoppingBag, TrendingUp } from 'lucide-react';

// Placeholder — datos reales en Phase 5
const stats = [
  { label: 'Pedidos hoy',   value: '—', icon: ShoppingBag,  color: 'text-blue-600',  bg: 'bg-blue-50'  },
  { label: 'Ingresos hoy',  value: '—', icon: TrendingUp,   color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Productos',     value: '—', icon: Package,       color: 'text-violet-600',bg: 'bg-violet-50'},
  { label: 'Pendientes',    value: '—', icon: LayoutDashboard,color:'text-amber-600', bg: 'bg-amber-50' },
];

export function DashboardPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumen de la tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Placeholder tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {['Últimos pedidos', 'Stock bajo'].map((title) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">Disponible en Phase 5</p>
          </div>
        ))}
      </div>
    </div>
  );
}
