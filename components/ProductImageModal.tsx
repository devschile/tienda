// Modal mejorado para imágenes del producto
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import type { ProductRecord } from '@/types/products';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card.tsx';

interface ProductImageModalProps {
  product: ProductRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductImageModal({ product, open, onOpenChange }: ProductImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!product) return null;

  const images = product.fields.largeImages || product.fields.thumbnailImages || [];
  const currentImage = images[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-white/95 backdrop-blur-md border-brand-secondary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            {product.fields.name}
          </DialogTitle>
        </DialogHeader>
        <div className="relative bg-gradient-to-br from-brand-secondary/10 to-brand-primary/10 rounded-xl overflow-hidden">
          <img
            src={currentImage?.url || '/assets/images/default.svg'}
            alt={product.fields.name}
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
          />
          {images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-4">
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl border-brand-secondary/20"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-6 w-6 text-brand-secondary" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl border-brand-secondary/20"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6 text-brand-secondary" />
              </Button>
            </div>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        <div className="bg-brand-secondary/5 rounded-lg p-4 mt-2">
          <p className="text-brand-text/80 leading-relaxed">{product.fields.description}</p>
        </div>
        <CardFooter className="p-5 pt-0">
          <Button
            className={`w-full shadow-lg hover:shadow-xl transition-all duration-300 group/btn bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white`}
            onClick={() => alert('Funcionalidad de compra próximamente')}
            disabled={false}
          >
            <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:animate-bounce" />
            {'Comprar Ahora'}
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
}
