// Core helpers that more than one module uses, so a change made for one of them can't quietly break another.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from './env.mjs';

test('a tag is read by the keyword set for it, in any case, and only with text after the colon', () => {
  const words = [['enter', 'enterWord'], ['exit', 'exitWord']];
  const s = { enterWord: 'Arrive', exitWord: 'Exit' };
  assert.deepEqual(api.tagOf(' ARRIVE :  Mia: in red ', words, s), { kind: 'enter', arg: 'Mia: in red' });
  assert.deepEqual(api.tagOf('Exit: Mia', words, s), { kind: 'exit', arg: 'Mia' });
  // "Exits" starts with a keyword, but has no colon.
  for (const tag of ['Enter: Mia', 'Arrive:', 'Exits']) assert.equal(api.tagOf(tag, words, s), null, tag);
});

test('a deleted location or map comes off its Map pins, and a pin left linking nothing goes', () => {
  const pin = (id, loc, map) => ({ id, loc, map });
  const v = { maps: [{ id: 'mp_a', pins: [pin('p1', 'loc_a', ''), pin('p2', 'loc_a', 'mp_b'), pin('p3', 'loc_b', 'mp_b')] }] };
  api.unlinkPins(v, 'loc', 'loc_a');
  assert.deepEqual(v.maps[0].pins, [pin('p2', '', 'mp_b'), pin('p3', 'loc_b', 'mp_b')]);
  api.unlinkPins(v, 'map', 'mp_b');
  assert.deepEqual(v.maps[0].pins, [pin('p3', 'loc_b', '')]);
});
