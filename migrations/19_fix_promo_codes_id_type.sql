-- =============================================================================
-- 19_fix_promo_codes_id_type.sql
-- Corrección: promo_codes.id era uuid (migración 18) pero el admin genera ids
-- de texto `prm_...` (convención del repo: products/products_images usan text).
-- La tabla está vacía (el primer INSERT del admin fallaba), así que el ALTER
-- no necesita backfill.
-- =============================================================================

ALTER TABLE promo_codes
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE text USING id::text;

-- =============================================================================
-- Para aplicar esta migración en NeonDB:
--   psql "$NEON_DATABASE_URL" -f migrations/19_fix_promo_codes_id_type.sql
-- O ejecutar en el SQL Editor de https://console.neon.tech
-- =============================================================================