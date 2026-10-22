// Avatar Management comes from avatars.js, which the core loads before it starts. These check that it arrives in time
// and builds its CSS from what the core shares; what it looks like on screen still needs a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from './env.mjs';

test('the core loads Avatar Management before it starts', () => {
  assert.ok(window.NTR.avatars, 'avatars.js was not loaded by the core');
  assert.equal(window.NTR.avatars.version, api.VERSION);
  assert.equal(api.moduleError('avatars'), '');
});

test('Avatar Management builds its CSS, and none while NTR is off', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'backdrop', usEnabled: false, usShape: 'heart' });
  assert.equal(api.look.ntrAvatars(s, 'ai'), true);
  const css = window.NTR.avatars.css(s);
  // The AI side's Backdrop lays out the message.
  assert.match(css, /\.mes\[is_user="false"\] \{ position: relative !important; padding: 0 !important;/);
  // NTR Avatars off on the User side: SillyTavern's own avatar, untouched, whatever its Shape.
  assert.doesNotMatch(css, /is_user="true"/);
  s.masterEnabled = false;
  assert.equal(window.NTR.avatars.css(s), '');
  s.masterEnabled = true;
});

test('Fade Strength at its default keeps the even fade, and 0% has none', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'backdrop', aiShape: 'none', usEnabled: false, aiFadeBot: 30, aiFadeStr: 50 });
  assert.match(window.NTR.avatars.css(s), /linear-gradient\(to bottom, rgba\(0,0,0,0\) 0%, rgba\(0,0,0,1\) 0%, rgba\(0,0,0,1\) 70%, rgba\(0,0,0,0\) 100%\)/);
  s.aiFadeStr = 0;
  assert.doesNotMatch(window.NTR.avatars.css(s), /rgba\(0,0,0,0(\.\d+)?\) \d/);
  Object.assign(s, { aiFadeBot: 0, aiFadeStr: 50 });
});

test('Rotation turns the avatar, and Shape Only turns the picture back', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'inline', aiShape: 'square', usEnabled: false, aiRotate: 30, aiRotateMode: 'shape' });
  let css = window.NTR.avatars.css(s);
  assert.match(css, /transform: rotate\(30deg\) !important;/);
  assert.match(css, /rotate\(-30deg\) scale\(1\.366/);
  s.aiRotateMode = 'both';
  css = window.NTR.avatars.css(s);
  assert.match(css, /transform: rotate\(30deg\) !important;/);
  assert.doesNotMatch(css, /rotate\(-30deg\)/);
  Object.assign(s, { aiRotate: 0, aiRotateMode: 'shape', aiShape: 'none' });
});

test('facing fades longer than the picture meet without a hard line, and 100% Strength is a hard edge', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'backdrop', aiShape: 'none', usEnabled: false, aiFadeLeft: 60, aiFadeRight: 60, aiFadeStr: 75 });
  const h = window.NTR.avatars.css(s).split('mask-image: linear-gradient(to right, ')[1].split(', linear-gradient(to bottom')[0];
  const at = [...h.matchAll(/\) ([\d.]+)%/g)].map((m) => Number(m[1]));
  assert.equal(at.length, 18);
  assert.deepEqual(at, [...at].sort((a, b) => a - b), 'stops go backwards');
  Object.assign(s, { aiFadeLeft: 0, aiFadeRight: 0, aiFadeBot: 40, aiFadeStr: 100 });
  assert.match(window.NTR.avatars.css(s), /rgba\(0,0,0,1\) 60%, rgba\(0,0,0,0\) 60%, rgba\(0,0,0,0\) 100%\)/);
  Object.assign(s, { aiFadeBot: 0, aiFadeStr: 50 });
});

