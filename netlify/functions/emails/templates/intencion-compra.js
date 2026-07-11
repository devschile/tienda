const { emailHeader, emailFooter, emailWrap, itemsTable, totalRow } = require('../partials');

function intencionCompraHTML({ customerName, items, totalAmount, checkoutUrl, orderId }) {
  const rows = `
    ${emailHeader('Tu resumen de compra 🛒')}

    <tr><td style="background:#ffffff;padding:32px;">
      <p style="margin:0 0 8px;color:#2d1a12;font-size:16px;">Hola <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 28px;color:#7a6b63;font-size:14px;line-height:1.7;">
        Aquí está el resumen de lo que estás a punto de comprar.<br>
        Haz clic en el botón para completar tu pago de forma segura con MercadoPago.
      </p>

      ${itemsTable(items)}
      ${totalRow(totalAmount)}

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
        <tr><td style="text-align:center;">
          <a href="${checkoutUrl}"
             style="display:inline-block;background:linear-gradient(135deg,#b45b38,#85422b);color:#fefefe;text-decoration:none;padding:16px 44px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
            Ir a MercadoPago &rarr;
          </a>
        </td></tr>
      </table>

      <p style="margin:24px 0 0;color:#7a6b63;font-size:12px;text-align:center;line-height:1.6;">
        Este enlace es válido por 24 horas.<br>
        N° de orden: <code style="background:#f5ece4;padding:2px 6px;border-radius:4px;font-size:11px;">${orderId.substring(0, 8)}...</code>
      </p>
    </td></tr>

    ${emailFooter()}`;

  return emailWrap(rows);
}

function intencionCompraSubject() {
  return 'Tu resumen de compra en Tienda devsChile 🛒';
}

module.exports = { intencionCompraHTML, intencionCompraSubject };
