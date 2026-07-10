// Acción para consultar el estado de una orden desde el frontend
// Usada por las páginas de confirmación (success/failure/pending).

export type OrderStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'pending_transfer'
  | 'refunded'
  | 'cancelled';

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  customer: { name: string };
  shipping: { city: string | null; region: string | null };
  items: OrderItem[];
  mp_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export const getOrder = async (orderId: string): Promise<Order> => {
  if (import.meta.env.DEV && orderId === 'mock-order-dev') {
    // Mock para desarrollo local
    await new Promise((r) => setTimeout(r, 400));
    return {
      id: 'mock-order-dev',
      status: 'approved',
      total_amount: 5000,
      customer: { name: 'Jorge Dev' },
      shipping: { city: 'Santiago', region: 'Región Metropolitana' },
      items: [
        {
          product_id: 'rec1',
          product_name: 'Set de stickers',
          quantity: 1,
          unit_price: 5000,
          subtotal: 5000,
        },
      ],
      mp_payment_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const response = await fetch(
    `/.netlify/functions/get-order?order_id=${encodeURIComponent(orderId)}`,
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error('No se pudo obtener la orden');
  }

  const data = await response.json();
  return data.order;
};

export default getOrder;
