-- =============================================================================
-- 16_add_shipping_enabled_to_products.sql
-- Permite marcar productos que no requieren envío (ej. membresías digitales).
-- =============================================================================
--
-- DISEÑO
-- ------
-- `shipping_enabled` = true (default) preserva el comportamiento actual: el
-- producto participa normalmente en la pregunta de envío del checkout.
-- Cuando es false, el producto nunca ofrece la opción de envío a domicilio —
-- si el carrito son solo productos con shipping_enabled=false, el checkout
-- no muestra esa sección en absoluto.
--
-- IMPACTO EN PRODUCTOS EXISTENTES
-- -------------------------------
-- Ninguno: el default (true) mantiene el comportamiento actual.
-- =============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shipping_enabled boolean NOT NULL DEFAULT true;

-- =============================================================================
-- Para aplicar esta migración en NeonDB:
--   psql "$NEON_DATABASE_URL" -f migrations/16_add_shipping_enabled_to_products.sql
-- O ejecutar en el SQL Editor de https://console.neon.tech
-- =============================================================================
