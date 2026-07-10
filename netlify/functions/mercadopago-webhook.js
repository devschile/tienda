// Netlify Function — Webhook de MercadoPago
// Recibe notificaciones de pago servidor-a-servidor, valida la firma,
// actualiza el estado de la orden en NeonDB y descuenta stock si fue aprobado.
//
// CONFIGURAR en Netlify Dashboard y .env:
//   MERCADOPAGO_WEBHOOK_SECRET → secret del webhook en el panel de MP
//   MERCADOPAGO_ACCESS_TOKEN   → para consultar el pago real a la API de MP
//   NEON_DATABASE_URL          → connection string de Neon
//
// REGISTRAR en MercadoPago:
//   URL: https://tienda.devschile.cl/.netlify/functions/mercadopago-webhook
//   Eventos: payment (payment.created, payment.updated)

const { MercadoPagoConfig, Payment } = require('mercadopago');
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Mapeo de estados de MercadoPago a nuestro enum order_status
const MP_STATUS_MAP = {
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'refunded',
  in_process: 'pending_transfer',
  pending: 'pending',
};

exports.handler = async (event) => {
  // El webhook no necesita CORS — es server-to-server
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const databaseUrl = process.env.NEON_DATABASE_URL;

    if (!accessToken || !databaseUrl) {
      console.error('Configuración incompleta');
      // Devolver 200 para que MP no reintente indefinidamente
      return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
    }

    // ── Validar firma HMAC-SHA256 (si el secret está configurado) ──────────
    if (webhookSecret) {
      const xSignature = event.headers['x-signature'] || '';
      const xRequestId = event.headers['x-request-id'] || '';

      // Formato: "ts=<timestamp>,v1=<hash>"
      const parts = Object.fromEntries(xSignature.split(',').map((p) => p.trim().split('=')));
      const ts = parts.ts || '';
      const v1 = parts.v1 || '';

      let dataId = '';
      try {
        dataId = JSON.parse(event.body || '{}')?.data?.id || '';
      } catch {}

      // Cadena firmada: id:<data.id>;request-id:<x-request-id>;ts:<ts>
      const toSign = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
      const expected = crypto.createHmac('sha256', webhookSecret).update(toSign).digest('hex');

      if (expected !== v1) {
        console.warn('Firma del webhook inválida — posible petición no autorizada');
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
      }
    }

    // ── Parsear el body ────────────────────────────────────────────────────
    const body = JSON.parse(event.body || '{}');

    // Solo procesamos notificaciones de tipo 'payment'
    if (body.type !== 'payment') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ received: true, skipped: body.type }),
      };
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing payment id' }) };
    }

    // ── Consultar el pago real a la API de MercadoPago ─────────────────────
    let payment;
    try {
      const client = new MercadoPagoConfig({ accessToken });
      payment = await new Payment(client).get({ id: paymentId });
    } catch (mpError) {
      // El pago no existe (ej. ID de prueba 123456) o error de red
      console.warn('No se pudo obtener el pago de MP:', mpError.message);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ received: true, skipped: 'payment_not_found' }),
      };
    }

    const orderId = payment.external_reference;
    const mpStatus = payment.status;

    if (!orderId) {
      console.warn('Pago sin external_reference:', paymentId);
      return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
    }

    const newStatus = MP_STATUS_MAP[mpStatus] || 'pending';
    const sql = neon(databaseUrl);

    // ── Leer orden actual (idempotencia) ───────────────────────────────────
    const [currentOrder] = await sql`
      SELECT id, status FROM orders WHERE id = ${orderId}
    `;

    if (!currentOrder) {
      console.error('Orden no encontrada en BD:', orderId);
      return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
    }

    // Si ya estaba aprobada y vuelve 'approved', no reprocessar (idempotencia)
    if (currentOrder.status === 'approved' && newStatus === 'approved') {
      console.log('Webhook duplicado ignorado para orden ya aprobada:', orderId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ received: true, idempotent: true }),
      };
    }

    // ── Actualizar estado de la orden ──────────────────────────────────────
    await sql`
      UPDATE orders
      SET
        status            = ${newStatus}::order_status,
        mp_payment_id     = ${String(paymentId)},
        mp_merchant_order = ${String(payment.order?.id || '')}
      WHERE id = ${orderId}
    `;

    console.log(`Orden ${orderId}: ${currentOrder.status} → ${newStatus} (pago ${paymentId})`);

    // ── Si APROBADO: descontar stock atómicamente ──────────────────────────
    if (newStatus === 'approved') {
      const items = await sql`
        SELECT product_id, quantity FROM order_items WHERE order_id = ${orderId}
      `;

      for (const item of items) {
        const [updated] = await sql`
          UPDATE products
          SET stock = GREATEST(0, stock - ${item.quantity})
          WHERE id = ${item.product_id}
          RETURNING id, stock, available
        `;
        // El trigger fn_sync_available_on_stock pone available=false si stock=0
        if (updated) {
          console.log(
            `  Producto ${updated.id}: stock=${updated.stock}, available=${updated.available}`,
          );
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true, order_id: orderId, status: newStatus }),
    };
  } catch (error) {
    console.error('Error en webhook:', error.message);
    // 200 para evitar reintentos indefinidos de MP ante errores internos
    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  }
};
