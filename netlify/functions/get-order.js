// Netlify Function — Consulta una orden por su ID
// Usada por las páginas de confirmación (success/failure/pending) para
// mostrar el detalle real del pago en lugar de asumir el resultado por la URL.

const { neon } = require('@neondatabase/serverless');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const orderId = event.queryStringParameters?.order_id;

  if (!orderId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'order_id es requerido' }) };
  }

  if (!UUID_RE.test(orderId)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'order_id inválido' }) };
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);

    const [order] = await sql`
      SELECT
        id, status, total_amount,
        customer_name,
        shipping_city, shipping_region,
        mp_payment_id,
        created_at, updated_at
      FROM orders
      WHERE id = ${orderId}
    `;

    if (!order) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Orden no encontrada' }) };
    }

    const items = await sql`
      SELECT product_id, product_name, quantity, unit_price, subtotal, original_unit_price
      FROM order_items
      WHERE order_id = ${orderId}
      ORDER BY created_at
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        order: {
          id: order.id,
          status: order.status,
          total_amount: order.total_amount,
          customer: {
            name: order.customer_name,
          },
          shipping: {
            city: order.shipping_city,
            region: order.shipping_region,
          },
          items: items.map((i) => ({
            product_id: i.product_id,
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            original_unit_price: i.original_unit_price,
            subtotal: i.subtotal,
          })),
          mp_payment_id: order.mp_payment_id,
          created_at: order.created_at,
          updated_at: order.updated_at,
        },
      }),
    };
  } catch (error) {
    console.error('get-order error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error al obtener la orden' }),
    };
  }
};
