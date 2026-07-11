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
      const subtotal = item.subtotal || (item.unitPrice || item.unit_price) * item.quantity;
      return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;color:#2d1a12;font-size:14px;">${name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;color:#7a6b63;font-size:14px;text-align:center;white-space:nowrap;">×${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;color:#2d1a12;font-size:14px;text-align:right;font-weight:700;white-space:nowrap;">${formatPrice(subtotal)}</td>
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

module.exports = { emailHeader, emailFooter, emailWrap, itemsTable, totalRow, LOGO_URL };
