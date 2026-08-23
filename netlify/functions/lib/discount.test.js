// Tests de lib/discount.js — correr con: node --test netlify/functions/lib/discount.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { distributeDiscount } = require('./discount');

const fmt = (n) => new Intl.NumberFormat('es-CL').format(n);

test('distributeDiscount: sin descuento no toca nada', () => {
  const items = [{ unit_price: 1000, quantity: 2 }, { unit_price: 500, quantity: 1 }];
  const out = distributeDiscount(items, 0);
  assert.deepEqual(out, items);
});

test('distributeDiscount: la suma es exacta (varios ítems qty=1)', () => {
  const items = [
    { id: 'a', unit_price: 10_000, quantity: 1 },
    { id: 'b', unit_price: 5_000, quantity: 1 },
    { id: 'c', unit_price: 2_500, quantity: 1 },
  ];
  const out = distributeDiscount(items, 1_750);
  const sum = out.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  assert.equal(sum, 17_500 - 1_750, `suma ${fmt(sum)}`);
  assert.ok(out.every((i) => i.unit_price >= 0 && Number.isInteger(i.unit_price)));
});

test('distributeDiscount: cantidad >1 divisible se mantiene', () => {
  const items = [{ id: 'a', unit_price: 1_000, quantity: 3 }, { id: 'b', unit_price: 500, quantity: 1 }];
  const out = distributeDiscount(items, 500);
  const sum = out.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  assert.equal(sum, 3_500 - 500);
  assert.equal(out[0].quantity, 3);
});

test('distributeDiscount: línea qty>1 no divisible → factura como 1 ítem', () => {
  const items = [{ id: 'a', unit_price: 1_000, quantity: 3 }];
  const out = distributeDiscount(items, 1); // 2999 / 3 = fracción
  const sum = out.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  assert.equal(sum, 3_000 - 1);
  assert.equal(out[0].quantity, 1);
  assert.equal(out[0].unit_price, 2_999);
});

test('distributeDiscount: descuento mayor al subtotal se recorta', () => {
  const items = [{ id: 'a', unit_price: 1_000, quantity: 1 }];
  const out = distributeDiscount(items, 5_000);
  const sum = out.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  assert.equal(sum, 0);
});

test('distributeDiscount: caso mixto grande', () => {
  const items = [
    { id: 'a', unit_price: 12_000, quantity: 1 },
    { id: 'b', unit_price: 1_000, quantity: 2 },
    { id: 'c', unit_price: 700, quantity: 1 },
  ];
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  for (const discount of [1, 137, 500, 1_337, subtotal]) {
    const out = distributeDiscount(items, discount);
    const sum = out.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    assert.equal(sum, subtotal - discount, `descuento ${discount}`);
  }
});

test('distributeDiscount: residuo no divisible entre líneas qty>1 → suma exacta', () => {
  // 2×100 + 2×100 con descuento 3: el residuo (1) no es divisible por qty=2;
  // debe colapsar una línea a qty=1 para absorberlo (regresión off-by-1).
  const items = [
    { id: 'a', unit_price: 100, quantity: 2 },
    { id: 'b', unit_price: 100, quantity: 2 },
  ];
  const out = distributeDiscount(items, 3);
  const sum = out.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  assert.equal(sum, 400 - 3, `suma ${sum}`);
  assert.ok(out.every((i) => Number.isInteger(i.unit_price) && i.unit_price >= 0));
});

test('distributeDiscount: barrido exhaustivo qty>1 siempre suma exacto', () => {
  const items = [
    { id: 'a', unit_price: 100, quantity: 2 },
    { id: 'b', unit_price: 100, quantity: 2 },
    { id: 'c', unit_price: 150, quantity: 3 },
  ];
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const original = items.map((i) => i.unit_price * i.quantity);
  for (let discount = 1; discount <= subtotal; discount++) {
    const out = distributeDiscount(items, discount);
    const sum = out.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    assert.equal(sum, subtotal - discount, `descuento ${discount}`);
    assert.ok(
      out.every((i, idx) => {
        const line = i.unit_price * i.quantity;
        return Number.isInteger(i.unit_price) && i.unit_price >= 0 && line <= original[idx];
      }),
      `descuento ${discount}: precios enteros, no negativos y sin exceder la línea original`,
    );
  }
});