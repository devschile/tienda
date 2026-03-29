// Componente mejorado para mostrar productos
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProductRecord } from '@/types/products';
import { ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: ProductRecord;
  onImageClick: (product: ProductRecord) => void;
  onBuyClick: (product: ProductRecord) => void;
}

export function ProductCard({ product, onImageClick, onBuyClick }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { nombre, descripcion, precio, imagen_miniatura, activo } = product.fields;
  const isSold = !activo;
  
  const thumbnailUrl = imagen_miniatura?.[0]?.thumbnails?.large?.url || imagen_miniatura?.[0]?.url || '/assets/images/default.svg';
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card 
      className={`group flex flex-col h-full bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 border-brand-secondary/20 hover:border-brand-secondary/40 hover:-translate-y-2 overflow-hidden ${isSold ? 'product-sold' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0 flex-1">
        <div 
          className="relative w-full aspect-square overflow-hidden cursor-pointer bg-gradient-to-br from-brand-secondary/10 to-brand-primary/10"
          onClick={() => onImageClick(product)}
        >
          <img
            src={thumbnailUrl}
            alt={nombre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Sold indicator */}
          {isSold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                VENDIDO
              </div>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} ${isSold ? 'z-0' : ''}`}>
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 backdrop-blur-sm text-brand-primary hover:bg-white shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(product);
                }}
                disabled={isSold}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalles
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-bold text-lg mb-2 text-brand-text line-clamp-2 min-h-[3.5rem] group-hover:text-brand-secondary transition-colors">
            {nombre}
          </h3>
          <p className="text-sm text-brand-text/70 mb-4 line-clamp-2 min-h-[2.5rem]">
            {descripcion}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-secondary font-medium mb-1">Precio</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {formatPrice(precio)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button 
          className={`w-full shadow-lg hover:shadow-xl transition-all duration-300 group/btn ${
            isSold 
              ? 'bg-brand-text/40 cursor-not-allowed' 
              : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90'
          } text-white`}
          onClick={() => !isSold && onBuyClick(product)}
          disabled={isSold}
        >
          <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:animate-bounce" />
          {isSold ? 'Vendido' : 'Comprar Ahora'}
        </Button>
      </CardFooter>
    </Card>
  );
}
