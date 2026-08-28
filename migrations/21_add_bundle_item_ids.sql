-- =============================================================================
-- 21_add_bundle_item_ids.sql
-- Packs curados: cada pack declara qué productos puede incluir.
-- =============================================================================
--
-- PROBLEMA
-- --------
-- Antes, cualquier producto con `selectable_in_bundles = true` aparecía en TODOS
-- los packs. Al agregar productos no-stickers (ej. button pins) de menor precio,
-- estos se colaban en el pack de stickers sin distinción.
--
-- SOLUCIÓN
-- --------
-- Nuevo campo `bundle_item_ids` (JSON text, igual que `bundle_sizes`): lista de
-- ids `prod_...` que el pack permite elegir. El flag `selectable_in_bundles`
-- sigue existiendo como "pool opt-in" (el ítem puede ser agregado al roster de
-- un pack), pero la curaduría la hace cada pack con su propia lista.
--
-- IMPACTO EN PRODUCTOS EXISTENTES
-- -------------------------------
-- NULL = roster vacío (comportamiento seguro: el constructor no muestra ítems).
-- Tras aplicar esta migración, configurar la membresía del pack existente en el
-- admin (pass manual de una sola vez).
-- =============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS bundle_item_ids text;

-- =============================================================================
-- Para aplicar esta migración en NeonDB:
--   psql "$NEON_DATABASE_URL" -f migrations/21_add_bundle_item_ids.sql
-- O ejecutar en el SQL Editor de https://console.neon.tech
-- =============================================================================