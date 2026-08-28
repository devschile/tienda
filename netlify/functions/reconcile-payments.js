// Netlify Function (scheduled) — Reconciliación de pagos.
//
// Escanea órdenes atascadas en pending / pending_transfer y las contrasta contra
// la API de MercadoPago. Si el pago realmente fue aprobado (y el webhook en
// tiempo real se perdió, llegó tarde o fue rechazado por firma), transiciona la
// orden a approved y descuenta stock. Es idempotente y seguro de ejecutar en
// paralelo con el webhook: el guard en lib/fulfill hace que solo uno efectúe el
// descuento.
//
// Registrada en netlify.toml como [[scheduled.functions]] (cada 5 min).
// También responde a invocaciones HTTP manuales (GET/POST) para depuración.

const { neon } = require('@neondatabase/serverless');
const { createMpPayment, findPaymentForOrder, fulfillOrder } = require('./lib/fulfill');

// Tope de órdenes por corrida — suficiente para el volumen de la tienda.
const BATCH_LIMIT = 20;
// Ventana de gracia: no tocar órdenes recién creadas para darle tiempo al
// webhook en tiempo real de procesarlas primero.
const GRACE_MINUTES = 2;

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const databaseUrl = process.env.NEON_DATABASE_URL;

  if (!accessToken || !databaseUrl) {
    console.error('reconcile-payments: configuración incompleta (accessToken/databaseUrl)');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Servidor no configurado' }) };
  }

  const started = Date.now();
  try {
    const sql = neon(databaseUrl);
    const payment = createMpPayment(accessToken);

    const pendingOrders = await sql`
      SELECT id, status, mp_payment_id, created_at
      FROM orders
      WHERE status IN ('pending', 'pending_transfer')
        AND archived = false
        AND created_at < now() - ${GRACE_MINUTES} * interval '1 minute'
      ORDER BY created_at
      LIMIT ${BATCH_LIMIT}
    `;

    let processed = 0;
    for (const order of pendingOrders) {
      const mpPayment = await findPaymentForOrder({
        payment,
        orderId: order.id,
        mpPaymentId: order.mp_payment_id,
      });
      if (!mpPayment) {
        console.log(
          `reconcile-payments: orden ${order.id} sin pago en MP — se mantiene ${order.status}`,
        );
        continue;
      }

      const { processed: changed, newStatus } = await fulfillOrder({
        sql,
        orderId: order.id,
        mpPaymentId: String(mpPayment.id),
        mpMerchantOrder: String(mpPayment.order?.id || ''),
        mpStatus: mpPayment.status,
      });

      if (changed) {
        processed += 1;
        console.log(
          `reconcile-payments: orden ${order.id} ${order.status} → ${newStatus} (pago ${mpPayment.id})`,
        );
      }
    }

    console.log(
      `reconcile-payments: revisadas ${pendingOrders.length} órdenes, procesadas ${processed} en ${Date.now() - started}ms`,
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true, checked: pendingOrders.length, processed }),
    };
  } catch (error) {
    console.error('reconcile-payments: error:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ received: true, error: error.message }) };
  }
};