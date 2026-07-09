// Modal "quickview" de producto, basado en el diseño de
// stitch_tienda_devschile_product_catalog/code.html
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import type { ProductRecord } from '@/types/products';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductImageModalProps {
  product: ProductRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuyClick?: (product: ProductRecord, quantity: number) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(price);
};

export function ProductImageModal({
  product,
  open,
  onOpenChange,
  onBuyClick,
}: ProductImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Resetear estado al cambiar de producto
  useEffect(() => {
    setCurrentIndex(0);
    setQuantity(1);
  }, [product?.id]);

  if (!product) return null;

  const { available, stock } = product.fields;
  const isSold = !available;
  const isLowStock = available && stock > 0 && stock <= 5;

  const images = product.fields.largeImages || product.fields.thumbnailImages || [];
  const currentImage = images[currentIndex];

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden rounded-2xl border-brand-secondary/10 bg-white p-0 flex flex-col md:flex-row">
        {/* Left side: Product image */}
        <div className="md:w-1/2 p-6 bg-brand-background">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-surface">
            <img
              src={currentImage?.url || '/assets/images/default.svg'}
              alt={product.fields.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <button
                  type="button"
                  aria-label="Imagen anterior"
                  onClick={handlePrev}
                  className="h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-brand-secondary hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Siguiente imagen"
                  onClick={handleNext}
                  className="h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-brand-secondary hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-secondary text-white px-3 py-1 rounded-full text-xs font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Product details */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <DialogTitle className="font-mono text-3xl md:text-4xl font-bold text-brand-secondary mb-4">
            {product.fields.name}
          </DialogTitle>
          <p className="text-devs-muted text-base leading-relaxed mb-6">
            {product.fields.description}
          </p>
          <div className="text-3xl font-bold text-brand-primary mb-8">
            {formatPrice(product.fields.price)}
          </div>

          <div className="flex flex-col gap-4">
            {!isSold && (
              <div className="flex items-center gap-4 bg-brand-background border border-brand-secondary/10 rounded-xl p-3 w-fit">
                <span className="text-devs-muted font-medium px-2">Cantidad:</span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label="Disminuir cantidad"
                    className="w-8 h-8 rounded-full border border-brand-secondary/20 flex items-center justify-center text-brand-secondary hover:bg-brand-surface transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-xl font-semibold text-devs-text min-w-[1.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    className="w-8 h-8 rounded-full border border-brand-secondary/20 flex items-center justify-center text-brand-secondary hover:bg-brand-surface transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    onClick={() => setQuantity((q) => Math.min(q + 1, stock))}
                    disabled={quantity >= stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {isLowStock && (
              <p className="text-sm text-amber-600 font-medium">
                ¡Solo quedan {stock} {stock === 1 ? 'unidad' : 'unidades'}!
              </p>
            )}

            <Button
              className={`w-full py-6 rounded-xl text-base font-semibold shadow-lg transition-all active:scale-[0.98] ${
                isSold
                  ? 'bg-devs-muted cursor-not-allowed'
                  : 'bg-brand-primary hover:bg-brand-secondary'
              } text-white`}
              onClick={() => !isSold && onBuyClick?.(product, quantity)}
              disabled={isSold}
            >
              <ShoppingCart className="h-5 w-5" />
              {isSold ? 'Agotado' : 'Comprar Ahora'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
