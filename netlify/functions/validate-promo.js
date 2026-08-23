// Netlify Function — valida un código de descuento para feedback en checkout.
// Sin JWT: es info pública. NO es autoritativo: create-payment.js vuelve a
// validar el código y recalcula el descuento contra la base de datos al crear
// la orden (aquí el subtotal lo envía el cliente, es solo provisional).

const { neon } = require('@neondatabase/serverless');
const { normalizeCode, checkCode, computeDiscount, reasonMessage } = require('./lib/promo');

exports.handler = async (event) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['https://tienda.devschile.cl', 'https://devschile-tienda.netlify.app'];

  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin || '*' : 'null',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const code = normalizeCode(body.code);
  if (!code) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'Ingresa un código' }) };
  }

  const subtotal = Number(body.subtotal);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'subtotal inválido' }) };
  }
  const shippingCost = Math.max(0, Number(body.shippingCost) || 0);

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const [row] = await sql`
      SELECT code, discount_type, discount_value, min_subtotal, max_discount,
             starts_at, expires_at, max_uses, uses_count, active, archived
      FROM promo_codes WHERE code = ${code}
    `;

    const base = checkCode(row, { subtotal });
    if (!base.ok) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: reasonMessage(base.reason) }) };
    }

    if (row.discount_type === 'shipping') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          code: row.code,
          type: 'shipping',
          discount_amount: shippingCost,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        code: row.code,
        type: row.discount_type,
        discount_amount: computeDiscount(row, subtotal),
      }),
    };
  } catch (error) {
    console.error('validate-promo:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Error al validar el código' }) };
  }
};