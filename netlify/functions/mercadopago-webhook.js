// Netlify Function — Webhook de MercadoPago
// Recibe notificaciones de pago servidor-a-servidor, valida la firma y delega
// la transición de estado + descuento de stock en lib/fulfill (única fuente de
// verdad). Si el webhook se pierde o falla, reconcile-payments.js y la
// reconciliación en get-order.js recuperan la orden automáticamente.
//
// CONFIGURAR en Netlify Dashboard y .env:
//   MERCADOPAGO_WEBHOOK_SECRET → secret del webhook en el panel de MP
//   MERCADOPAGO_ACCESS_TOKEN   → para consultar el pago real a la API de MP
//   NEON_DATABASE_URL          → connection string de Neon
//
// REGISTRAR en MercadoPago:
//   URL: https://tienda.devschile.cl/.netlify/functions/mercadopago-webhook
//   Eventos: payment (payment.created, payment.updated)

const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
const { createMpPayment, mapMpStatus, fulfillOrder } = require('./lib/fulfill');

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
      console.error('mercadopago-webhook: configuración incompleta (accessToken/databaseUrl)');
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
        // ⚠️ Señal principal para diagnosticar "nunca se aprueba una orden":
        // si el MERCADOPAGO_WEBHOOK_SECRET del entorno no coincide con el secret
        // de la URL registrada en el panel de MP, TODAS las notificaciones se
        // descartan aquí y las órdenes quedan pending para siempre.
        console.error(
          `mercadopago-webhook: firma inválida (payment ${dataId || '?'}) — ` +
            'revisar MERCADOPAGO_WEBHOOK_SECRET (es único por URL en el panel de MP)',
        );
        // Retornar 200 para que MP no reintente indefinidamente
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ received: true, error: 'invalid_signature' }),
        };
      }
    } else {
      // Sin secret configurado se acepta cualquier notificación (entorno de
      // desarrollo). Dejar constancia para que no pase desapercibido en prod.
      console.warn('mercadopago-webhook: MERCADOPAGO_WEBHOOK_SECRET no está configurado');
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
      payment = await createMpPayment(accessToken).get({ id: paymentId });
    } catch (mpError) {
      // El pago no existe (ej. ID de prueba 123456) o error de red. Si el token
      // del entorno es de TEST y el pago es de producción (o viceversa) falla
      // siempre aquí — revisar MERCADOPAGO_ACCESS_TOKEN.
      console.error(`mercadopago-webhook: no se pudo obtener el pago ${paymentId}:`, mpError.message);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ received: true, skipped: 'payment_not_found' }),
      };
    }

    const orderId = payment.external_reference;
    const mpStatus = payment.status;

    if (!orderId) {
      console.warn(`mercadopago-webhook: pago ${paymentId} sin external_reference`);
      return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
    }

    const newStatus = mapMpStatus(mpStatus);
    const sql = neon(databaseUrl);

    // ── Leer orden actual (idempotencia + log) ─────────────────────────────
    const [currentOrder] = await sql`
      SELECT id, status FROM orders WHERE id = ${orderId}
    `;

    if (!currentOrder) {
      console.error('mercadopago-webhook: orden no encontrada en BD:', orderId);
      return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
    }

    // Ya aprobada y vuelve 'approved' → no reprocesar (idempotencia rápida;
    // fulfillOrder es el guard definitivo de todos modos).
    if (currentOrder.status === 'approved' && newStatus === 'approved') {
      console.log(`mercadopago-webhook: webhook duplicado ignorado para orden ya aprobada: ${orderId}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ received: true, idempotent: true }),
      };
    }

    // ── Transicionar la orden (y descontar stock si aprobado) ──────────────
    const { processed, items } = await fulfillOrder({
      sql,
      orderId,
      mpPaymentId: String(paymentId),
      mpMerchantOrder: String(payment.order?.id || ''),
      mpStatus,
    });

    if (!processed) {
      console.log(
        `mercadopago-webhook: orden ${orderId} sin cambios (${currentOrder.status} → ${newStatus})`,
      );
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, idempotent: true }) };
    }

    console.log(
      `mercadopago-webhook: orden ${orderId} ${currentOrder.status} → ${newStatus} (pago ${paymentId})`,
    );
    if (newStatus === 'approved') {
      for (const item of items) {
        console.log(
          `mercadopago-webhook:   producto ${item.id}: stock=${item.stock}, available=${item.available}`,
        );
      }
    }

    // ── Email de confirmación al comprador y admin ──────────────────────────
    try {
      const { sendEmail } = require('./emails');
      const {
        confirmacionCompraHTML,
        confirmacionCompraSubject,
      } = require('./emails/templates/confirmacion-compra');
      const {
        nuevaOrdenAdminHTML,
        nuevaOrdenAdminSubject,
      } = require('./emails/templates/nueva-orden-admin');
      const siteUrl = process.env.URL || process.env.SITE_URL || 'https://tienda.devschile.cl';

      // Solo enviamos email de confirmación para estados que el comprador debe saber
      const emailStatuses = ['approved', 'pending_transfer', 'rejected'];
      if (emailStatuses.includes(newStatus)) {
        // Obtener datos completos de la orden para los templates
        const [orderData] = await sql`
          SELECT customer_name, customer_email,
                 shipping_address, shipping_city, shipping_region, shipping_zip,
                 total_amount,
                 discount_code, discount_type, discount_amount
          FROM orders WHERE id = ${orderId}
        `;
        const orderItems = await sql`
          SELECT product_id, product_name, quantity, unit_price, subtotal, original_unit_price
          FROM order_items WHERE order_id = ${orderId}
        `;

        if (orderData) {
          const promo = orderData.discount_code
            ? {
                code: orderData.discount_code,
                type: orderData.discount_type,
                amount: orderData.discount_amount,
              }
            : null;

          // Email al comprador
          await sendEmail({
            to: orderData.customer_email,
            subject: confirmacionCompraSubject(newStatus),
            html: confirmacionCompraHTML({
              customerName: orderData.customer_name,
              status: newStatus,
              items: orderItems,
              totalAmount: orderData.total_amount,
              orderId,
              siteUrl,
              promo,
            }),
          });

          // Email al admin (solo approved y pending_transfer)
          if (process.env.ADMIN_EMAIL && ['approved', 'pending_transfer'].includes(newStatus)) {
            await sendEmail({
              to: process.env.ADMIN_EMAIL,
              subject: nuevaOrdenAdminSubject({
                status: newStatus,
                customerName: orderData.customer_name,
                totalAmount: orderData.total_amount,
              }),
              html: nuevaOrdenAdminHTML({
                status: newStatus,
                orderId,
                customerName: orderData.customer_name,
                customerEmail: orderData.customer_email,
                shipping: {
                  address: orderData.shipping_address,
                  city: orderData.shipping_city,
                  region: orderData.shipping_region,
                  zip: orderData.shipping_zip,
                },
                items: orderItems.map((i) => ({ ...i, product_name: i.product_name })),
                totalAmount: orderData.total_amount,
                promo,
                siteUrl,
              }),
            });
          }
        }
      }
    } catch (emailError) {
      // Los emails son best-effort — no deben bloquear el webhook
      console.error('mercadopago-webhook: error enviando emails:', emailError.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true, order_id: orderId, status: newStatus }),
    };
  } catch (error) {
    console.error('mercadopago-webhook: error en webhook:', error.message);
    // 200 para evitar reintentos indefinidos de MP ante errores internos
    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  }
};
