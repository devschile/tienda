-- =============================================================================
-- 14_add_bundle_and_addon_fields.sql
-- Soporte para packs de stickers y productos add-on de bajo valor.
-- =============================================================================
--
-- DISEÑO
-- ------
-- `product_type` discrimina cómo se compra un producto:
--   'standard' -> comportamiento actual (catalog normal, se compra directo).
--   'bundle'   -> contenedor "Pack de stickers". No se compra directo: su botón
--                 abre el constructor (BundleBuilder). Precio = bundle_unit_price
--                 por sticker × tamaño elegido. Tiene bundle_sizes ([] de enteros)
--                 y bundle_allow_surprise (completar slots con stickers sorpresa).
--   'addon'    -> sticker de bajo valor. Oculto del catálogo salvo que el carrito
--                 ya acumule subtotal >= costo de envío (sin envío extra).
-- `selectable_in_bundles` -> el producto puede elegirse dentro de un pack.
--                            Se usa en label 'standard' o 'addon'.
--
-- IMPACTO EN PRODUCTOS EXISTENTES
-- -------------------------------
-- Ninguno: las columnas tienen DEFAULTS que preservan el comportamiento actual
-- (product_type='standard', selectable_in_bundles=false, restos NULL/false).
-- =============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type          text    NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS selectable_in_bundles boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bundle_unit_price     integer CHECK (bundle_unit_price IS NULL OR bundle_unit_price > 0),
  ADD COLUMN IF NOT EXISTS bundle_sizes          text,
  ADD COLUMN IF NOT EXISTS bundle_allow_surprise boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_products_product_type ON products (product_type);
CREATE INDEX IF NOT EXISTS idx_products_selectable_in_bundles ON products (selectable_in_bundles);

-- =============================================================================
-- Para aplicar esta migración en NeonDB:
--   psql "$NEON_DATABASE_URL" -f migrations/14_add_bundle_and_addon_fields.sql
-- O ejecutar en el SQL Editor de https://console.neon.tech
-- =============================================================================