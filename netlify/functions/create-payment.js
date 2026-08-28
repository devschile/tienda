// Netlify Function — Crea preferencia de MercadoPago y persiste la orden en NeonDB
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { neon } = require('@neondatabase/serverless');
const { normalizeCode, checkCode, computeDiscount, reasonMessage } = require('./lib/promo');
const { distributeDiscount } = require('./lib/discount');

// Parsea bundle_sizes (JSON '[3,4,6]') → array de enteros positivos. [] si inválido.
function parseBundleSizes(raw) {
  if (!raw) return [];
  let arr = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isInteger(n) && n > 0);
}

// Parsea bundle_item_ids (JSON '["prod_...","..."]') → array de ids string. [] si inválido.
function parseBundleItemIds(raw) {
  if (!raw) return [];
  let arr = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((v) => String(v)).filter(Boolean);
}

// ── Envío por tiers (XS | S | M | L) ──────────────────────────────────────────
// Cada producto se clasifica por el tamaño del paquete que cobra el courier.
// El costo de envío del pedido = costo del tier más grande presente (cuando se
// mezclan ítems, el más grande manda — no se suman costos). Esta lógica es la
// fuente autoritativa; el frontend solo estima con la misma regla.
const SHIPPING_TIERS = ['xs', 's', 'm', 'l'];
const SHIPPING_TIER_RANK = { xs: 0, s: 1, m: 2, l: 3 };

// Normaliza un shipping_tier de producto — solo valores conocidos, default 'xs'.
function sanitizeShippingTier(value) {
  return SHIPPING_TIERS.includes(value) ? value : 'xs';
}

// Tier más grande entre ítems que permiten envío. null si ninguno lo permite.
function maxShippingTier(items) {
  let max = null;
  for (const item of items) {
    if (item.shipping_enabled === false) continue;
    const tier = sanitizeShippingTier(item.shipping_tier);
    if (max === null || SHIPPING_TIER_RANK[tier] > SHIPPING_TIER_RANK[max]) max = tier;
  }
  return max;
}

// Costo absoluto de un tier. Si no está configurado (ausente o 0), cae al tier
// inmediatamente menor y finalmente al costo base (legacy shipping_cost).
function shippingCostForTier(tier, settings, baseCost) {
  const rank = SHIPPING_TIER_RANK[tier];
  for (let r = rank; r >= 0; r--) {
    const cost = parseInt(settings[`shipping_cost_${SHIPPING_TIERS[r]}`], 10) || 0;
    if (cost > 0) return cost;
  }
  return baseCost > 0 ? baseCost : 0;
}

const GOLD_PERK_TIMEOUT_MS = 4000;

async function fetchSoy(urlSuffix, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GOLD_PERK_TIMEOUT_MS);
  try {
    const url = `${(process.env.SOY_MEMBERS_API_URL || 'https://soy.devschile.cl').replace(/\/+$/, '')}${urlSuffix}`;
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) {
      console.error(`create-payment [gold-perk]: soy respondió HTTP ${res.status} en ${urlSuffix}`);
      try { await res.arrayBuffer(); } catch {}
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`create-payment [gold-perk]: consulta falló (${err.message})`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSoyGoldStatus(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken) return null;
  const res = await fetchSoy('/api/members/me', { Authorization: `Bearer ${accessToken}` });
  return res && typeof res === 'object' ? res : null;
}

