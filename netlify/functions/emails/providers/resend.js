const { Resend } = require('resend');

async function send({ to, subject, html, text }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from   = process.env.FROM_EMAIL || 'tienda@andalaosa.cl';

  const result = await resend.emails.send({ from, to, subject, html, text });
  console.log('Email enviado via Resend:', result.data?.id);
  return result;
}

module.exports = { send };
