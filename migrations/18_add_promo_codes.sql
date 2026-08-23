-- =============================================================================
-- 18_add_promo_codes.sql
-- Códigos de descuento (promos). El uso de cada código se registra (uses_count)
-- en el webhook de MercadoPago cuando la orden pasa a 'approved'.
-- =============================================================================
--
-- DESCUENTOS
-- ----------
-- discount_type:
--   'percent'  → discount_value es un porcentaje (1–100) sobre el subtotal.
--                max_discount limita el CLP máximo a descontar.
--   'fixed'    → descuento fijo en CLP (discount_value) sobre el subtotal.
--   'shipping' → envío gratis (solamente elimina el costo de envío). discount_value
--                (CLP) se usa como referencia informativa; lo que importa es la
--                regla. No descuenta del subtotal de productos.
--
-- REGLAS
-- ------
--   min_subtotal → el subtotal de productos (pre-envío, pre-descuento) debe
--                  alcanzar este monto para que el código aplique.
--   max_uses     → tope de usos. Se suma en el webhook al aprobar el pago
--                  (idempotente: órdenes ya aprobadas no se reprocesan).
--   starts_at / expires_at → ventana de vigencia (null = sin límite).
--   active       → toggle manual para pausar/reanudar un código.
--   archived     → baja lógica reversible (el código deja de aplicar).
--
-- CÓMO SE ALMACENA EN ÓRDENES
-- ----------------------------
-- Las líneas de order_items SIEMPRE guardan el precio de producto sin descuento
-- de promo (snapshot). El descuento vive a nivel de orden:
--     orders.discount_code   text
--     orders.discount_type   'percent'|'fixed'|'shipping'|NULL
--     orders.discount_amount integer  ← CLP ahorrados (reporting / emails)
--     orders.total_amount             ← lo que efectivamente paga (MP)
-- Para 'percent'|'fixed': total = subtotal − discount_amount + envío.
-- Para 'shipping': total = subtotal (envío anulado), discount_amount = envío ahorrado.

CREATE TABLE IF NOT EXISTS promo_codes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text        NOT NULL UNIQUE, -- normalizado a MAYÚSCULAS sin espacios
  description    text        NOT NULL DEFAULT '',
  discount_type  text        NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'shipping')),
  discount_value integer     NOT NULL CHECK (discount_value > 0), -- % (1–100) o CLP
  min_subtotal   integer     NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  max_discount   integer,      -- tope CLP para 'percent' (null = sin tope)
  starts_at      timestamptz,  -- null = sin inicio
  expires_at     timestamptz,  -- null = sin expiración
  max_uses       integer,      -- null = ilimitado
  uses_count     integer     NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  active         boolean     NOT NULL DEFAULT true,
  archived       boolean     NOT NULL DEFAULT false,
  created_time   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code
  ON promo_codes (code) WHERE active AND NOT archived;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_code   text,
  ADD COLUMN IF NOT EXISTS discount_type   text,
  ADD COLUMN IF NOT EXISTS discount_amount integer NOT NULL DEFAULT 0 CHECK (discount_amount >= 0);

-- =============================================================================
-- Para aplicar esta migración en NeonDB:
--   psql "$NEON_DATABASE_URL" -f migrations/18_add_promo_codes.sql
-- O ejecutar en el SQL Editor de https://console.neon.tech
-- =============================================================================