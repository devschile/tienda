// Componente mejorado para mostrar productos
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProductRecord } from '@/types/products';
import { ShoppingCart, Eye } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: ProductRecord;
  onImageClick: (product: ProductRecord) => void;
  onBuyClick: (product: ProductRecord, quantity: number) => void;
  onCategoryClick?: (category: string) => void;
}

export function ProductCard({
  product,
  onImageClick,
  onBuyClick,
  onCategoryClick,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { name, description, price, coverImage, available, stock, on_sale } = product.fields;
  const isSold = !available;
  const isLowStock = available && stock > 0 && stock <= 5;

  const thumbnailUrl = coverImage?.url || '/assets/images/default.svg';

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(p);
  };

  return (
    <Card
      className={`group flex flex-col h-full bg-white/70 hover:bg-white hover:shadow-2xl transition-all duration-300 border-brand-secondary/20 hover:border-brand-secondary/40 hover:-translate-y-1 overflow-hidden ${isSold ? 'product-sold' : ''}`}
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
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Badge oferta */}
          {on_sale && (
            <div className="absolute top-3 left-3 z-20 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md tracking-wide uppercase flex items-center gap-1">
              <span className="absolute -left-3 text-[36px]">💸</span>{' '}
              <span className="pl-8">Oferta</span>
            </div>
          )}

          {/* Sold indicator */}
          {isSold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                AGOTADO
              </div>
            </div>
          )}

          {/* Overlay on hover */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} ${isSold ? 'z-0' : ''}`}
          >
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="bg-brand-surface/90 backdrop-blur-sm text-brand-primary hover:bg-brand-surface shadow-lg"
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCategoryClick?.(product.fields.category || 'Varios');
            }}
            className="mb-2 inline-block px-2 py-1 bg-brand-accent/20 hover:bg-brand-accent/30 transition-colors text-brand-secondary text-xs font-semibold rounded-full uppercase tracking-wider text-left"
          >
            {product.fields.category || 'Varios'}
          </button>
          <h3 className="font-mono font-bold text-lg mb-2 text-devs-text line-clamp-2 min-h-[3.5rem] group-hover:text-brand-secondary transition-colors leading-tight">
            {name}
          </h3>
          <p className="text-sm text-devs-text/70 mb-4 line-clamp-2 min-h-[2.5rem]">
            {description}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-secondary font-medium mb-1">Precio</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {formatPrice(price)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex flex-col gap-3">
        {!isSold && (
          <div className="flex items-center justify-between w-full bg-brand-surface p-2 rounded-lg border border-brand-secondary/10">
            <span className="text-sm font-medium text-devs-text/70">Cantidad:</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-brand-secondary/30 text-brand-secondary hover:bg-brand-secondary hover:text-white"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="font-bold text-devs-text min-w-[1.5rem] text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-brand-secondary/30 text-brand-secondary hover:bg-brand-secondary hover:text-white"
                onClick={() => setQuantity((q) => Math.min(q + 1, stock))}
                disabled={quantity >= stock}
              >
                +
              </Button>
            </div>
          </div>
        )}
        {isLowStock && (
          <p className="text-xs text-amber-600 font-medium text-center w-full">
            ¡Solo quedan {stock} {stock === 1 ? 'unidad' : 'unidades'}!
          </p>
        )}
        <Button
          className={`w-full h-12 text-md shadow-lg hover:shadow-xl transition-all duration-300 group/btn ${
            isSold
              ? 'bg-devs-text/40 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90'
          } text-white`}
          onClick={() => !isSold && onBuyClick(product, quantity)}
          disabled={isSold}
        >
          <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:animate-bounce" />
          {isSold ? 'Agotado' : 'Comprar Ahora'}
        </Button>
      </CardFooter>
    </Card>
  );
}
