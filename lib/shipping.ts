// Lógica de envío por tiers (XS | S | M | L)
//
// Cada producto se clasifica por el tamaño del paquete que cobra el courier.
// El costo de envío de un carrito = costo del tier más grande presente
// (cuando se mezclan ítems, el más grande manda — no se suman costos).
//
// Esta es la lógica que usa el frontend para estimar el costo en el checkout.
// El servidor (create-payment.js) la recalcula SIEMPRE desde la BD y es la
// fuente autoritativa — este helper conduce la UI, no el pago.

export type ShippingTier = 'xs' | 's' | 'm' | 'l';

export const SHIPPING_TIERS: ShippingTier[] = ['xs', 's', 'm', 'l'];

const TIER_RANK: Record<ShippingTier, number> = { xs: 0, s: 1, m: 2, l: 3 };

export type ShippingTierCosts = Record<ShippingTier, number>;

export interface CartShippingInput {
  /** false = producto nunca ofrece envío (membresías digitales). */
  shippingEnabled?: boolean;
  shippingTier?: ShippingTier;
}

/** Tier más grande entre los ítems que permiten envío. null si ninguno lo permite. */
export function maxShippingTier(items: CartShippingInput[]): ShippingTier | null {
  let max: ShippingTier | null = null;
  for (const item of items) {
    if (item.shippingEnabled === false) continue;
    const tier =
      item.shippingTier && TIER_RANK[item.shippingTier] !== undefined ? item.shippingTier : 'xs';
    if (!max || TIER_RANK[tier] > TIER_RANK[max]) max = tier;
  }
  return max;
}

/** Costo absoluto de un tier. Si no está configurado (ausente o 0), cae al
 * tier inmediatamente menor y finalmente al costo base (legacy shipping_cost). */
export function shippingCostForTier(
  tier: ShippingTier,
  tierCosts: Partial<ShippingTierCosts>,
  baseCost: number,
): number {
  const rank = TIER_RANK[tier];
  for (let r = rank; r >= 0; r--) {
    const t = SHIPPING_TIERS[r];
    const cost = tierCosts[t] ?? 0;
    if (cost > 0) return cost;
  }
  return baseCost > 0 ? baseCost : 0;
}
