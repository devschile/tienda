// Partials reutilizables para los templates de email
// Logo y colores consistentes con el diseño del sitio

const LOGO_URL = 'https://devschile-tienda.netlify.app/apple-touch-icon.png';
// En producción cambiar a: https://tienda.devschile.cl/apple-touch-icon.png

/**
 * Header con logo del Huemul y gradiente de marca.
 * Gradiente: brand-primary #b45b38 → brand-secondary #85422b (igual al sitio)
 */
function emailHeader(title, subtitle = 'Tienda devsChile™') {
  return `
    <tr><td style="background:linear-gradient(135deg,#b45b38,#85422b);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
      <img src="${LOGO_URL}" alt="devsChile™" width="56" height="56"
           style="background:#f5f5f5;display:block;margin:0 auto 16px;border-radius:50%;border:3px solid rgba(255,255,255,0.3);">
      <p style="margin:0 0 6px;color:rgba(255,255,255,0.75);font-size:11px;text-transform:uppercase;letter-spacing:2px;">${subtitle}</p>
      <h1 style="margin:0;color:#fefefe;font-size:22px;font-weight:700;line-height:1.3;">${title}</h1>
    </td></tr>`;
}

/**
 * Footer estándar con link al sitio.
 */
function emailFooter(siteUrl = 'https://tienda.devschile.cl') {
  return `
    <tr><td style="background:#f5ece4;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
      <p style="margin:0;color:#7a6b63;font-size:12px;">
        © ${new Date().getFullYear()} Tienda devsChile™ &nbsp;·&nbsp;
        <a href="${siteUrl}" style="color:#b45b38;text-decoration:none;">${siteUrl.replace('https://', '')}</a>
      </p>
    </td></tr>`;
}

/**
 * Wrapper externo del email (fondo arena, contenedor centrado).
 */
function emailWrap(innerRows) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f5ece4;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5ece4;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(45,26,18,0.10);">
        ${innerRows}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Fila de items del carrito.
 */
function itemsTable(items, nameKey = 'productName') {
  const formatPrice = (n) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(n);

  const rows = items
    .map((item) => {
      const name = item[nameKey] || item.productName || item.product_name || '';
      const paid = item.unit_price || item.unitPrice || 0;
      const original = item.original_unit_price || item.originalPrice || paid;
      const subtotal = item.subtotal || paid * item.quantity;
      const hasDiscount = original > paid;

      const priceCell = hasDiscount
        ? `<span style="text-decoration:line-through;color:#9ca3af;font-size:11px;display:block;">${formatPrice(original * item.quantity)}</span>
         <span style="font-weight:700;color:#b45b38">${formatPrice(subtotal)}</span>
         <span style="display:inline-block;background:#fbbf24;color:#92400e;font-size:10px;font-weight:700;padding:1px 5px;border-radius:20px;margin-left:2px;">⚡ Oferta</span>`
        : `<span style="font-weight:700;">${formatPrice(subtotal)}</span>`;

      return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;color:#2d1a12;font-size:14px;">${name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;color:#7a6b63;font-size:14px;text-align:center;white-space:nowrap;">×${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;color:#2d1a12;font-size:14px;text-align:right;white-space:nowrap;">${priceCell}</td>
      </tr>`;
    })
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr>
          <th style="text-align:left;color:#7a6b63;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:2px solid #f0ebe5;">Producto</th>
          <th style="text-align:center;color:#7a6b63;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:2px solid #f0ebe5;">Cant.</th>
          <th style="text-align:right;color:#7a6b63;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:2px solid #f0ebe5;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/**
 * Fila de total resaltado.
 */
function totalRow(amount) {
  const formatPrice = (n) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(n);

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5ece4;border-radius:10px;padding:14px 20px;margin-top:20px;">
      <tr>
        <td style="color:#2d1a12;font-size:15px;font-weight:700;">Total</td>
        <td style="text-align:right;color:#b45b38;font-size:22px;font-weight:700;">${formatPrice(amount)}</td>
      </tr>
    </table>`;
}

/**
 * Tabla de items con envío separado del total.
 * Detecta el item de envío por product_id === 'shipping' o productName.
 * Muestra: productos → subtotal (si hay envío) → fila envío → total.
 */
function orderBreakdown(items, totalAmount, nameKey = 'productName') {
  const fmt = (n) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(n);

  const isShipping = (item) =>
    (item.productId || item.product_id) === 'shipping' ||
    (item.productName || item.product_name || '') === 'Envío a domicilio';

  const productItems = items.filter((i) => !isShipping(i));
  const shippingItem = items.find(isShipping);
  const shippingCost = shippingItem
    ? shippingItem.subtotal ||
      (shippingItem.unit_price || shippingItem.unitPrice || 0) * (shippingItem.quantity || 1)
    : 0;

  let html = itemsTable(productItems, nameKey);

  if (shippingItem && shippingCost > 0) {
    const subtotal = totalAmount - shippingCost;
    html += `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
      <tr>
        <td colspan="2" style="padding:8px 0;border-top:1px solid #f0ebe5;color:#7a6b63;font-size:13px;">Subtotal productos</td>
        <td style="padding:8px 0;border-top:1px solid #f0ebe5;color:#2d1a12;font-size:13px;text-align:right;font-weight:600;white-space:nowrap;">${fmt(subtotal)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:6px 0 10px;color:#7a6b63;font-size:13px;">🚚 Envío a domicilio</td>
        <td style="padding:6px 0 10px;color:#2d1a12;font-size:13px;text-align:right;font-weight:600;white-space:nowrap;">${fmt(shippingCost)}</td>
      </tr>
    </table>`;
  }

  html += totalRow(totalAmount);
  return html;
}

module.exports = {
  emailHeader,
  emailFooter,
  emailWrap,
  itemsTable,
  totalRow,
  orderBreakdown,
  LOGO_URL,
};
