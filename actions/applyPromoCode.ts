// Acción para validar un código de descuento antes de pagar (feedback UX).
// El servidor es autoritativo: create-payment vuelve a validar el código.

export interface PromoValidation {
  ok: boolean;
  code?: string;
  type?: 'percent' | 'fixed' | 'shipping';
  /** CLP de descuento estimado. Para 'shipping' es el costo de envío a anular. */
  discount_amount: number;
  error?: string;
}

export const applyPromoCode = async (
  code: string,
  subtotal: number,
  shippingCost: number = 0,
): Promise<PromoValidation> => {
  if (!code.trim()) {
    return { ok: false, discount_amount: 0, error: 'Ingresa un código' };
  }

  if (import.meta.env.DEV) {
    // Mock para desarrollo local
    await new Promise((resolve) => setTimeout(resolve, 350));
    const upper = code.trim().toUpperCase();
    if (upper === 'PILOTO') {
      return { ok: true, code: upper, type: 'fixed', discount_amount: Math.min(3000, subtotal) };
    }
    if (upper === 'ENVIOGRATIS') {
      return { ok: true, code: upper, type: 'shipping', discount_amount: shippingCost };
    }
    return { ok: false, discount_amount: 0, error: 'El código no es válido' };
  }

  const response = await fetch('/.netlify/functions/validate-promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal, shippingCost }),
  });

  if (!response.ok) {
    throw new Error('No se pudo validar el código');
  }

  return response.json();
};

export default applyPromoCode;
