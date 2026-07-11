const FormData  = require('form-data');
const Mailgun   = require('mailgun.js');

async function send({ to, subject, html, text }) {
  const mailgun = new Mailgun(FormData);
  const mg      = mailgun.client({
    username: 'api',
    key:      process.env.MAILGUN_API_KEY,
    url:      process.env.MAILGUN_URL || 'https://api.mailgun.net',
  });

  const domain = process.env.MAILGUN_DOMAIN;
  const from   = process.env.FROM_EMAIL || `tienda@${domain}`;

  const result = await mg.messages.create(domain, {
    from,
    to: [to],
    subject,
    html,
    ...(text && { text }),
  });

  console.log('Email enviado via Mailgun:', result.id);
  return result;
}

module.exports = { send };
