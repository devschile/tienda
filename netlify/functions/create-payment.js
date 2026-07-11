// Netlify Function — Crea preferencia de MercadoPago y persiste la orden en NeonDB
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['https://tienda.devschile.cl', 'https://devschile-tienda.netlify.app'];

  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!isAllowedOrigin) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Origin not allowed' }) };
  }

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const databaseUrl = process.env.NEON_DATABASE_URL;

    if (!accessToken) throw new Error('Payment service unavailable');
    if (!databaseUrl) throw new Error('Database unavailable');

    // Parsear body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    // items: [{ productId, productName, quantity, unitPrice }]
    // customer: { name, email, address, city, region, zip }
    const { items, customer } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'items requeridos' }) };
    }
    if (!customer?.name || !customer?.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'customer.name y customer.email requeridos' }),
      };
    }

    // Validar y sanitizar items
    const sanitizedItems = items.map((item) => {
      const qty = parseInt(item.quantity, 10);
      const price = parseInt(item.unitPrice, 10);
      if (!item.productName || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
        throw new Error(`Item inválido: ${JSON.stringify(item)}`);
      }
      return {
        productId: String(item.productId || '')
          .substring(0, 50)
          .replace(/[<>]/g, ''),
        productName: String(item.productName).substring(0, 100).replace(/[<>]/g, ''),
        quantity: qty,
        unitPrice: price,
        originalPrice: item.originalPrice ? parseInt(item.originalPrice, 10) || price : price,
        subtotal: qty * price,
      };
    });

    const totalAmount = sanitizedItems.reduce((sum, i) => sum + i.subtotal, 0);
    if (totalAmount <= 0 || totalAmount > 5000000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Total fuera de rango' }) };
    }

    // URL base según entorno
    // process.env.URL es seteado automáticamente por Netlify (URL del deploy actual)
    const siteUrl = process.env.URL || process.env.SITE_URL || 'https://tienda.devschile.cl';

    // ── 1. Persistir la orden como PENDING en Neon ─────────────────────────
    const sql = neon(databaseUrl);

    const [order] = await sql`
      INSERT INTO orders (
        status, total_amount,
        customer_name, customer_email,
        shipping_address, shipping_city, shipping_region, shipping_zip,
        wants_newsletter
      )
      VALUES (
        'pending', ${totalAmount},
        ${String(customer.name).substring(0, 120)},
        ${String(customer.email).substring(0, 200).toLowerCase()},
        ${customer.address ? String(customer.address).substring(0, 200) : null},
        ${customer.city ? String(customer.city).substring(0, 100) : null},
        ${customer.region ? String(customer.region).substring(0, 100) : null},
        ${customer.zip ? String(customer.zip).substring(0, 20) : null},
        ${customer.wantsNewsletter === true}
      )
      RETURNING id
    `;

    // Insertar items de la orden
    for (const item of sanitizedItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, original_unit_price)
        VALUES (${order.id}, ${item.productId}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, ${item.originalPrice})
      `;
    }

    // ── 2. Crear preferencia en MercadoPago v2 ─────────────────────────────
    const client = new MercadoPagoConfig({ accessToken });

    const preferenceBody = {
      items: sanitizedItems.map((item) => ({
        id: item.productId || `prod-${Date.now()}`,
        title: item.productName,
        description: item.productName,
        unit_price: item.unitPrice,
        currency_id: 'CLP',
        quantity: item.quantity,
        category_id: 'handmade',
      })),
      payer: {
        name: customer.name,
        // No enviamos email del payer: si coincide con una cuenta real de MP
        // en modo sandbox lanza 'Una de las partes es de prueba'.
        // MP pre-rellena el email cuando el usuario inicia sesión en el checkout.
      },
      payment_methods: {
        installments: 1,
      },
      back_urls: {
        success: `${siteUrl}/success?order_id=${order.id}`,
        failure: `${siteUrl}/failure?order_id=${order.id}`,
        pending: `${siteUrl}/pending?order_id=${order.id}`,
      },
      auto_return: 'approved',
      external_reference: order.id, // clave para identificar la orden en el webhook
      notification_url: `${siteUrl}/.netlify/functions/mercadopago-webhook`,
    };

    const preference = await new Preference(client).create({ body: preferenceBody });

    // Guardar el preference_id en la orden
    await sql`
      UPDATE orders
      SET mp_preference_id = ${preference.id}
      WHERE id = ${order.id}
    `;

    // ── 3. Email de intención de compra ────────────────────────────────────
    const { sendEmail } = require('./emails');
    const {
      intencionCompraHTML,
      intencionCompraSubject,
    } = require('./emails/templates/intencion-compra');

    await sendEmail({
      to: customer.email,
      subject: intencionCompraSubject(),
      html: intencionCompraHTML({
        customerName: customer.name,
        items: sanitizedItems,
        totalAmount,
        checkoutUrl: preference.init_point,
        orderId: order.id,
      }),
    });

    // Email al admin — intención de compra
    if (process.env.ADMIN_EMAIL) {
      const {
        nuevaOrdenAdminHTML,
        nuevaOrdenAdminSubject,
      } = require('./emails/templates/nueva-orden-admin');
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: nuevaOrdenAdminSubject({
          status: 'pending',
          customerName: customer.name,
          totalAmount,
        }),
        html: nuevaOrdenAdminHTML({
          status: 'pending',
          orderId: order.id,
          customerName: customer.name,
          customerEmail: customer.email,
          shipping: {
            address: customer.address,
            city: customer.city,
            region: customer.region,
            zip: customer.zip,
          },
          items: sanitizedItems.map((i) => ({ ...i, subtotal: i.subtotal })),
          totalAmount,
          siteUrl,
        }),
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order_id: order.id,
        checkout_url: preference.init_point,
        preference_id: preference.id,
      }),
    };
  } catch (error) {
    console.error('Error creating payment:', error.message);
    const isDev = process.env.NODE_ENV === 'development';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error al procesar el pago. Intenta nuevamente.',
        ...(isDev && { details: error.message }),
      }),
    };
  }
};
