-- =============================================================================
-- 20_add_shipping_tier.sql
-- Envío por niveles (tiers): cada producto se clasifica por el tamaño del
-- paquete que le aplica la empresa de courier (XS | S | M | L). El costo de
-- envío del carrito = costo del tier más grande presente en el pedido
-- (cuando se mezclan ítems, el más grande manda — no se suman costos).
-- =============================================================================
--
-- DISEÑO
-- ------
-- `products.shipping_tier` texto con los valores 'xs' | 's' | 'm' | 'l'.
-- El default ('xs') preserva el comportamiento actual para productos
-- existentes (mismo patrón que las migraciones 15/16).
--
-- Los costos viven en `settings` como un costo absoluto por tier
-- (shipping_cost_xs, shipping_cost_s, _m, _l). Se siembran desde el valor
-- actual de `shipping_cost` para no reconfigurar la tienda existente;
-- `shipping_cost` se mantiene como base/fallback (legacy, tier xs).
--
-- IMPACTO EN PRODUCTOS EXISTENTES
-- -------------------------------
-- Ninguno: el default preserva el comportamiento actual.
-- =============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shipping_tier text NOT NULL DEFAULT 'xs';

-- Costos absolutos por tier, sembrados desde el costo único actual.
INSERT INTO settings (key, value)
SELECT t.key, COALESCE((SELECT value FROM settings WHERE key = 'shipping_cost'), '3000')
FROM (VALUES ('shipping_cost_xs'), ('shipping_cost_s'), ('shipping_cost_m'), ('shipping_cost_l')) AS t(key)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- Para aplicar esta migración en NeonDB:
--   psql "$NEON_DATABASE_URL" -f migrations/20_add_shipping_tier.sql
-- O ejecutar en el SQL Editor de https://console.neon.tech
-- =============================================================================