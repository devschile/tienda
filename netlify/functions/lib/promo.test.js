// Tests de lib/promo.js — correr con: node --test netlify/functions/lib/promo.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeCode,
  checkCode,
  computeDiscount,
  reasonMessage,
} = require('./promo');

const baseRow = {
  archived: false,
  active: true,
  starts_at: null,
  expires_at: null,
  max_uses: null,
  uses_count: 0,
  min_subtotal: 0,
  discount_type: 'percent',
  discount_value: 10,
  max_discount: null,
};

test('normalizeCode: recorta y pasa a mayúsculas', () => {
  assert.equal(normalizeCode('  hola10  '), 'HOLA10');
  assert.equal(normalizeCode(undefined), '');
  assert.equal(normalizeCode(null), '');
});

test('checkCode: código inválido / archivado', () => {
  assert.deepEqual(checkCode(null, { subtotal: 1000 }), { ok: false, reason: 'invalid' });
  assert.deepEqual(checkCode({ ...baseRow, archived: true }, { subtotal: 1000 }), {
    ok: false,
    reason: 'invalid',
  });
});

test('checkCode: inactivo', () => {
  assert.equal(checkCode({ ...baseRow, active: false }, { subtotal: 1000 }).reason, 'inactive');
});

test('checkCode: ventana de vigencia', () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);
  assert.equal(
    checkCode({ ...baseRow, starts_at: future }, { subtotal: 1000 }).reason,
    'not_started',
  );
  assert.equal(checkCode({ ...baseRow, expires_at: past }, { subtotal: 1000 }).reason, 'expired');
  assert.equal(checkCode({ ...baseRow, starts_at: past, expires_at: future }, { subtotal: 1000 }).ok, true);
});

test('checkCode: usos agotados', () => {
  assert.equal(
    checkCode({ ...baseRow, max_uses: 5, uses_count: 5 }, { subtotal: 1000 }).reason,
    'exhausted',
  );
  assert.equal(checkCode({ ...baseRow, max_uses: 5, uses_count: 4 }, { subtotal: 1000 }).ok, true);
});

test('checkCode: subtotal mínimo', () => {
  assert.equal(checkCode({ ...baseRow, min_subtotal: 5000 }, { subtotal: 1000 }).reason, 'min_subtotal');
  assert.equal(checkCode({ ...baseRow, min_subtotal: 5000 }, { subtotal: 5000 }).ok, true);
});

test('computeDiscount: percent', () => {
  assert.equal(computeDiscount({ ...baseRow, discount_value: 10 }, 10_000), 1000);
  // redondeo a CLP entero
  assert.equal(computeDiscount({ ...baseRow, discount_value: 10 }, 1_005), 101);
});

test('computeDiscount: percent con tope max_discount', () => {
  const row = { ...baseRow, discount_value: 50, max_discount: 2000 };
  assert.equal(computeDiscount(row, 10_000), 2000); // raw 5000, cap 2000
});

test('computeDiscount: percent nunca excede el subtotal', () => {
  assert.equal(computeDiscount({ ...baseRow, discount_value: 100 }, 1_000), 1_000);
});

test('computeDiscount: fixed', () => {
  assert.equal(computeDiscount({ discount_type: 'fixed', discount_value: 2000 }, 10_000), 2000);
  // no por encima del subtotal
  assert.equal(computeDiscount({ discount_type: 'fixed', discount_value: 5000 }, 1_000), 1_000);
  assert.equal(computeDiscount({ discount_type: 'fixed', discount_value: 2000 }, 0), 0);
});

test('computeDiscount: shipping no descuenta subtotal', () => {
  assert.equal(computeDiscount({ discount_type: 'shipping', discount_value: 3000 }, 10_000), 0);
});

test('reasonMessage: mapeo a español', () => {
  assert.equal(reasonMessage('expired'), 'Este código ha expirado');
  assert.equal(reasonMessage('nope'), 'El código no es válido');
});