// Abstracción de envío de email — delega a Resend o Mailgun según EMAIL_PROVIDER.
// El webhook y create-payment solo llaman sendEmail() sin saber qué proveedor hay.

const resendProvider   = require('./providers/resend');
const mailgunProvider  = require('./providers/mailgun');

/**
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
async function sendEmail({ to, subject, html, text }) {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();

  if (!process.env.RESEND_API_KEY && !process.env.MAILGUN_API_KEY) {
    console.warn('Email: no hay credenciales configuradas. Saltando envío.');
    return { skipped: true };
  }

  try {
    if (provider === 'mailgun') {
      return await mailgunProvider.send({ to, subject, html, text });
    }
    return await resendProvider.send({ to, subject, html, text });
  } catch (error) {
    // El email es best-effort: si falla no bloquea el flujo de pago
    console.error('Error enviando email:', error.message);
    return { error: error.message };
  }
}

module.exports = { sendEmail };
