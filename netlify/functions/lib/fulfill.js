// Fulfillment de órdenes — única fuente de verdad para transicionar el estado
// de una orden y, cuando el pago fue aprobado, descontar stock y consumir el
// código de descuento. Usado por:
//   - mercadopago-webhook.js (evento en tiempo real)
//   - reconcile-payments.js  (reconciliación programada)
//   - get-order.js           (reconciliación al volver el comprador)
//
// ATOMICIDAD: para pagos aprobados todo ocurre en UNA sola sentencia (CTE):
//   ord   → UPDATE orders ... WHERE status <> 'approved'  (idempotente)
//   promo → consume 1 uso del código de descuento (solo si la orden lo aplicó)
//   stock → UPDATE products ... stock = GREATEST(0, stock - qty)
// Si la orden ya estaba aprobada, `ord` es vacío y la sentencia no toca ni el
// código ni el stock. No puede quedar una orden aprobada sin stock descontado,
// ni un doble descuento por webhooks/ejecuciones concurrentes. Las CTEs con
// UPDATE se ejecutan siempre exactamente una vez (doc. de WITH en Postgres).

const { MercadoPagoConfig, Payment } = require('mercadopago');

// Mapeo de estados de MercadoPago a nuestro enum order_status.
// Estados no conocidos → null (la orden no se toca).
const MP_STATUS_MAP = {
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'refunded',
  in_process: 'pending_transfer',
  pending: 'pending',
};

function mapMpStatus(mpStatus) {
  return MP_STATUS_MAP[mpStatus] || null;
}

function createMpPayment(accessToken) {
  const client = new MercadoPagoConfig({ accessToken });
  return new Payment(client);
}

// Busca el pago real de una orden: por mp_payment_id si ya lo conocemos, si no
// por external_reference (= id de la orden). Retorna el pago o null.
async function findPaymentForOrder({ payment, orderId, mpPaymentId }) {
  if (mpPaymentId) {
    try {
      return await payment.get({ id: String(mpPaymentId) });
    } catch (err) {
      console.error(`fulfill [${orderId}]: Payment.get(${mpPaymentId}) falló:`, err.message);
      return null;
    }
  }
  try {
    const { results } = await payment.search({
      options: {
        external_reference: orderId,
        sort: 'date_created',
        criteria: 'desc',
      },
    });
    return (results && results[0]) || null;
  } catch (err) {
    console.error(`fulfill [${orderId}]: Payment.search falló:`, err.message);
    return null;
  }
}

// Transiciona una orden al estado que corresponde según el estado del pago en
// MP. Para 'approved' descuenta stock y consume el código de descuento de forma
// atómica e idempotente.
//
// Retorna { processed, newStatus, items }:
//   - processed: true si la orden pasó a ese estado en esta llamada (no estaba
//     ya en él). Para 'approved' refleja la transición de la orden, no si hubo
//     filas de stock que descontar (una orden puede ser solo ítems sorpresa).
//   - newStatus: el estado al que corresponde el pago (o null si no se mapea).
//   - items: filas descontadas [{ id, stock, available }] (solo 'approved').
async function fulfillOrder({ sql, orderId, mpPaymentId, mpMerchantOrder, mpStatus }) {
  const newStatus = mapMpStatus(mpStatus);
  if (!newStatus) {
    return { processed: false, newStatus: null, items: [] };
  }

  if (newStatus === 'approved') {
    const [row] = await sql`
      WITH ord AS (
        UPDATE orders
        SET
          status            = 'approved'::order_status,
          mp_payment_id     = ${String(mpPaymentId || '')},
          mp_merchant_order = ${String(mpMerchantOrder || '')}
        WHERE id = ${orderId}
          AND status <> 'approved'
        RETURNING id, discount_code
      ),
      promo AS (
        UPDATE promo_codes
        SET uses_count = uses_count + 1
        FROM ord
        WHERE promo_codes.code = ord.discount_code
        RETURNING 1
      ),
      stock AS (
        UPDATE products
        SET stock = GREATEST(0, stock - oi.quantity)
        FROM ord
        JOIN order_items oi ON oi.order_id = ord.id
        WHERE products.id = oi.product_id
          AND oi.product_id <> 'shipping'
          AND oi.product_id NOT LIKE '%@surpresa'
        RETURNING products.id, products.stock, products.available
      )
      SELECT
        (SELECT count(*) FROM ord)::int AS processed,
        COALESCE(
          (SELECT json_agg(row_to_json(s))::text FROM (SELECT id, stock, available FROM stock) s),
          '[]'
        ) AS items
    `;
    let items = [];
    try {
      items = JSON.parse(row?.items || '[]');
    } catch {
      items = [];
    }
    return { processed: row?.processed > 0, newStatus, items };
  }

  // Estados no-aprobados (rejected, refunded, cancelled, pending, ...): solo se
  // transiciona la orden, nunca se toca stock ni código de descuento. El guard
  // status <> 'approved' evita regresiones y duplicados.
  const [updated] = await sql`
    UPDATE orders
    SET
      status            = ${newStatus}::order_status,
      mp_payment_id     = ${String(mpPaymentId || '')},
      mp_merchant_order = ${String(mpMerchantOrder || '')}
    WHERE id = ${orderId}
      AND status <> 'approved'
    RETURNING id
  `;
  return { processed: Boolean(updated), newStatus, items: [] };
}

module.exports = {
  MP_STATUS_MAP,
  mapMpStatus,
  createMpPayment,
  findPaymentForOrder,
  fulfillOrder,
};