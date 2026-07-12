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

  // Timing-safe comparison — prevents timing-oracle attacks
  const toBuffer = (s) => Buffer.from(String(s ?? ''));
  let emailBufA = toBuffer(email),
    emailBufB = toBuffer(adminEmail);
  let passBufA = toBuffer(password),
    passBufB = toBuffer(adminPassword);
  // Pad to same length so timingSafeEqual doesn't throw (length mismatch itself
  // reveals info, but we return the same error either way after the full check)
  const maxEmail = Math.max(emailBufA.length, emailBufB.length);
  const maxPass = Math.max(passBufA.length, passBufB.length);
  emailBufA = Buffer.concat([emailBufA, Buffer.alloc(maxEmail - emailBufA.length)]);
  emailBufB = Buffer.concat([emailBufB, Buffer.alloc(maxEmail - emailBufB.length)]);
  passBufA = Buffer.concat([passBufA, Buffer.alloc(maxPass - passBufA.length)]);
  passBufB = Buffer.concat([passBufB, Buffer.alloc(maxPass - passBufB.length)]);

  const emailOk = crypto.timingSafeEqual(emailBufA, emailBufB);
  const passOk = crypto.timingSafeEqual(passBufA, passBufB);

  if (!emailOk || !passOk) {
    // Artificial delay — slows brute-force attempts without revealing timing info
    await new Promise((r) => setTimeout(r, 500));
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
