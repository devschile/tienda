import { useState, useEffect, useCallback } from 'react';
import type { ProductRecord } from '@/types/products';

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
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const max = i.product.fields.stock;
        return { ...i, quantity: Math.min(quantity, max) };
      }),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.product.fields.price * i.quantity, 0);
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
