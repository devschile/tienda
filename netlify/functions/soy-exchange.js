const { soyCorsGate, requestSoy, soyErrorMessage, isSoySession } = require('./lib/soy');

exports.handler = async (event) => {
  const { headers, isAllowedOrigin } = soyCorsGate(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  // Simple POST requests can bypass CORS preflight, so enforce the origin server-side.
  if (!isAllowedOrigin) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Origin not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'body inválido' }) };
  }
  const { code, redirectUri } = payload;
  if (typeof code !== 'string' || !code || typeof redirectUri !== 'string' || !redirectUri) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'code y redirectUri requeridos' }),
    };
  }

  const secret = process.env.SOY_CLIENT_SECRET;
  if (!secret) {
    console.error('soy-exchange: SOY_CLIENT_SECRET no configurada');
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'soy no configurado' }) };
  }

  try {
    const { res, json } = await requestSoy('/api/auth/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ clientId: 'tienda', code, redirectUri }),
    });
    if (!res.ok) {
      const message = soyErrorMessage(json, `HTTP ${res.status}`);
      console.error(`soy-exchange: exchange respondió HTTP ${res.status} (${message})`);
      const publicMessage =
        res.status === 401
          ? 'Código expirado o ya utilizado'
          : 'Soy no pudo completar la verificación';
      return {
        statusCode: res.status === 401 ? 401 : 502,
        headers,
        body: JSON.stringify({ error: 'soy-exchange falló', message: publicMessage }),
      };
    }
    if (!isSoySession(json)) {
      const message = 'Respuesta inválida de auth/exchange';
      console.error(`soy-exchange: ${message}`);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: 'soy-exchange falló',
          message: 'Soy devolvió una respuesta inválida',
        }),
      };
    }
    return { statusCode: 200, headers, body: JSON.stringify(json) };
  } catch (err) {
    const message = soyErrorMessage(err, 'Error consultando soy');
    console.error(`soy-exchange: consulta falló (${message})`);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: 'soy-exchange falló',
        message: 'No se pudo contactar a soy',
      }),
    };
  }
};
