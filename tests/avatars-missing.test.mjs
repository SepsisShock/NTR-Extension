// NTR Avatars are set only on Avatar Management's page, so they stay off without avatars.js.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.NTR_TEST_WITHOUT = ['avatars'];
const { api } = await import('./env.mjs');

test('without avatars.js, NTR Avatars stay off', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'popout' });
  assert.equal(api.look.ntrAvatars(s, 'ai'), false);
});
