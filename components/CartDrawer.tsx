import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import type { CartItem } from '@/hooks/useCart';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  totalAmount: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

export function CartDrawer({
  open,
  onOpenChange,
  items,
  totalAmount,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed right-0 top-20 left-auto h-auto max-h-full w-full max-w-md translate-x-0 translate-y-0 rounded-none rounded-l-2xl p-0 gap-0 flex flex-col border-l border-brand-secondary/10 bg-brand-background data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-secondary/10">
          <DialogTitle className="font-mono text-xl font-bold text-brand-secondary flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito
            {items.length > 0 && (
              <span className="ml-1 bg-brand-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </DialogTitle>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-16 gap-4"
            >
              <ShoppingCart className="h-16 w-16 text-brand-secondary/20" />
              <p className="font-mono font-bold text-devs-text">Tu carrito está vacío</p>
              <p className="text-sm text-devs-muted">Agrega productos para comenzar</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map(({ product, quantity }) => {
                const coverUrl = product.fields.coverImage?.url ?? '/assets/images/default.svg';
                const stock = product.fields.stock;
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    className="flex gap-3 bg-brand-surface rounded-xl p-3"
                  >
                    <img
                      src={coverUrl}
                      alt={product.fields.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-brand-background"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-sm text-devs-text line-clamp-2 leading-tight mb-1">
                        <span>{product.fields.name}</span>
                      </p>
                      {product.fields.on_sale && product.fields.sale_price ? (
                        <div className="mb-2">
                          <p className="flex align-middle justify-between text-sm font-bold text-brand-primary leading-tight">
                            <span>{formatPrice(product.fields.sale_price * quantity)}</span>
                            <span className="inline-block mt-0.5 text-[10px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">
                              ⚡ Oferta
                            </span>
                          </p>
                          <p className="text-xs text-devs-muted line-through leading-tight">
                            {formatPrice(product.fields.price * quantity)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-brand-primary mb-2">
                          {formatPrice(product.fields.price * quantity)}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          className="w-7 h-7 rounded-full border border-brand-secondary/20 flex items-center justify-center text-brand-secondary hover:bg-brand-secondary hover:text-white transition-colors disabled:opacity-40"
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-bold text-devs-text w-5 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          className="w-7 h-7 rounded-full border border-brand-secondary/20 flex items-center justify-center text-brand-secondary hover:bg-brand-secondary hover:text-white transition-colors disabled:opacity-40"
                          disabled={quantity >= stock}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveItem(product.id)}
                      className="self-start p-1 text-devs-muted hover:text-red-500 transition-colors"
                      aria-label="Eliminar del carrito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <AnimatePresence>
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', bounce: 0.2 }}
              className="px-6 py-5 border-t border-brand-secondary/10 bg-brand-surface/50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-devs-muted font-medium">Total</span>
                <motion.span
                  key={totalAmount}
                  initial={{ scale: 1.15, color: '#16a34a' }}
                  animate={{ scale: 1, color: '#b45b38' }}
                  transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }}
                  className="font-mono text-2xl font-bold"
                >
                  {formatPrice(totalAmount)}
                </motion.span>
              </div>
              <Button
                className="w-full h-12 text-base font-bold tracking-wide bg-brand-primary hover:bg-brand-secondary text-white rounded-xl transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] btn-glow"
                onClick={onCheckout}
              >
                <span className="text-xl mr-1">💳</span> Pagar Ahora
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
