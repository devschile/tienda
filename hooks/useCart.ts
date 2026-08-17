import { useState, useEffect, useCallback } from 'react';
import type { ProductRecord } from '@/types/products';
import posthog from '@/lib/posthog';

export interface BundleSelection {
  /** Tamaño del pack (slots totales). */
  size: number;
  /** Stickers elegidos explícitamente (puede incluir duplicados con quantity > 1).
   *  `name` es solo informativo (listas del carrito) — el servidor lo ignora. */
  items: { productId: string; name: string; quantity: number }[];
  /** Slots que se completan con sorpresa. */
  surpriseCount: number;
}

export interface CartItem {
  product: ProductRecord;
  quantity: number;
  bundle?: BundleSelection;
}

const STORAGE_KEY = 'devschile-cart';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Identidad de un pack: mismo bundle product + misma selección → líneas combinables. */
const bundleKey = (b: BundleSelection) => JSON.stringify(b);

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // Persistir en localStorage cada vez que cambia el carrito
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (product: ProductRecord, quantity: number = 1, bundle?: BundleSelection) => {
      setItems((prev) => {
        const isBundle = product.fields.product_type === 'bundle';
        if (isBundle && bundle) {
          const existing = prev.find(
            (i) =>
              i.product.id === product.id && i.bundle && bundleKey(i.bundle) === bundleKey(bundle),
          );
          if (existing) {
            return prev.map((i) =>
              i.product.id === product.id && i.bundle && bundleKey(i.bundle) === bundleKey(bundle)
                ? { ...i, quantity: i.quantity + 1 }
                : i,
            );
          }
          return [...prev, { product, quantity: 1, bundle }];
        }
        const existing = prev.find((i) => i.product.id === product.id && !i.bundle);
        if (existing) {
          const maxStock = product.fields.stock;
          const newQty = Math.min(existing.quantity + quantity, maxStock);
          return prev.map((i) =>
            i.product.id === product.id && !i.bundle ? { ...i, quantity: newQty } : i,
          );
        }
        return [...prev, { product, quantity: Math.min(quantity, product.fields.stock) }];
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (item) {
        posthog.capture('cart_item_removed', {
          product_id: productId,
          category: item.product.fields.category || 'uncategorized',
          quantity: item.quantity,
        });
      }
      return prev.filter((i) => i.product.id !== productId);
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;

      if (quantity <= 0) {
        posthog.capture('cart_item_removed', {
          product_id: productId,
          category: item.product.fields.category || 'uncategorized',
          quantity: item.quantity,
        });
        return prev.filter((i) => i.product.id !== productId);
      }

      // Los packs no tienen stock propio (shell) — solo se limitan arriba (min 1)
      const nextQuantity = item.bundle ? quantity : Math.min(quantity, item.product.fields.stock);
      if (nextQuantity !== item.quantity) {
        posthog.capture('cart_quantity_updated', {
          product_id: productId,
          category: item.product.fields.category || 'uncategorized',
          previous_quantity: item.quantity,
          quantity: nextQuantity,
        });
      }
      return prev.map((cartItem) =>
        cartItem.product.id === productId ? { ...cartItem, quantity: nextQuantity } : cartItem,
      );
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  // Precio efectivo del producto: sale_price cuando hay oferta, bundle_unit_price
  // para packs (precio por sticker), price en el resto.
  const unitPriceOf = (item: CartItem) => {
    if (item.product.fields.on_sale && item.product.fields.sale_price != null) {
      return item.product.fields.sale_price;
    }
    if (item.product.fields.product_type === 'bundle') {
      return item.product.fields.bundle_unit_price ?? item.product.fields.price;
    }
    return item.product.fields.price;
  };
  // Precio por línea: para un pack es (tamaño del pack × precio por sticker).
  const linePrice = (item: CartItem) =>
    item.bundle ? unitPriceOf(item) * item.bundle.size : unitPriceOf(item);
  const totalAmount = items.reduce((sum, i) => sum + linePrice(i) * i.quantity, 0);
  const isEmpty = items.length === 0;

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
    isEmpty,
    linePrice,
    unitPriceOf,
  };
}
