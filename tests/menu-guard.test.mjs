// A module that loads but breaks while its page is drawn or bound leaves the rest of the menu working.
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './env.mjs';

await load('themes');
await load('agents');

test('the menu opens when Themes breaks, and the binds after it still run', () => {
  const th = window.NTR.themes, ag = window.NTR.agents;
  const { sectionHtml, bind } = th, agBind = ag.bind;
  let agBound = false;
  th.sectionHtml = th.bind = () => { throw new Error('broken'); };
  ag.bind = () => { agBound = true; };
  try {
    assert.doesNotThrow(() => window.NTR.api.openMenu());
    assert.ok(agBound, 'Agents was not bound after Themes broke');
  } finally {
    Object.assign(th, { sectionHtml, bind });
    ag.bind = agBind;
  }
});
