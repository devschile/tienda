// Modal mejorado para imágenes del producto
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import type { AirtableRecord } from '@/types/product';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductImageModalProps {
  product: AirtableRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductImageModal({ product, open, onOpenChange }: ProductImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!product) return null;

  const images = product.fields.imagenes_grandes || product.fields.imagen_miniatura || [];
  const currentImage = images[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-white/95 backdrop-blur-md border-orange-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
            {product.fields.nombre}
          </DialogTitle>
        </DialogHeader>
        <div className="relative bg-gradient-to-br from-orange-50 to-rose-50 rounded-xl overflow-hidden">
          <img
            src={currentImage?.url || '/assets/images/default.svg'}
            alt={product.fields.nombre}
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
          />
          {images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-4">
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl border-orange-100"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-6 w-6 text-orange-600" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl border-orange-100"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6 text-orange-600" />
              </Button>
            </div>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-rose-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
        <div className="bg-orange-50/50 rounded-lg p-4 mt-2">
          <p className="text-gray-700 leading-relaxed">{product.fields.descripcion}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
