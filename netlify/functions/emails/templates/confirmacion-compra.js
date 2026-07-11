const { emailHeader, emailFooter, emailWrap, itemsTable, totalRow } = require('../partials');

const STATUS_CONFIG = {
  approved: {
    title: '¡Pago confirmado! 🎉',
    message:
      'Tu pago fue procesado exitosamente. Nos contactaremos pronto para coordinar el envío de tu pedido.',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#86efac',
  },
  pending_transfer: {
    title: 'Pago en proceso ⏳',
    message:
      'Tu pago está siendo procesado. Las transferencias bancarias pueden tardar hasta 24 horas en confirmarse. Te avisaremos en cuanto se acredite.',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fcd34d',
  },
  rejected: {
    title: 'Pago no completado ❌',
    message:
      'Tu pago no pudo procesarse. Puedes intentarlo nuevamente cuando quieras — tu historial de compra sigue disponible.',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
  },
};

function confirmacionCompraHTML({ customerName, status, items, totalAmount, orderId, siteUrl }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.rejected;
  const url = siteUrl || 'https://tienda.devschile.cl';

  const retryBtn =
    status === 'rejected'
      ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="text-align:center;">
        <a href="${url}"
           style="display:inline-block;background:linear-gradient(135deg,#b45b38,#85422b);color:#fefefe;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700;">
          Volver a la tienda
        </a>
      </td></tr>
    </table>`
      : '';

  const rows = `
    ${emailHeader(cfg.title)}

    <!-- Status banner -->
    <tr><td style="background:${cfg.bg};padding:16px 32px;border-left:4px solid ${cfg.border};">
      <p style="margin:0;color:${cfg.color};font-size:14px;line-height:1.7;">${cfg.message}</p>
    </td></tr>

    <tr><td style="background:#ffffff;padding:32px;">
      <p style="margin:0 0 28px;color:#2d1a12;font-size:16px;">Hola <strong>${customerName}</strong>,</p>

      ${itemsTable(items, 'product_name')}
      ${totalRow(totalAmount)}

      ${retryBtn}

      <p style="margin:24px 0 0;color:#7a6b63;font-size:12px;line-height:1.6;">
        N° de orden: <code style="background:#f5ece4;padding:2px 6px;border-radius:4px;font-size:11px;">${orderId.substring(0, 8)}...</code>
      </p>
    </td></tr>

    ${emailFooter(url)}`;

  return emailWrap(rows);
}

function confirmacionCompraSubject(status) {
  const subjects = {
    approved: '¡Tu pedido en Tienda devsChile está confirmado! 🎉',
    pending_transfer: 'Tu pago está siendo procesado ⏳ — Tienda devsChile',
    rejected: 'Tu pago no pudo completarse — Tienda devsChile',
  };
  return subjects[status] || 'Actualización de tu pedido — Tienda devsChile';
}

module.exports = { confirmacionCompraHTML, confirmacionCompraSubject };
