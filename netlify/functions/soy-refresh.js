const { soyCorsGate, requestSoy, soyErrorMessage, isSoyMemberSnapshot } = require('./lib/soy');

exports.handler = async (event) => {
  const { headers, isAllowedOrigin } = soyCorsGate(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!isAllowedOrigin) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Origin not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'body inválido' }) };
  }
  const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : '';
  if (!accessToken) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'accessToken requerido' }) };
  }

  try {
    const { res, json } = await requestSoy('/api/members/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 401) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'sesión expirada' }) };
    }
    if (!res.ok) {
      const message = soyErrorMessage(json, `HTTP ${res.status}`);
      console.error(`soy-refresh: members/me respondió HTTP ${res.status} (${message})`);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: 'soy-refresh falló',
          message: 'Soy no pudo confirmar la membresía',
        }),
      };
    }
    if (!isSoyMemberSnapshot(json)) {
      const message = 'Respuesta inválida de members/me';
      console.error(`soy-refresh: ${message}`);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: 'soy-refresh falló',
          message: 'Soy devolvió una respuesta inválida',
        }),
      };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        member: json.member,
        isGold: json.isGold,
        paidThrough: json.paidThrough,
      }),
    };
  } catch (err) {
    const message = soyErrorMessage(err, 'Error consultando soy');
    console.error(`soy-refresh: consulta falló (${message})`);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: 'soy-refresh falló',
        message: 'No se pudo contactar a soy',
      }),
    };
  }
};
