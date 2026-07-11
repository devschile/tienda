// Netlify Function: POST /.netlify/functions/admin-auth
// JWT con Node crypto nativo — sin dependencias externas ni requires de módulos hermanos
const crypto = require('crypto');

// ── JWT utils (inline para evitar problemas de resolución en functions:serve) ──

function signJWT(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 12 * 3600, // 12h
    }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

// ── Handler ────────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let email, password;
  try {
    ({ email, password } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.ADMIN_JWT_SECRET;

  if (!adminEmail || !adminPassword || !jwtSecret) {
    console.error('Faltan variables: ADMIN_EMAIL, ADMIN_PASSWORD o ADMIN_JWT_SECRET');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Servidor no configurado' }) };
  }

  if (email !== adminEmail || password !== adminPassword) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Credenciales incorrectas' }),
    };
  }

  const token = signJWT({ sub: adminEmail, name: 'Admin' }, jwtSecret);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ token }),
  };
};
