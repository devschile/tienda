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