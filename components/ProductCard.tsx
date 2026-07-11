// Componente mejorado para mostrar productos
import { motion, AnimatePresence } from 'motion/react';
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
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { name, description, price, coverImage, available, stock, on_sale, sale_price } =
    product.fields;
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
    <motion.div
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card
        className={`group flex flex-col h-full bg-white/70 hover:bg-white hover:shadow-2xl transition-all duration-300 border-brand-secondary/20 hover:border-brand-secondary/40 overflow-hidden ${isSold ? 'product-sold' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-0 flex-1">
          <div
            className="relative w-full aspect-square overflow-hidden cursor-pointer bg-gradient-to-br from-brand-secondary/10 to-brand-primary/10"
            onClick={() => onImageClick(product)}
          >
            <motion.img
              layoutId={`product-cover-${product.id}`}
              src={thumbnailUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Badge oferta */}
            {on_sale && (
              <div className="absolute top-3 -left-6 -rotate-45 z-20 px-6 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 shadow-md tracking-wide uppercase flex items-center gap-1">
                <motion.span
                  initial={{ scale: 0, opacity: 0, rotate: 45 }}
                  animate={{ scale: 1, opacity: 1, rotate: 45 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                  className="absolute left-8 top-10 rotate-45 text-[48px]"
                >
                  💸
                </motion.span>
                Oferta
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
            <h3 className="font-mono font-light text-lg mb-2 text-devs-text line-clamp-3 min-h-[4.5rem] group-hover:text-brand-secondary transition-colors leading-tight">
              {name}
            </h3>
            <p className="text-sm text-devs-text/70 mb-4 line-clamp-4 min-h-[4.5rem]">
              {description}
            </p>
            <div>
              {on_sale && sale_price ? (
                <>
                  <p className="flex align-middle gap-2 mb-1">
                    <span className="text-xs text-brand-secondary font-medium">Precio</span>
                    <span className="text-xs text-devs-muted line-through">
                      {formatPrice(price)}
                    </span>
                  </p>
                  <p className="flex align-middle justify-between text-3xl font-bold text-brand-primary leading-none">
                    <span>{formatPrice(sale_price)}</span>
                    <span className="h-6 inline-flex items-center gap-1 text-[12px] font-bold bg-amber-300 text-black px-2 py-0.5 rounded-full">
                      💰 Ahorras {formatPrice(price - sale_price)}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-brand-secondary font-medium mb-1">Precio</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                    {formatPrice(price)}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0 flex flex-col gap-5">
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
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-amber-600 font-medium text-center w-full"
            >
              ¡Solo quedan {stock} {stock === 1 ? 'unidad' : 'unidades'}!
            </motion.p>
          )}
          <Button
            className={`w-full h-12 text-sm font-bold tracking-wide rounded-xl transition-colors duration-200 active:scale-[0.98] ${
              isSold
                ? 'bg-devs-text/30 cursor-not-allowed text-white/60'
                : added
                  ? 'bg-emerald-500 text-white btn-glow'
                  : 'btn-buy btn-glow hover:scale-[1.02]'
            }`}
            onClick={() => {
              if (!isSold) {
                onBuyClick(product, quantity);
                setAdded(true);
                setTimeout(() => setAdded(false), 1200);
              }
            }}
            disabled={isSold}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  ✓ Añadido
                </motion.span>
              ) : (
                <motion.span
                  key="buy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isSold ? 'Agotado' : 'Comprar Ahora'}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
