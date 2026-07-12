const { emailWrap, itemsTable, totalRow, LOGO_URL } = require('../partials');

// Email de admin con diseño oscuro para distinguirlo de los emails al cliente

const STATUS_LABELS = {
  pending: { label: 'Intención de compra', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  approved: { label: '✅ Pago confirmado', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  pending_transfer: {
    label: '⏳ Transferencia pendiente',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fcd34d',
  },
  rejected: { label: '❌ Pago rechazado', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
};

function formatPrice(n) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);
}

function nuevaOrdenAdminHTML({
  status,
  orderId,
  customerName,
  customerEmail,
  shipping,
  items,
  totalAmount,
}) {
  const cfg = STATUS_LABELS[status] || STATUS_LABELS.pending;

  const shippingHTML =
    shipping && (shipping.address || shipping.city)
      ? `
    <tr><td colspan="2" style="padding-top:14px;">
      <p style="margin:0 0 3px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Dirección de envío</p>
      <p style="margin:0;color:#f9fafb;font-size:13px;">
        ${[shipping.address, shipping.city, shipping.region, shipping.zip].filter(Boolean).join(', ')}
      </p>
    </td></tr>`
      : '';

  const rows = `
    <!-- Header oscuro — se distingue visualmente de emails al cliente -->
    <tr><td style="background:linear-gradient(135deg,#1a0f09,#2d1a12);border-radius:16px 16px 0 0;padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <img src="${LOGO_URL}" alt="devsChile™" width="36" height="36"
                 style="background:#f5f5f5;display:inline-block;vertical-align:middle;border-radius:50%;border:2px solid rgba(212,163,115,0.4);margin-right:10px;">
            <span style="color:#d4a373;font-size:11px;text-transform:uppercase;letter-spacing:2px;vertical-align:middle;">Admin · Tienda devsChile™</span>
          </td>
        </tr>
        <tr><td style="padding-top:12px;">
          <h1 style="margin:0;color:#fefefe;font-size:20px;font-weight:700;">Nueva orden recibida</h1>
        </td></tr>
      </table>
    </td></tr>

    <!-- Status -->
    <tr><td style="background:${cfg.bg};padding:12px 32px;border-left:4px solid ${cfg.border};">
      <p style="margin:0;color:${cfg.color};font-size:13px;font-weight:700;">${cfg.label}</p>
    </td></tr>

    <!-- Datos del cliente -->
    <tr><td style="background:#111827;padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;vertical-align:top;padding-bottom:12px;">
            <p style="margin:0 0 3px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Comprador</p>
            <p style="margin:0;color:#f9fafb;font-size:14px;font-weight:600;">${customerName}</p>
            <p style="margin:3px 0 0;color:#b45b38;font-size:13px;">${customerEmail}</p>
          </td>
          <td style="width:50%;vertical-align:top;padding-bottom:12px;">
            <p style="margin:0 0 3px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;">N° Orden</p>
            <p style="margin:0;color:#f9fafb;font-size:12px;font-family:monospace;">${orderId.substring(0, 8)}...</p>
          </td>
        </tr>
        ${shippingHTML}
      </table>
    </td></tr>

    <!-- Productos -->
    <tr><td style="background:#1f2937;padding:24px 32px;">
      <p style="margin:0 0 14px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #374151;padding-bottom:10px;">Productos</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${items
          .filter(
            (item) =>
              (item.productId || item.product_id) !== 'shipping' &&
              (item.productName || item.product_name) !== 'Envío a domicilio',
          )
          .map((item) => {
            const name = item.product_name || item.productName || '';
            const subtotal = item.subtotal || (item.unit_price || item.unitPrice) * item.quantity;
            return `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #374151;color:#e5e7eb;font-size:13px;">${name}</td>
            <td style="padding:8px 0;border-bottom:1px solid #374151;color:#9ca3af;font-size:13px;text-align:center;">×${item.quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #374151;color:#e5e7eb;font-size:13px;text-align:right;font-weight:700;">${formatPrice(subtotal)}</td>
          </tr>`;
          })
          .join('')}
      </table>
      ${(() => {
        const shippingItem = items.find(
          (i) =>
            (i.productId || i.product_id) === 'shipping' ||
            (i.productName || i.product_name) === 'Envío a domicilio',
        );
        if (!shippingItem) return '';
        const shippingCost =
          shippingItem.subtotal || shippingItem.unit_price || shippingItem.unitPrice || 0;
        const subtotal = totalAmount - shippingCost;
        return `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
          <tr>
            <td colspan="2" style="padding:7px 0;color:#9ca3af;font-size:12px;">Subtotal productos</td>
            <td style="padding:7px 0;color:#e5e7eb;font-size:13px;text-align:right;">${formatPrice(subtotal)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:5px 0 10px;color:#9ca3af;font-size:12px;">🚚 Envío a domicilio</td>
            <td style="padding:5px 0 10px;color:#e5e7eb;font-size:13px;text-align:right;">${formatPrice(shippingCost)}</td>
          </tr>
        </table>`;
      })()}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;background:#0f172a;border-radius:8px;padding:12px 16px;">
        <tr>
          <td style="color:#e5e7eb;font-size:14px;font-weight:700;">Total</td>
          <td style="text-align:right;color:#b45b38;font-size:20px;font-weight:700;">${formatPrice(totalAmount)}</td>
        </tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#111827;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
      <p style="margin:0;color:#4b5563;font-size:11px;">Tienda devsChile™ — Panel Admin</p>
    </td></tr>`;

  return emailWrap(rows);
}

function nuevaOrdenAdminSubject({ status, customerName, totalAmount }) {
  const formatPrice = (n) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(n);

  const labels = {
    pending: `🕐 Nueva intención — ${customerName} — ${formatPrice(totalAmount)}`,
    approved: `✅ Pago confirmado — ${customerName} — ${formatPrice(totalAmount)}`,
    pending_transfer: `⏳ Transferencia pendiente — ${customerName} — ${formatPrice(totalAmount)}`,
    rejected: `❌ Pago rechazado — ${customerName}`,
  };
  return labels[status] || `Nueva orden — ${customerName}`;
}

module.exports = { nuevaOrdenAdminHTML, nuevaOrdenAdminSubject };