test('a Filter goes on the picture, a Texture over it, and None or 0% has none', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'backdrop', aiShape: 'none', usEnabled: false, aiFilter: 'bw', aiFilterStr: 50, aiTexture: 'scanlines', aiTextureStr: 40 });
  const css = window.NTR.avatars.css(s);
  assert.match(css, /\.avatar img \{[^}]*filter: grayscale\(0\.5\) !important;/);
  assert.match(css, /\.avatar::after \{ content: '' !important;[^}]*opacity: 0\.4 !important;[^}]*repeating-linear-gradient/);
  Object.assign(s, { aiFilterStr: 0, aiTextureStr: 0 });
  assert.doesNotMatch(window.NTR.avatars.css(s), /filter:|::after/);
  Object.assign(s, { aiFilter: 'none', aiFilterStr: 100, aiTexture: 'none', aiTextureStr: 100 });
  assert.doesNotMatch(window.NTR.avatars.css(s), /filter:|::after/);
});

test('under Shape Only the Texture turns back with the picture', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'inline', aiShape: 'square', usEnabled: false, aiRotate: 30, aiRotateMode: 'shape', aiTexture: 'scanlines' });
  assert.match(window.NTR.avatars.css(s), /::after \{[^}]*transform: rotate\(-30deg\) scale\(1\.366\) !important;/);
  s.aiRotateMode = 'both';
  assert.doesNotMatch(window.NTR.avatars.css(s), /::after \{[^}]*transform:/);
  Object.assign(s, { aiRotate: 0, aiRotateMode: 'shape', aiTexture: 'none', aiShape: 'none' });
});

test('a built-in frame draws from the extension\'s own pictures, and an unknown one draws nothing', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'inline', usEnabled: false, aiFrame: 'nouveau/lily', aiFrameImg: '' });
  assert.match(window.NTR.avatars.css(s), /assets\/frames\/nouveau\/lily\.webp/);
  s.aiFrame = '../../secrets';
  assert.doesNotMatch(window.NTR.avatars.css(s), /assets\/frames\//);
  s.aiFrame = '';
});

test('the Frame library keeps safe links and short names, and drops the rest', () => {
  const s = api.settings();
  s.frameLib = { folders: [
    { id: 'f1', name: 'x'.repeat(100), frames: [
      { id: 'a', name: 'Good', img: '/user/files/avframe_a.png' },
      { id: 'b', name: 'Bad', img: 'javascript:alert(1)' },
      { id: 'a', name: 'Same id', img: '/user/files/avframe_c.png' },
      { id: 'd', name: 'Embedded', img: 'data:image/png;base64,iVBORw0KGgo=' },
    ] },
    { id: 'bad id!', name: 'Gone', frames: [] },
    'not a folder',
  ] };
  s.frameHidden = ['nouveau', 'nope'];
  s.frameFits = { ai: { '/user/files/avframe_a.png': [9999, -9999, 'x'], short: [1] }, us: 'no' };
  const c = api.settings();
  assert.equal(c.frameLib.folders.length, 1);
  assert.equal(c.frameLib.folders[0].name.length, 60);
  assert.deepEqual(c.frameLib.folders[0].frames.map((f) => f.id), ['a']);
  assert.deepEqual(c.frameHidden, ['nouveau']);
  const [lo, hi] = api.numRange('aiFrameSize'), [xlo] = api.numRange('aiFrameX');
  assert.deepEqual(c.frameFits.ai['/user/files/avframe_a.png'], [hi, xlo, 0]);
  assert.ok(lo < hi);
  assert.equal('short' in c.frameFits.ai, false);
  assert.deepEqual(c.frameFits.us, {});
  c.frameHidden = [];
});

test('a frame uploaded before the library keeps its fit', () => {
  const s = api.settings();
  const img = '/user/files/avframe_old.png';
  Object.assign(s, { frameLibMoved: false, aiFrame: '', aiFrameImg: img, aiFrameSize: 235, aiFrameX: 11, aiFrameY: -6 });
  const c = api.settings();
  assert.ok(c.frameLib.folders[0].frames.some((f) => f.img === img));
  assert.deepEqual(c.frameFits.ai[img], [235, 11, -6]);
  c.frameLib.folders[0].frames = c.frameLib.folders[0].frames.filter((f) => f.img !== img);
  delete c.frameFits.ai[img];
  Object.assign(c, { aiFrameImg: '', aiFrameSize: 140, aiFrameX: 0, aiFrameY: 0 });
});