exports.handler = async (event, context) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['https://tienda.devschile.cl', 'https://devschile-tienda.netlify.app'];

  const origin = event.headers.origin || event.headers.Origin || '';
  // Clientes no-browser (ej. la CLI de compra) nunca mandan Origin — un navegador real
  // sí lo manda siempre en requests cross-origin, así que su ausencia + este header
  // explícito identifica honestamente a un cliente first-party no-browser. Esto no
  // debilita la protección real: el chequeo de Origin nunca defendió de un cliente
  // no-browser (cualquiera puede spoofearlo con curl), solo de un browser real.
  const isCliClient = (event.headers['x-tienda-client'] || event.headers['X-Tienda-Client']) === 'cli';
  const isAllowedOrigin =
    allowedOrigins.includes(origin) || allowedOrigins.includes('*') || (!origin && isCliClient);

  const headers = {
    // origin puede venir vacío cuando es CLI o cuando ALLOWED_ORIGINS incluye '*'
    // sin Origin en el request — un string vacío no es un valor válido para este
    // header, así que en ese caso se refleja '*' en su lugar.
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin || '*' : 'null',
    'Access-Control-Allow-Headers': 'Content-Type, X-Tienda-Client',
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

    const sql = neon(databaseUrl);

    // ── Validar cantidades y separar el ítem de envío (no es un producto real) ─
    // El envío se deriva de customer.wantsDelivery, no de que el cliente incluya
    // (u omita) un ítem 'shipping' en el array — si no, alcanzaría con no mandar
    // ese ítem para pedir despacho gratis.
    const shippingRequested = customer.wantsDelivery === true;
    // Los ítems con `bundle` son packs (product_type='bundle') y se
    // procesan aparte como un solo ítem que el servidor descompone en líneas.
    const productItemsRequested = items.filter(
      (item) => item.productId !== 'shipping' && !item.bundle,
    );
    const bundleItemsRequested = items.filter((item) => item.bundle);

    const requestedQuantities = new Map();
    for (const item of productItemsRequested) {
      const productId = String(item.productId || '')
        .substring(0, 50)
        .replace(/[<>]/g, '');
      // Entero estricto — parseInt('1.5') truncaría en vez de rechazar.
      const qty = item.quantity;
      if (!productId || typeof qty !== 'number' || !Number.isInteger(qty) || qty <= 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Item inválido' }) };
      }
      // Acumula si el mismo producto aparece más de una vez, en vez de
      // quedarse solo con la última cantidad enviada.
      requestedQuantities.set(productId, (requestedQuantities.get(productId) ?? 0) + qty);
    }
    if (requestedQuantities.size === 0 && bundleItemsRequested.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'items requeridos' }) };
    }

    const rawPromoCode = normalizeCode(customer.promoCode);
    const parsedPercent = parseInt(process.env.MEMBER_DISCOUNT_PERCENT, 10);
    const goldPercent = Math.min(
      Math.max(Number.isNaN(parsedPercent) ? 10 : parsedPercent, 0),
      100,
    );
    // ── Precio, nombre, disponibilidad y stock SIEMPRE desde la base de datos —
    // nunca se confía en lo que manda el cliente (evita manipulación de precio) ─
    const productIds = [...requestedQuantities.keys()];
    const dbProducts = await sql`
      SELECT id, name, price, sale_price, on_sale, available, stock, product_type,
             shipping_enabled, shipping_tier
      FROM products
      WHERE id = ANY(${productIds}) AND archived = false
    `;
    const productsById = new Map(dbProducts.map((p) => [p.id, p]));

    const sanitizedItems = [];
    let hasAddon = false;
    // true si al menos un producto comprado admite envío — si ninguno lo admite
    // (ej. carrito de solo membresías digitales), el envío nunca se cobra,
    // aunque el cliente lo pida (nunca se confía solo en el checkbox del form).
    let anyItemAllowsShipping = false;
    for (const [productId, qty] of requestedQuantities) {
      const product = productsById.get(productId);
      if (!product) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Producto no encontrado: ${productId}` }),
        };
      }
      if (!product.available || product.stock < qty) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Sin stock suficiente: ${product.name}` }),
        };
      }
      if (product.product_type === 'addon') hasAddon = true;
      if (product.shipping_enabled !== false) anyItemAllowsShipping = true;
      const originalPrice = Number(product.price);
      const unitPrice = product.on_sale && product.sale_price != null ? Number(product.sale_price) : originalPrice;
      sanitizedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice,
        originalPrice,
        subtotal: qty * unitPrice,
        shipping_tier: product.shipping_tier,
        shipping_enabled: product.shipping_enabled,
      });
    }

    // ── Packs (product_type='bundle') ─────────────────────────────────────────
    // El cliente manda un solo ítem por pack con su selección; aquí se valida
    // contra la BD (incluido el roster curado del pack) y se descompone en líneas
    // por ítem elegido (incluida la sorpresa).
    for (const item of bundleItemsRequested) {
      const bundleId = String(item.productId || '')
        .substring(0, 50)
        .replace(/[<>]/g, '');
      if (!bundleId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Item inválido' }) };
      }

      const [bundle] = await sql`
        SELECT id, name, available, on_sale, sale_price, bundle_unit_price,
               bundle_sizes, bundle_allow_surprise, bundle_item_ids, product_type,
               shipping_enabled, shipping_tier
        FROM products WHERE id = ${bundleId} AND archived = false
      `;
      if (!bundle || bundle.product_type !== 'bundle') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Pack no encontrado: ${bundleId}` }),
        };
      }
      if (!bundle.available) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Pack no disponible' }) };
      }
      if (bundle.shipping_enabled !== false) anyItemAllowsShipping = true;

      // Precio por sticker definido por el pack (nunca por el cliente).
      const bundleUnitPrice =
        bundle.on_sale && bundle.sale_price != null
          ? Number(bundle.sale_price)
          : bundle.bundle_unit_price != null
            ? Number(bundle.bundle_unit_price)
            : null;
      if (!bundleUnitPrice || bundleUnitPrice <= 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Pack sin precio por sticker configurado' }),
        };
      }

      const sizes = parseBundleSizes(bundle.bundle_sizes);
      // Roster curado por el admin: solo estos ítems pueden elegirse en el pack.
      const memberIds = parseBundleItemIds(bundle.bundle_item_ids);
      if (memberIds.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Este pack no tiene ítems configurados' }),
        };
      }
      const size = item.bundle?.size;
      if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0 || !sizes.includes(size)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Tamaño de pack inválido' }) };
      }
      // Cantidad de packs idénticos en esta línea (el cliente agrupa packs iguales).
      const packCount = item.quantity;
      if (!Number.isInteger(packCount) || packCount <= 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Item inválido' }) };
      }

      // Candidatos elegidos explícitamente (permite duplicados vía quantity).
      const selectionQuantities = new Map();
      for (const sel of item.bundle?.items || []) {
        const sid = String(sel.productId || '').substring(0, 50).replace(/[<>]/g, '');
        const qty = sel.quantity;
        if (!sid || typeof qty !== 'number' || !Number.isInteger(qty) || qty <= 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Selección de pack inválida' }) };
        }
        selectionQuantities.set(sid, (selectionQuantities.get(sid) ?? 0) + qty);
      }
      const explicitCount = [...selectionQuantities.values()].reduce((s, q) => s + q, 0);
      const surpriseCount =
        Number.isInteger(item.bundle?.surpriseCount) &&
        (item.bundle?.surpriseCount ?? 0) >= 0
          ? item.bundle.surpriseCount
          : 0;

      // La selección explícita + sorpresas debe cubrir exactamente el tamaño.
      if (explicitCount + surpriseCount !== size) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'La selección del pack no cubre los stickers del tamaño elegido',
          }),
        };
      }
      if (surpriseCount > 0 && bundle.bundle_allow_surprise !== true) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Este pack no permite stickers sorpresa' }),
        };
      }

      // Validar ítems elegidos: dentro del roster del pack, elegibles, disponibles y con stock.
      const stickerIds = [...selectionQuantities.keys()];
      const stickerRows =
        stickerIds.length > 0
          ? await sql`
              SELECT id, name, available, stock, selectable_in_bundles, product_type
              FROM products WHERE id = ANY(${stickerIds}) AND archived = false
            `
          : [];
      const stickersById = new Map(stickerRows.map((s) => [s.id, s]));
      for (const [sid, qty] of selectionQuantities) {
        const sticker = stickersById.get(sid);
        if (!sticker || !memberIds.includes(sid) || sticker.selectable_in_bundles !== true) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: `Ítem no elegible en este pack: ${sid}` }) };
        }
        if (!sticker.available || sticker.stock < qty) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Sin stock suficiente: ${sticker.name}` }),
          };
        }
        if (sticker.product_type === 'addon') hasAddon = true;
      }

      // La sorpresa se completa con ítems del roster del pack que existan en stock al despachar.
      if (surpriseCount > 0) {
        const [anyItem] = await sql`
          SELECT 1 FROM products
          WHERE id = ANY(${memberIds})
            AND selectable_in_bundles = true AND available = true AND stock > 0 AND archived = false
          LIMIT 1
        `;
        if (!anyItem) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'No hay ítems en stock para completar el pack' }),
          };
        }
      }

      const packName = bundle.name;
      for (const [sid, qty] of selectionQuantities) {
        const sticker = stickersById.get(sid);
        sanitizedItems.push({
          productId: sticker.id,
          productName: `${packName} · ${sticker.name}`,
          quantity: qty * packCount,
          unitPrice: bundleUnitPrice,
          originalPrice: bundleUnitPrice,
          subtotal: qty * packCount * bundleUnitPrice,
          // El paquete físico es el pack (un sobre): su tier determina el envío.
          shipping_tier: bundle.shipping_tier,
          shipping_enabled: bundle.shipping_enabled,
        });
      }
      if (surpriseCount > 0) {
        sanitizedItems.push({
          productId: `${bundleId}@surpresa`,
          productName: `${packName} · Ítem sorpresa`,
          quantity: surpriseCount * packCount,
          unitPrice: bundleUnitPrice,
          originalPrice: bundleUnitPrice,
          subtotal: surpriseCount * packCount * bundleUnitPrice,
          shipping_tier: bundle.shipping_tier,
          shipping_enabled: bundle.shipping_enabled,
        });
      }
    }

    // ── Envío: costo siempre derivado de settings + tier del pedido, nunca del
    // cliente ──────────────────────────────────────────────────────────────────
    const settingsRows = await sql`
      SELECT key, value FROM settings
      WHERE key IN ('shipping_enabled', 'shipping_cost',
                    'shipping_cost_xs', 'shipping_cost_s', 'shipping_cost_m', 'shipping_cost_l',
                    'free_shipping_threshold')
    `;
    const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
    const shippingEnabled = settings.shipping_enabled === 'true';
    const baseShippingCost = parseInt(settings.shipping_cost, 10) || 0;
    const freeShippingThreshold = parseInt(settings.free_shipping_threshold, 10) || 0;
    const productsSubtotal = sanitizedItems.reduce((sum, i) => sum + i.subtotal, 0);

    // Tier más grande del pedido → costo absoluto de ese tier. Cuando se mezclan
    // ítems, el más grande manda (no se suman costos).
    const cartTier = maxShippingTier(sanitizedItems);
    const resolvedBaseCost =
      cartTier !== null ? shippingCostForTier(cartTier, settings, baseShippingCost) : 0;

    // ── Stickers add-on: solo en pedidos que ya cubran el envío ───────────────
    // Un sticker no debe ser el único motivo del pedido si el subtotal no cubre
    // el costo de envío (del tier que manda en este carrito). El pack de
    // stickers es su vía explícita de compra.
    if (hasAddon && shippingEnabled && resolvedBaseCost > 0 && productsSubtotal < resolvedBaseCost) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Los stickers solo pueden añadirse a un pedido que cubra el costo de envío',
        }),
      };
    }

    // ── Código de descuento (promo) ──────────────────────────────────────────
    // El servidor es autoritativo: valida el código contra la BD y recalcula el
    // descuento desde el subtotal derivado de productos reales. Nunca confía en
    // el monto que el cliente haya visto en el checkout.
    // CLP ahorrados (reporting / emails). discount_code/discount_type se guardan
    // solo cuando el código realmente generó un ahorro.
    let discountAmount = 0;
    let discountCode = null;
    let discountType = null;

    if (!rawPromoCode) {
      const memberStatus =
        goldPercent > 0 ? await fetchSoyGoldStatus(customer.soyAccessToken) : null;
      if (memberStatus?.isGold === true && productsSubtotal > 0) {
        const amount = Math.min(
          Math.round((productsSubtotal * goldPercent) / 100),
          productsSubtotal - 1,
        );
        if (amount > 0) {
          discountAmount = amount;
          discountCode = 'GOLD';
          discountType = 'percent';
        }
      }
    }

    if (rawPromoCode) {
      const [promoRow] = await sql`
        SELECT code, discount_type, discount_value, min_subtotal, max_discount,
               starts_at, expires_at, max_uses, uses_count, active, archived
        FROM promo_codes WHERE code = ${rawPromoCode}
      `;
      const base = checkCode(promoRow, { subtotal: productsSubtotal });
      if (!base.ok) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: reasonMessage(base.reason) }) };
      }
      if (promoRow.discount_type === 'shipping') {
        // Envío gratis: solo anula el costo de envío (si el pedido lo tendría);
        // no toca el subtotal de productos. Si el código no puede generar ahorro
        // (sin envío a domicilio, o envío ya gratis), se rechaza con el motivo
        // en vez de descartarlo en silencio.
        const rawShipping =
          shippingEnabled && resolvedBaseCost > 0
            ? freeShippingThreshold > 0 && productsSubtotal >= freeShippingThreshold
              ? 0
              : resolvedBaseCost
            : 0;
        const wouldChargeShipping = shippingRequested && anyItemAllowsShipping && rawShipping > 0;
        if (!wouldChargeShipping) {
          const reason =
            !shippingRequested || !anyItemAllowsShipping ? 'no_delivery' : 'already_free_shipping';
          return { statusCode: 400, headers, body: JSON.stringify({ error: reasonMessage(reason) }) };
        }
        discountAmount = rawShipping;
        discountCode = promoRow.code;
        discountType = 'shipping';
      } else {
        const amount = computeDiscount(promoRow, productsSubtotal);
        if (amount > 0) {
          discountAmount = amount;
          discountCode = promoRow.code;
          discountType = promoRow.discount_type;
        }
      }
    }

    let chargedShippingTier = null;
    if (shippingRequested && anyItemAllowsShipping) {
      const effectiveShipping =
        discountType === 'shipping'
          ? 0 // envío gratis por código de descuento
          : shippingEnabled && resolvedBaseCost > 0
            ? freeShippingThreshold > 0 && productsSubtotal >= freeShippingThreshold
              ? 0
              : resolvedBaseCost
            : 0;

      if (effectiveShipping > 0) {
        chargedShippingTier = cartTier !== null ? cartTier.toUpperCase() : null;
        sanitizedItems.push({
          productId: 'shipping',
          // El tier en el nombre hace auditable en admin/emails qué nivel se cobró.
          productName: chargedShippingTier
            ? `Envío a domicilio (${chargedShippingTier})`
            : 'Envío a domicilio',
          quantity: 1,
          unitPrice: effectiveShipping,
          originalPrice: effectiveShipping,
          subtotal: effectiveShipping,
        });
      }
    }

    // total = subtotal de productos − descuento (salvo 'shipping', que anula el
    // envío sin restar del subtotal) + envío efectivo.
    const shippingTotal = sanitizedItems.reduce(
      (sum, i) => sum + (i.productId === 'shipping' ? i.subtotal : 0),
      0,
    );
    const totalAmount =
      productsSubtotal - (discountType === 'shipping' ? 0 : discountAmount) + shippingTotal;
    if (totalAmount <= 0 || totalAmount > 5000000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Total fuera de rango' }) };
    }

    // URL base según entorno
    // process.env.URL es seteado automáticamente por Netlify (URL del deploy actual)
    const siteUrl = process.env.URL || process.env.SITE_URL || 'https://tienda.devschile.cl';

    // ── 1. Persistir la orden como PENDING en Neon ─────────────────────────

    const promoApplied =
      discountCode && discountAmount > 0 ? { code: discountCode, amount: discountAmount, type: discountType } : null;

    const [order] = await sql`
      INSERT INTO orders (
        status, total_amount,
        customer_name, customer_email,
        shipping_address, shipping_city, shipping_region, shipping_zip,
        wants_newsletter, channel,
        discount_code, discount_type, discount_amount
      )
      VALUES (
        'pending', ${totalAmount},
        ${String(customer.name).substring(0, 120)},
        ${String(customer.email).substring(0, 200).toLowerCase()},
        ${customer.address ? String(customer.address).substring(0, 200) : null},
        ${customer.city ? String(customer.city).substring(0, 100) : null},
        ${customer.region ? String(customer.region).substring(0, 100) : null},
        ${customer.zip ? String(customer.zip).substring(0, 20) : null},
        ${customer.wantsNewsletter === true},
        ${isCliClient ? 'cli' : 'web'},
        ${discountCode},
        ${discountType},
        ${discountAmount}
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

    // auto_return exige que back_urls.success sea una URL pública HTTPS — con
    // siteUrl=localhost (desarrollo local) MP rechaza la preferencia entera con
    // un error engañoso ("auto_return invalid. back_url.success must be defined").
    // Igual que el "Link de pago" de MP (que no fuerza redirect automático),
    // solo pedimos auto_return cuando de verdad podemos volver a un sitio público.
    const isPublicSiteUrl =
      /^https:\/\//.test(siteUrl) && !/^https:\/\/(localhost|127\.0\.0\.1|\[?::1\]?)(:|\/|$)/.test(siteUrl);

    const preferenceBody = {
      // Aplicar el descuento sobre las líneas de producto (distribución exacta);
      // el envío se mantiene íntegro. Los precios en order_items quedan sin
      // descuento — el descuento vive en orders.discount_amount.
      items: [
        ...distributeDiscount(
          sanitizedItems
            .filter((i) => i.productId !== 'shipping')
            .map((item) => ({
              id: item.productId || `prod-${Date.now()}`,
              title: item.productName,
              description: item.productName,
              unit_price: item.unitPrice,
              currency_id: 'CLP',
              quantity: item.quantity,
              category_id: 'handmade',
            })),
          discountType === 'shipping' ? 0 : discountAmount,
        ),
        ...sanitizedItems
          .filter((i) => i.productId === 'shipping')
          .map((item) => ({
            id: 'shipping',
            title: item.productName,
            description: item.productName,
            unit_price: item.unitPrice,
            currency_id: 'CLP',
            quantity: 1,
            category_id: 'handmade',
          })),
      ],
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
        success: `${siteUrl}/success?order_id=${order.id}${isCliClient ? '&cli=1' : ''}`,
        failure: `${siteUrl}/failure?order_id=${order.id}${isCliClient ? '&cli=1' : ''}`,
        pending: `${siteUrl}/pending?order_id=${order.id}${isCliClient ? '&cli=1' : ''}`,
      },
      ...(isPublicSiteUrl ? { auto_return: 'approved' } : {}),
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
        promo: promoApplied,
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
          promo: promoApplied,
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
        discount: discountCode === 'GOLD' ? null : promoApplied,
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
