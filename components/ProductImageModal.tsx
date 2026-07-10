// Modal de zoom/lightbox de imágenes del producto.
// Muestra: nombre, imágenes con slide animado, flechas de navegación,
// contador y botón cerrar. Sin precio, descripción ni botón de compra.
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import type { ProductRecord } from '@/types/products';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImageModalProps {
  product: ProductRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductImageModal({ product, open, onOpenChange }: ProductImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // Resetear al cambiar de producto
  useEffect(() => {
    setCurrentIndex(0);
    setDirection('next');
  }, [product?.id]);

  // Navegación por teclado (← →)
  useEffect(() => {
    if (!open) return;
    const total =
      product?.fields.largeImages?.length || product?.fields.thumbnailImages?.length || 0;
    if (total <= 1) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setDirection('next');
        setCurrentIndex((prev) => (prev + 1) % total);
      }
      if (e.key === 'ArrowLeft') {
        setDirection('prev');
        setCurrentIndex((prev) => (prev - 1 + total) % total);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, product]);

  if (!product) return null;

  const images = product.fields.largeImages?.length
    ? product.fields.largeImages
    : product.fields.thumbnailImages || [];

  const hasMultiple = images.length > 1;
  const currentImage = images[currentIndex];

  const goNext = () => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goPrev = () => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl border-brand-secondary/10 bg-white">
        {/* Header: nombre del producto + botón X (Radix lo añade automáticamente) */}
        <div className="flex items-center px-6 pr-14 py-4 border-b border-brand-secondary/10">
          <DialogTitle className="font-mono font-bold text-lg text-brand-secondary leading-tight">
            {product.fields.name}
          </DialogTitle>
        </div>

        {/* Área de imagen con flechas de navegación */}
        <div className="relative bg-brand-surface overflow-hidden select-none">
          <div className="aspect-[4/3] w-full">
            <img
              key={currentIndex}
              src={currentImage?.url || '/assets/images/default.svg'}
              alt={`${product.fields.name} — imagen ${currentIndex + 1} de ${images.length}`}
              className={`w-full h-full object-contain ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}`}
            />
          </div>

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

        {/* Footer: dots clicables + contador de texto */}
        {hasMultiple && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-brand-secondary/10">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDirection(i > currentIndex ? 'next' : 'prev');
                  setCurrentIndex(i);
                }}
                aria-label={`Imagen ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-250 ${
                  i === currentIndex
                    ? 'w-5 bg-brand-primary'
                    : 'w-2 bg-brand-secondary/25 hover:bg-brand-secondary/50'
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-medium text-devs-muted tabular-nums">
              {currentIndex + 1} de {images.length}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
