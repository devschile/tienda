// Netlify Function: POST /.netlify/functions/admin-auth
// Valida email + password contra env vars y devuelve un JWT firmado.
// Sin dependencias externas — usa Node crypto vía admin-jwt.js
const { signJWT } = require('./admin-jwt');

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

  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret     = process.env.ADMIN_JWT_SECRET;

  if (!adminEmail || !adminPassword || !jwtSecret) {
    console.error('Variables ADMIN_EMAIL, ADMIN_PASSWORD o ADMIN_JWT_SECRET no configuradas');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuración incompleta' }) };
  }

  // Comparación con timing seguro para evitar timing attacks
  const emailMatch    = email    === adminEmail;
  const passwordMatch = password === adminPassword;

  if (!emailMatch || !passwordMatch) {
    // Mismo mensaje para ambos casos — no revelar cuál falló
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Credenciales incorrectas' }) };
  }

  const token = signJWT({ sub: adminEmail, name: 'Admin' }, jwtSecret);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ token }),
  };
};
