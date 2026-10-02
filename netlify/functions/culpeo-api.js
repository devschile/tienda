// Netlify Function — API de solo lectura para culpeo (CRM interno de devsChile)
//
// culpeo cruza cada venta de su libro contable con los ítems de la orden de la
// tienda y les imputa los costos de compra para calcular el margen real por
// producto. Esta función es la ÚNICA puerta por la que una máquina lee la
// tienda: está separada de admin-api.js a propósito (ese router también
// escribe productos/órdenes y toca MercadoPago) para que la superficie que lee
// culpeo sea explícita y mínima.
//
// Rutas (solo GET, Bearer CULPEO_API_TOKEN):
//   GET /culpeo-api/orders    → órdenes paginadas con sus ítems embebidos
//   GET /culpeo-api/products  → catálogo con precios y tier de envío
//
// Contrato completo en docs/culpeo-api.md.

const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

const ORDER_STATUSES = ['pending', 'approved', 'rejected', 'pending_transfer', 'refunded', 'cancelled'];
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Las respuestas llevan datos de clientes: nunca se cachean.
const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const json = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

const sha256 = (value) => crypto.createHash('sha256').update(value, 'utf8').digest();

// Falla cerrado: sin CULPEO_API_TOKEN configurada no entra nadie. Compara
// digest contra digest (mismo largo siempre) en tiempo constante, para que lo
// que demora la respuesta no filtre el prefijo del secreto.
function isAuthorized(authorizationHeader) {
  const expected = process.env.CULPEO_API_TOKEN;
  if (!expected) return false;

  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader || '');
  if (!match) return false;

  return crypto.timingSafeEqual(sha256(match[1].trim()), sha256(expected));
}

// Acepta tanto /culpeo-api/orders (redirect) como /.netlify/functions/culpeo-api/orders.
function parseRoute(path) {
  const m = /\/culpeo-api\/?([^/?]*)/.exec(path || '');
  return m ? m[1] : '';
}

// Fecha ISO → string normalizado, o null si viene vacía. undefined si es inválida.
function parseDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const routes = {
  async orders({ qs, sql }) {
    const status = qs.status || 'approved';
    if (!ORDER_STATUSES.includes(status)) {
      return json(400, { error: `status inválido (válidos: ${ORDER_STATUSES.join(', ')})` });
    }

    const from = parseDate(qs.from);
    const to = parseDate(qs.to);
    if (from === undefined || to === undefined) {
      return json(400, { error: 'from/to deben ser fechas ISO válidas' });
    }

    const mpPaymentId = qs.mpPaymentId ? String(qs.mpPaymentId) : null;
    const page = Math.max(1, parseInt(qs.page || '1', 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(qs.pageSize || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    // Filtros opcionales resueltos en JS: cada parámetro queda en una
    // comparación directa contra su columna (tipo inferible por Postgres).
    const filter = sql`
      WHERE o.status = ${status}::order_status
        ${mpPaymentId !== null ? sql`AND o.mp_payment_id = ${mpPaymentId}` : sql``}
        ${from !== null ? sql`AND o.created_at >= ${from}::timestamptz` : sql``}
        ${to !== null ? sql`AND o.created_at <= ${to}::timestamptz` : sql``}
    `;

    // Una sola query para órdenes + ítems (json_agg en un LATERAL), sin N+1.
    // La línea de envío (product_id = 'shipping') se saca de `items` y se
    // expone como `shipping_amount`: no es un producto y no tiene costo de compra.
    const [rows, [{ total }]] = await Promise.all([
      sql`
        SELECT o.id, o.status, o.total_amount, o.customer_name, o.customer_email,
               o.mp_payment_id, o.channel, o.discount_code, o.discount_type,
               o.discount_amount, o.archived, o.created_at,
               COALESCE(i.shipping_amount, 0)::int AS shipping_amount,
               COALESCE(i.items, '[]'::json) AS items
        FROM orders o
        LEFT JOIN LATERAL (
          SELECT
            json_agg(
              json_build_object(
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'original_unit_price', oi.original_unit_price,
                'subtotal', oi.subtotal
              ) ORDER BY oi.created_at
            ) FILTER (WHERE oi.product_id <> 'shipping') AS items,
            SUM(oi.subtotal) FILTER (WHERE oi.product_id = 'shipping') AS shipping_amount
          FROM order_items oi
          WHERE oi.order_id = o.id
        ) i ON true
        ${filter}
        ORDER BY o.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      sql`SELECT COUNT(*)::int AS total FROM orders o ${filter}`,
    ]);

    return json(200, { data: rows, total, page, pageSize });
  },

  async products({ sql }) {
    const rows = await sql`
      SELECT id, name, price, sale_price, product_type, shipping_tier, archived
      FROM products
      ORDER BY name
    `;
    return json(200, { data: rows });
  },
};

exports.handler = async (event) => {
  if (!isAuthorized(event.headers?.authorization)) {
    return json(401, { error: 'No autorizado' });
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Método no permitido' });
  }

  const route = parseRoute(event.path);
  const routeHandler = routes[route];
  if (!routeHandler) return json(404, { error: `Recurso desconocido: ${route}` });

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const qs = event.queryStringParameters || {};
    return await routeHandler({ qs, sql });
  } catch (error) {
    console.error(`culpeo-api [GET ${route}]:`, error.message);
    return json(500, { error: error.message || 'Error interno del servidor' });
  }
};
