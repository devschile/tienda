import { useState, useEffect, useCallback } from 'react';
import type { ProductRecord } from '@/types/products';
import posthog from '@/lib/posthog';

export interface CartItem {
  product: ProductRecord;
  quantity: number;
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

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // Persistir en localStorage cada vez que cambia el carrito
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: ProductRecord, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const maxStock = product.fields.stock;
        const newQty = Math.min(existing.quantity + quantity, maxStock);
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: newQty } : i));
      }
      return [...prev, { product, quantity: Math.min(quantity, product.fields.stock) }];
    });
  }, []);

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

      const nextQuantity = Math.min(quantity, item.product.fields.stock);
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
  // Usa sale_price cuando el producto está en oferta
  const effectivePrice = (item: CartItem) =>
    item.product.fields.on_sale && item.product.fields.sale_price != null
      ? item.product.fields.sale_price
      : item.product.fields.price;
  const totalAmount = items.reduce((sum, i) => sum + effectivePrice(i) * i.quantity, 0);
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
  };
}
