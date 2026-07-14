-- =============================================================================
-- 06_create_orders.sql
-- Tablas de órdenes y items de compra para el carrito de Tienda devsChile
-- =============================================================================
--
-- DISEÑO
-- ------
-- orders      → cabecera de la compra (cliente, total, estado, referencias MP)
-- order_items → líneas del carrito (producto, cantidad, precio al momento de compra)
--
-- FLUJO DE ESTADOS
-- ----------------
--   pending   → orden creada, usuario en MercadoPago
--   approved  → pago confirmado por webhook de MP
--   rejected  → pago rechazado por MP
--   pending_transfer → transferencia bancaria en proceso (MP lo llama 'in_process')
--   refunded  → devolución procesada
--   cancelled → orden cancelada antes de pago
--
-- CONSISTENCIA
-- ------------
-- Los precios en order_items son snapshots al momento de la compra.
-- Si el precio del producto cambia después, el historial queda intacto.
-- El stock se descuenta únicamente al pasar a 'approved' (ver webhook).
--
-- =============================================================================

-- Tipo enum para el estado de la orden
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'pending_transfer',
      'refunded',
      'cancelled'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Tabla principal de órdenes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  status             order_status NOT NULL DEFAULT 'pending',
  total_amount       integer     NOT NULL CHECK (total_amount > 0),

  -- Datos del comprador (capturados en el checkout antes de ir a MP)
  customer_name      text        NOT NULL,
  customer_email     text        NOT NULL,

  -- Dirección de envío
  shipping_address   text,
  shipping_city      text,
  shipping_region    text,
  shipping_zip       text,

  -- Referencias de MercadoPago
  mp_preference_id   text,
  mp_payment_id      text,           -- seteado por el webhook al aprobar
  mp_merchant_order  text,           -- merchant_order_id del webhook

  -- Auditoría
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Items del carrito (snapshot de precio al momento de compra)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid    NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id   text    NOT NULL,   -- referencia informativa (el producto puede cambiar)
  product_name text    NOT NULL,   -- nombre al momento de compra
  quantity     integer NOT NULL CHECK (quantity > 0),
  unit_price   integer NOT NULL CHECK (unit_price > 0),
  subtotal     integer GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Trigger: updated_at automático en orders
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email   ON orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_mp_preference_id ON orders (mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id    ON orders (mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id    ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id  ON order_items (product_id);

-- =============================================================================
-- Para aplicar esta migración en NeonDB:
--   psql "$NEON_DATABASE_URL" -f migrations/06_create_orders.sql
-- O ejecutar en el SQL Editor de https://console.neon.tech
-- =============================================================================
