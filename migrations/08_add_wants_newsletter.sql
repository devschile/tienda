-- 08_add_wants_newsletter.sql
-- Agrega columna wants_newsletter a orders para registrar el consentimiento
-- explícito del comprador de recibir comunicaciones de la tienda.
-- Es un dato de privacidad (GDPR/RGPD) — debe almacenarse con la orden.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS wants_newsletter boolean NOT NULL DEFAULT false;

-- Verificar
-- SELECT id, customer_name, wants_newsletter FROM orders ORDER BY created_at DESC LIMIT 5;
