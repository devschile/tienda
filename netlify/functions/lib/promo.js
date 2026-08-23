// Utilidades de códigos de descuento (promos) — funciones puras, sin BD.
// Usado por create-payment.js (autoritativo) y validate-promo.js (feedback UX).

const DISCOUNT_TYPES = ['percent', 'fixed', 'shipping'];

// Normaliza un código a su forma canónica: MAYÚSCULAS sin espacios al borde.
function normalizeCode(value) {
  return String(value ?? '').trim().toUpperCase();
}

// Reglas base de un código, independientes del monto.
// Retorna { ok: true } o { ok: false, reason }.
// - invalid      → no existe / archivado
// - inactive     → active = false
// - not_started  → aún no abre ventana starts_at
// - expired      → cerró ventana expires_at
// - exhausted    → alcanzó max_uses
// - min_subtotal → el subtotal no llega al mínimo
function checkCode(row, { subtotal }) {
  if (!row) return { ok: false, reason: 'invalid' };
  if (row.archived) return { ok: false, reason: 'invalid' };
  if (!row.active) return { ok: false, reason: 'inactive' };
  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) {
    return { ok: false, reason: 'not_started' };
  }
  if (row.expires_at && now > new Date(row.expires_at).getTime()) {
    return { ok: false, reason: 'expired' };
  }
  if (row.max_uses != null && (Number(row.uses_count) || 0) >= row.max_uses) {
    return { ok: false, reason: 'exhausted' };
  }
  if (Number(row.min_subtotal) > 0 && Number(subtotal) < Number(row.min_subtotal)) {
    return { ok: false, reason: 'min_subtotal' };
  }
  return { ok: true };
}

// Descuento en CLP que un código aplica sobre el subtotal de productos.
// Solo 'percent' y 'fixed' (el tipo 'shipping' se resuelve aparte, sobre el envío).
// Nunca devuelve más que el subtotal.
function computeDiscount(row, subtotal) {
  const base = Number(subtotal) || 0;
  if (base <= 0) return 0;
  if (row.discount_type === 'percent') {
    const pct = Math.min(Math.max(Number(row.discount_value) || 0, 0), 100);
    if (pct <= 0) return 0;
    let amount = Math.round((base * pct) / 100);
    if (Number(row.max_discount) > 0) amount = Math.min(amount, Number(row.max_discount));
    return Math.max(0, Math.min(amount, base));
  }
  if (row.discount_type === 'fixed') {
    return Math.max(0, Math.min(Number(row.discount_value) || 0, base));
  }
  return 0;
}

// Mapa reason → mensaje en español para el usuario final.
const REASON_MESSAGES = {
  invalid: 'El código no es válido',
  inactive: 'Este código ya no está activo',
  not_started: 'Este código aún no es válido',
  expired: 'Este código ha expirado',
  exhausted: 'Este código ya no tiene usos disponibles',
  min_subtotal: 'Tu pedido no alcanza el mínimo para este código',
  no_delivery: 'Selecciona envío a domicilio para usar este código',
  already_free_shipping: 'Tu pedido ya tiene envío gratis',
};

function reasonMessage(reason) {
  return REASON_MESSAGES[reason] || 'El código no es válido';
}

module.exports = {
  DISCOUNT_TYPES,
  normalizeCode,
  checkCode,
  computeDiscount,
  reasonMessage,
};