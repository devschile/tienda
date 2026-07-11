// Modal de zoom/lightbox de imágenes del producto.
// Desktop: 2 columnas — imagen izquierda fija, textos derecha con scroll.
// Mobile: columna única apilada.
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { ProductRecord } from '@/types/products';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MarkdownText } from '@/components/MarkdownText';

interface ProductImageModalProps {
  product: ProductRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

export function ProductImageModal({ product, open, onOpenChange }: ProductImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  useEffect(() => {
    setCurrentIndex(0);
    setDirection('next');
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

  const { on_sale, long_description, price, sale_price } = product.fields;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        max-w-5xl: más ancho que antes (max-w-3xl)
        Desktop: flex-row — imagen izq fija, textos der scrollables
        Mobile: flex-col apilado
      */}
      <DialogContent className="max-w-5xl p-0 gap-0 md:rounded-2xl md:border-brand-secondary/10 bg-white overflow-hidden flex flex-col md:flex-row max-h-[92vh] overflow-y-auto md:overflow-hidden md:max-h-[68vh]">
        {/* ── COLUMNA IZQUIERDA: imagen (fija, no scrollea) ─────────────────── */}
        <div className="md:w-[52%] md:flex-shrink-0 flex flex-col bg-brand-surface">
          {/* Imagen */}
          <div className="relative overflow-hidden select-none flex-1">
            <div className="aspect-square w-full">
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

            {/* Badge oferta */}
            {on_sale && (
              <div className="absolute top-3 left-3 z-20 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md tracking-wide uppercase flex items-center gap-1.5">
                <span className="text-[36px]">💸</span> Oferta
              </div>
            )}

            {/* Flechas */}
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
            <div className="md:hidden absolute flex bottom-0 bg-white/20 z-10 px-4 py-5 backdrop-blur-md shadow-sm">
              <DialogTitle className="font-mono font-medium text-lg text-brand leading-tight">
                {product.fields.name}
              </DialogTitle>
              {/* Precio */}
              <div className="mt-4">
                {on_sale && sale_price ? (
                  <div className="space-y-1">
                    <div className="flex items-end gap-3 flex-wrap">
                      <span className="text-3xl font-bold text-brand-primary">
                        {formatPrice(sale_price)}
                      </span>
                      <span className="text-base text-devs-muted line-through pb-0.5">
                        {formatPrice(price)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full">
                      💰 Ahorras {formatPrice(price - sale_price)} (
                      {Math.round((1 - sale_price / price) * 100)}% off)
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                    {formatPrice(price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dots + contador */}
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
          {/* Header: nombre + botón X (Radix lo agrega automáticamente) */}
          <div className="hidden md:block sticky top-0 bg-white z-10 px-4 pr-14 py-5 border-b border-brand-secondary/10">
            <DialogTitle className="font-mono font-bold text-xl text-brand leading-tight">
              {product.fields.name}
            </DialogTitle>
            {/* Precio */}
            <div className="mt-4">
              {on_sale && sale_price ? (
                <div className="space-y-1">
                  <div className="flex items-end gap-3 flex-wrap">
                    <span className="text-3xl font-bold text-brand-primary">
                      {formatPrice(sale_price)}
                    </span>
                    <span className="text-base text-devs-muted line-through pb-0.5">
                      {formatPrice(price)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full">
                    💰 Ahorras {formatPrice(price - sale_price)} (
                    {Math.round((1 - sale_price / price) * 100)}% off)
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                  {formatPrice(price)}
                </span>
              )}
            </div>
          </div>

          {/* Contenido scrollable */}
          <div className="px-6 py-5 space-y-5 flex-1">
            {/* Descripción larga en Markdown */}
            {long_description && <MarkdownText content={long_description} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
