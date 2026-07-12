// Acción para crear pago — contrato actualizado para carrito + datos de envío

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // precio efectivo (sale_price si hay oferta)
  originalPrice: number; // precio base siempre (para mostrar descuento en emails)
}

export interface CustomerData {
  name: string;
  email: string;
  wantsDelivery?: boolean;
  address?: string;
  city?: string;
  region?: string;
  zip?: string;
  wantsNewsletter?: boolean;
  shippingCost?: number; // CLP — 0 o undefined = sin costo de envío
}

export interface CreatePaymentResult {
  success: boolean;
  order_id?: string;
  checkout_url?: string;
  preference_id?: string;
  error?: string;
}

export const createPayment = async (
  items: CartItem[],
  customer: CustomerData,
): Promise<CreatePaymentResult> => {
  if (import.meta.env.DEV) {
    console.log('Mock de pago para desarrollo', { items, customer });
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      order_id: 'mock-order-dev',
      checkout_url: '/success?order_id=mock-order-dev',
    };
  }

  const response = await fetch('/.netlify/functions/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, customer }),
  });

  if (!response.ok) throw new Error('Error al crear el pago en el servidor');
  return response.json();
};

export default createPayment;
