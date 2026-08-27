const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isSoyMemberSnapshot, isSoySession, soyErrorMessage } = require('./soy');

const validSnapshot = {
  member: {
    id: 'member-1',
    displayName: 'Ada Lovelace',
    handle: 'ada',
    primaryEmail: 'ada@example.com',
  },
  isGold: true,
  paidThrough: '2026-12-31',
};

test('isSoyMemberSnapshot: acepta el contrato esperado de members/me', () => {
  assert.equal(isSoyMemberSnapshot(validSnapshot), true);
  assert.equal(
    isSoyMemberSnapshot({
      ...validSnapshot,
      member: { ...validSnapshot.member, displayName: null, handle: null, primaryEmail: null },
      paidThrough: null,
    }),
    true,
  );
});

test('isSoyMemberSnapshot: rechaza respuestas incompletas o mal tipadas', () => {
  assert.equal(isSoyMemberSnapshot(null), false);
  assert.equal(isSoyMemberSnapshot({ ...validSnapshot, member: undefined }), false);
  assert.equal(isSoyMemberSnapshot({ ...validSnapshot, isGold: 'true' }), false);
  assert.equal(
    isSoyMemberSnapshot({
      ...validSnapshot,
      member: { ...validSnapshot.member, handle: 123 },
    }),
    false,
  );
});

test('isSoySession: exige el access token que entrega auth/exchange', () => {
  assert.equal(isSoySession({ ...validSnapshot, accessToken: 'token-1' }), true);
  assert.equal(isSoySession(validSnapshot), false);
  assert.equal(isSoySession({ ...validSnapshot, accessToken: '' }), false);
});

test('soyErrorMessage: prioriza el detalle del provider y conserva fallback', () => {
  assert.equal(
    soyErrorMessage({ error: 'invalid_grant', error_description: 'Code expirado' }, 'fallback'),
    'Code expirado',
  );
  assert.equal(soyErrorMessage(new Error('timeout'), 'fallback'), 'timeout');
  assert.equal(soyErrorMessage({}, 'fallback'), 'fallback');
});
