// Removing NTR data from the character cards while a card save is already on its way to the server. The save has to
// finish first: landing after the removal, it would put the removed data back in that card. The server is a stand-in
// that keeps one card's NTR data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, context } from './env.mjs';

test('a card save already sent finishes before NTR data is removed', async () => {
  const server = { ntr: { v: 1 } };
  const ch = { avatar: 'saving.png', data: { extensions: { ntr: { v: 1 } } } };
  Object.assign(context, { groupId: undefined, characters: [ch], characterId: 0 });
  const steps = [];
  let land;
  globalThis.fetch = (url, opts) => {
    if (url !== '/api/characters/merge-attributes') return Promise.resolve({ ok: true, json: async () => ({}) });
    steps.push('save sent');
    return new Promise((res) => {
      land = () => { server.ntr = JSON.parse(opts.body).data.extensions.ntr; steps.push('save landed'); res({ ok: true }); };
    });
  };
  context.writeExtensionField = async (i, key, value) => {
    steps.push('removed');
    server.ntr = value;
    delete context.characters[i].data.extensions[key];
  };

  // An edit, saved to the card 0.7 seconds later.
  api.fgData().LeftX = 40;
  api.save();
  await new Promise((r) => setTimeout(r, 800));
  assert.deepEqual(steps, ['save sent']);

  const removing = api.removeData({ chars: true });
  await new Promise((r) => setTimeout(r, 50));
  land();
  await removing;
  assert.deepEqual(steps, ['save sent', 'save landed', 'removed']);
  assert.deepEqual(server.ntr, {});
});
