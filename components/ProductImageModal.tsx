// Modal de zoom/lightbox de imágenes del producto.
// Desktop: 2 columnas — imagen izquierda fija, textos derecha con scroll.
// Mobile: columna única apilada.
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ProductRecord } from '@/types/products';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { MarkdownText } from '@/components/MarkdownText';

interface ProductImageModalProps {
  product: ProductRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuyClick?: (product: ProductRecord, quantity: number) => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

export function ProductImageModal({
  product,
  open,
  onOpenChange,
  onBuyClick,
}: ProductImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setDirection('next');
    setAdded(false);
  }, [product?.id]);

  useEffect(() => {
    if (!open) return;
    const total =
      product?.fields.images?.length ||
      product?.fields.largeImages?.length ||
      product?.fields.thumbnailImages?.length ||
      0;
    if (total <= 1) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setDirection('next');
        setCurrentIndex((p) => (p + 1) % total);
      }
      if (e.key === 'ArrowLeft') {
        setDirection('prev');
        setCurrentIndex((p) => (p - 1 + total) % total);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, product]);

  if (!product) return null;

  const { on_sale, long_description, price, sale_price, available } = product.fields;
  const isSold = !available;

  const images = product.fields.images?.length
    ? product.fields.images
    : product.fields.largeImages?.length
      ? product.fields.largeImages
      : product.fields.thumbnailImages || [];

  const hasMultiple = images.length > 1;
  const currentImage = images[currentIndex];

  const goNext = () => {
    setDirection('next');
    setCurrentIndex((p) => (p + 1) % images.length);
  };
  const goPrev = () => {
    setDirection('prev');
    setCurrentIndex((p) => (p - 1 + images.length) % images.length);
  };

  const handleBuy = () => {
    if (isSold || !onBuyClick) return;
    onBuyClick(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  // Botón "Lo quiero!" / "✓ Añadido" reutilizable
  const WantButton = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    const base =
      size === 'sm' ? 'px-4 py-2 text-sm rounded-xl' : 'px-5 py-2.5 text-base rounded-xl';
    return (
      <motion.button
        type="button"
        onClick={handleBuy}
        disabled={isSold}
        whileTap={!isSold ? { scale: 0.95 } : undefined}
        className={`${base} font-bold text-white transition-colors btn-glow flex-shrink-0 ${
          isSold ? 'bg-devs-text/30 cursor-not-allowed' : added ? 'bg-emerald-500' : 'btn-buy'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {added ? (
            <motion.span
              key="added"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
              className="flex items-center gap-1.5"
            >
              ✓ Añadido
            </motion.span>
          ) : (
            <motion.span
              key="want"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5"
            >
              {isSold ? (
                'Agotado'
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" /> ¡Lo quiero!
                </>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  // Sección de precio + botón (reutilizada en header y footer mobile)
  const PriceRow = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div>
        {on_sale && sale_price ? (
          <div className="space-y-0.5">
            <div className="flex items-end gap-2 flex-wrap">
              <span
                className={`font-bold text-brand-primary ${size === 'sm' ? 'text-2xl' : 'text-3xl'}`}
              >
                {formatPrice(sale_price)}
              </span>
              <span className="text-sm text-devs-muted line-through pb-0.5">
                {formatPrice(price)}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
              💰 Ahorras {formatPrice(price - sale_price)} (
              {Math.round((1 - sale_price / price) * 100)}% off)
            </span>
          </div>
        ) : (
          <span
            className={`font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent ${size === 'sm' ? 'text-2xl' : 'text-3xl'}`}
          >
            {formatPrice(price)}
          </span>
        )}
      </div>
      {onBuyClick && <WantButton size={size} />}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 rounded-2xl border-brand-secondary/10 bg-white overflow-hidden flex flex-col md:flex-row md:max-h-[60vh]">
        {/* ── COLUMNA IZQUIERDA: imagen (fija, no scrollea) ─────────────────── */}
        <div className="md:w-[52%] md:flex-shrink-0 flex flex-col bg-brand-surface">
          <div className="relative overflow-hidden select-none flex-1">
            <div className="aspect-[4/3] md:aspect-square w-full">
              {currentIndex === 0 ? (
                <motion.img
                  layoutId={`product-cover-${product.id}`}
                  src={currentImage?.url || '/assets/images/default.svg'}
                  alt={`${product.fields.name} — imagen 1`}
                  className="w-full h-full object-cover"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                />
              ) : (
                <motion.img
                  key={currentIndex}
                  src={currentImage?.url || '/assets/images/default.svg'}
                  alt={`${product.fields.name} — imagen ${currentIndex + 1}`}
                  className={`w-full h-full object-cover ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}`}
                />
              )}
            </div>

            {on_sale && (
              <div className="absolute top-3 left-3 z-20 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md tracking-wide uppercase flex items-center gap-1.5">
                <span>⚡</span> Oferta
              </div>
            )}

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Imagen anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-brand-secondary hover:bg-white hover:scale-110 transition-all duration-150"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Siguiente imagen"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-brand-secondary hover:bg-white hover:scale-110 transition-all duration-150"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="flex items-center justify-center gap-2 py-3 border-t border-brand-secondary/10 bg-brand-background/50">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDirection(i > currentIndex ? 'next' : 'prev');
                    setCurrentIndex(i);
                  }}
                  aria-label={`Imagen ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-200 ${i === currentIndex ? 'w-5 bg-brand-primary' : 'w-2 bg-brand-secondary/25 hover:bg-brand-secondary/50'}`}
                />
              ))}
              <span className="ml-1 text-xs font-medium text-devs-muted tabular-nums">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA: textos scrollables ───────────────────────────── */}
        <div className="md:flex-1 overflow-y-auto flex flex-col">
          {/* Header sticky (desktop) — nombre + precio + botón */}
          <div className="sticky top-0 bg-white z-10 px-6 pr-14 py-5 border-b border-brand-secondary/10 shadow-md shadow-black/10 space-y-3">
            <DialogTitle className="font-mono font-bold text-xl text-black leading-tight">
              {product.fields.name}
            </DialogTitle>
            <PriceRow />
          </div>

          {/* Descripción scrollable */}
          <div className="px-6 py-5 space-y-4 flex-1">
            {product.fields.description && (
              <p className="text-sm text-devs-muted leading-relaxed">
                {product.fields.description}
              </p>
            )}
            {long_description && <MarkdownText content={long_description} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
