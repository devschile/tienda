// Panel de herramientas de desarrollo — SOLO visible en import.meta.env.DEV
// Permite probar el flujo de pago y las pantallas de confirmación sin MercadoPago.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DevToolsProps {
  onTestCart: () => void;
  onTestCheckout: () => void;
}

const MOCK_ORDER = 'mock-order-dev';

export function DevTools({ onTestCart, onTestCheckout }: DevToolsProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] font-mono text-xs select-none">
      {open && (
        <div className="mb-2 bg-zinc-900/95 backdrop-blur-sm text-zinc-100 rounded-xl shadow-2xl border border-zinc-700 w-56 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 bg-zinc-800 text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
            🛠 Dev Tools
          </div>

          {/* Pantallas de pago */}
          <div className="px-3 pt-2 pb-1 text-[10px] text-zinc-500 uppercase tracking-wider">
            Pantallas de pago
          </div>
          <div className="px-2 pb-2 flex flex-col gap-1">
            <button
              onClick={() => navigate(`/success?order_id=${MOCK_ORDER}`)}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors text-left"
            >
              <span>✅</span> Ver Success
            </button>
            <button
              onClick={() => navigate(`/failure?order_id=${MOCK_ORDER}`)}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors text-left"
            >
              <span>❌</span> Ver Failure
            </button>
            <button
              onClick={() => navigate(`/pending?order_id=${MOCK_ORDER}`)}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 transition-colors text-left"
            >
              <span>⏳</span> Ver Pending
            </button>
          </div>

          {/* Flujo de compra */}
          <div className="px-3 pt-1 pb-1 text-[10px] text-zinc-500 uppercase tracking-wider border-t border-zinc-700/50 mt-1">
            Flujo de compra
          </div>
          <div className="px-2 pb-3 flex flex-col gap-1">
            <button
              onClick={onTestCart}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors text-left"
            >
              <span>🛒</span> Abrir carrito
            </button>
            <button
              onClick={onTestCheckout}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 transition-colors text-left"
            >
              <span>💳</span> Abrir checkout
            </button>
          </div>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-lg transition-colors"
      >
        <span>🛠</span>
        <span>DEV</span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
      </button>
    </div>
  );
}
