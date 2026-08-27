const SOY_TIMEOUT_MS = 4000;

const DEFAULT_ALLOWED_ORIGINS = [
  'https://tienda.devschile.cl',
  'https://devschile-tienda.netlify.app',
];

function soyBaseUrl() {
  return (process.env.SOY_MEMBERS_API_URL || 'https://soy.devschile.cl').replace(/\/+$/, '');
}

function soyCorsGate(event) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : DEFAULT_ALLOWED_ORIGINS;
  const origin = event.headers.origin || event.headers.Origin || '';
  const isCliClient =
    (event.headers['x-tienda-client'] || event.headers['X-Tienda-Client']) === 'cli';
  const isAllowedOrigin =
    allowedOrigins.includes(origin) || allowedOrigins.includes('*') || (!origin && isCliClient);
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin || '*' : 'null',
    'Access-Control-Allow-Headers': 'Content-Type, X-Tienda-Client',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
  return { headers, isAllowedOrigin };
}

async function requestSoy(urlSuffix, { method = 'GET', headers = {}, body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOY_TIMEOUT_MS);
  try {
    const res = await fetch(`${soyBaseUrl()}${urlSuffix}`, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    return { res, json: await res.json().catch(() => ({})) };
  } finally {
    clearTimeout(timer);
  }
}

function soyErrorMessage(value, fallback) {
  if (!value || typeof value !== 'object') return fallback;
  for (const key of ['error_description', 'message', 'error']) {
    if (typeof value[key] === 'string' && value[key].trim()) return value[key].trim();
  }
  return fallback;
}

function isNullableString(value) {
  return value === null || typeof value === 'string';
}

function isSoyMemberSnapshot(value) {
  if (!value || typeof value !== 'object' || !value.member || typeof value.member !== 'object') {
    return false;
  }
  const { member } = value;
  return (
    typeof member.id === 'string' &&
    isNullableString(member.displayName) &&
    isNullableString(member.handle) &&
    isNullableString(member.primaryEmail) &&
    typeof value.isGold === 'boolean' &&
    isNullableString(value.paidThrough)
  );
}

function isSoySession(value) {
  return (
    isSoyMemberSnapshot(value) &&
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0
  );
}

module.exports = {
  soyBaseUrl,
  soyCorsGate,
  requestSoy,
  soyErrorMessage,
  isSoyMemberSnapshot,
  isSoySession,
};
