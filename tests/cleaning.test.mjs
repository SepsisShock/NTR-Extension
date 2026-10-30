// Card data comes from other people, so it's cleaned before anything reads it. These tests feed bad data in through
// api.store(), the same path the extension uses, so they also fail if card reads stop going through the cleaning.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, context } from './env.mjs';

// Limits come from NUM_RANGE in index.js, so the tests follow any change to a range.
const R = new Proxy({}, { get: (_, k) => api.numRange(k) });
let n = 0;
// Opens a chat with a new character whose card holds `ntr`, and returns the cleaned data. Each call uses a fresh
// character, since a card's data is only cleaned the first time it's read.
function card(ntr) {
  const ch = { avatar: `test-${n++}.png`, data: { extensions: { ntr } } };
  context.groupId = undefined;
  context.characters = [ch];
  context.characterId = 0;
  return api.store();
}
const long = (len) => 'x'.repeat(len);

const SAFE = ['/user/images/a.png', 'https://example.com/a.png', 'data:image/png;base64,iVBORw0KGgo='];
const UNSAFE = [
  'javascript:alert(1)',
  '/user/images/../../secrets.json',
  '/user/images/%2e%2e/%2e%2e/secrets.json',
  '//evil.example/a.png',
  'data:text/html;base64,PHNjcmlwdD4=',
  '/a.png" onerror="alert(1)',
  'ftp://example.com/a.png',
  `/${long(3000)}.png`,
];

test('unsafe links are removed, safe ones kept', () => {
  const st = card({
    banner: { images: [...SAFE, ...UNSAFE].map((url) => ({ url })), video: UNSAFE[0] },
    fg: { Left: UNSAFE[0], Center: UNSAFE[1], Right: SAFE[0] },
    vn: {
      sprites: { Alice: UNSAFE[2], Bob: SAFE[1] },
      locations: [{ name: 'Room', url: UNSAFE[3] }],
      locDefault: UNSAFE[4],
      opening: { file: UNSAFE[0], logoUrl: SAFE[0] },
    },
  });
  assert.deepEqual(st.banner.images.map((im) => im.url), SAFE);
  assert.equal(st.banner.video, '');
  assert.deepEqual([st.fg.Left, st.fg.Center, st.fg.Right], ['', '', SAFE[0]]);
  assert.deepEqual({ ...st.vn.sprites }, { Bob: SAFE[1] });
  assert.equal(st.vn.locations[0].url, '');
  assert.equal(st.vn.locDefault, '');
  assert.equal(st.vn.opening.file, '');
  assert.equal(st.vn.opening.logoUrl, SAFE[0]);
});

test('numbers are kept inside their limits', () => {
  const st = card({
    banner: { images: [{ url: SAFE[0], pos: -50 }], idx: 99, overlapOffset: 1e9, rotateSec: 1e9, height: -1 },
    fg: { LeftX: 1e12, LeftY: -1e12, CenterScale: 1e6, RightScale: 0 },
    vn: { maps: [{ name: 'Map', pins: [{ x: 5, y: -5 }] }] },
  });
  assert.equal(st.banner.images[0].pos, R.bannerPos[0]);
  assert.equal(st.banner.idx, 0);
  assert.equal(st.banner.overlapOffset, R.bannerOffset[1]);
  assert.equal(st.banner.rotateSec, R.bannerRotateSec[1]);
  assert.equal(st.banner.height, R.bannerHeight[0]);
  assert.equal(st.fg.LeftX, R.fgX[1]);
  assert.equal(st.fg.LeftY, R.fgY[0]);
  assert.equal(st.fg.CenterScale, R.fgScale[1]);
  assert.equal(st.fg.RightScale, R.fgScale[0]);
  assert.deepEqual([st.vn.maps[0].pins[0].x, st.vn.maps[0].pins[0].y], [1, 0]);
});

test('values of the wrong type are replaced', () => {
  const st = card({
    banner: { images: 'nope', locked: 'yes', scope: 'everywhere', mode: 42 },
    fg: { LeftScale: 'big', LeftLayer: 'top' },
    vn: { sprites: [], customSpk: ['Alice', 7, null, '  ', { name: 'Bob' }], maps: [null, 'map'] },
    regex: { folders: [{ name: 7, ids: [1, 'abc', null] }, 'folder'] },
  });
  assert.deepEqual(st.banner.images, []);
  assert.equal(st.banner.locked, true);
  assert.equal(st.banner.scope, 'global');
  assert.equal(st.banner.mode, '');
  assert.equal(st.fg.LeftScale, 100);
  assert.equal(st.fg.LeftLayer, 'behind');
  assert.deepEqual({ ...st.vn.sprites }, {});
  assert.deepEqual(st.vn.customSpk, ['Alice']);
  assert.deepEqual(st.vn.maps, []);
  assert.equal(st.regex.folders.length, 1);
  assert.equal(st.regex.folders[0].name, 'Folder');
  assert.deepEqual(st.regex.folders[0].ids, ['abc']);
});

test('sections that are not objects are dropped', () => {
  const st = card({ banner: 'nope', fg: [], vn: null, regex: 7 });
  for (const k of ['banner', 'fg', 'vn', 'regex']) assert.ok(!(k in st), k);
});

test('card data that is not an object is replaced', () => {
  for (const bad of ['junk', 7, [], null]) {
    const st = card(bad);
    assert.equal(st.v, 1);
    assert.ok(!Array.isArray(st));
  }
});

test('long text and long lists are cut down', () => {
  const st = card({
    banner: { youtubeUrl: long(10000) },
    vn: {
      customSpk: Array.from({ length: 1000 }, (_, i) => `Name ${i} ${long(500)}`),
      locations: Array.from({ length: 1000 }, (_, i) => ({ name: long(1000), url: `/l${i}.png` })),
      sprites: { [long(300)]: SAFE[0] },
    },
    regex: { folders: Array.from({ length: 500 }, () => ({ name: long(1000), ids: Array(5000).fill('a') })) },
  });
  assert.equal(st.banner.youtubeUrl.length, 500);
  assert.equal(st.vn.customSpk.length, 200);
  assert.ok(st.vn.customSpk.every((s) => s.length <= 200));
  assert.equal(st.vn.locations.length, 500);
  assert.equal(st.vn.locations[0].name.length, 200);
  assert.deepEqual({ ...st.vn.sprites }, {});
  assert.equal(st.regex.folders.length, 100);
  assert.equal(st.regex.folders[0].name.length, 60);
  assert.equal(st.regex.folders[0].ids.length, 1000);
});

test('unknown fields are dropped at every level, and known ones next to them kept', () => {
  const X = 'user/files/banner_x.png';
  const st = card({
    v: { big: long(1000) }, note: X,
    banner: { scope: 'char', locked: false, extra: X, images: [{ url: SAFE[0], pos: 30, extra: X }] },
    fg: { LeftScale: 120, extra: X },
    vn: {
      extra: X, emotions: [{ id: 'joy', name: 'Joy', extra: X }], locations: [{ name: 'Room', extra: X }], cgs: [{ name: 'CG', extra: X }],
      maps: [{ name: 'Map', extra: X, pins: [{ x: 0.5, y: 0.5, extra: X }] }], opening: { src: 'youtube', extra: X },
    },
    regex: { folders: [], extra: X },
  });
  assert.equal(JSON.stringify(st).includes(X), false);
  assert.equal(api.collectFileRefs(st).has(X), false);
  assert.equal(st.v, 1);
  assert.equal(st.banner.scope, 'char');
  assert.equal(st.banner.locked, false);
  assert.equal(st.banner.images[0].pos, 30);
  assert.equal(st.fg.LeftScale, 120);
  assert.equal(st.vn.emotions[0].name, 'Joy');
  assert.equal(st.vn.maps[0].pins[0].x, 0.5);
  assert.equal(st.vn.opening.src, 'youtube');
});

test('reading again returns the same cleaned data', () => {
  const st = card({ fg: { LeftX: 1e12 } });
  const before = JSON.stringify(st);
  assert.equal(api.store(), st);
  assert.equal(JSON.stringify(api.store()), before);
});

test('new data put on a card is cleaned when read', () => {
  card({});
  context.characters[0].data.extensions.ntr = { fg: { Left: UNSAFE[0] } };
  assert.equal(api.store().fg.Left, '');
});

test('group chat data is cleaned too', () => {
  context.characters = [];
  context.extensionSettings.chatvisuals.groupData.g1 = { banner: { images: [{ url: UNSAFE[0] }] }, vn: 'nope' };
  context.groupId = 'g1';
  try {
    const st = api.store();
    assert.deepEqual(st.banner.images, []);
    assert.ok(!('vn' in st));
  } finally {
    context.groupId = undefined;
  }
});

test("a card's own emotion list is checked like a theme's", () => {
  const list = [{ id: 'emo_a', name: ' Happy ', extra: '<b>' }, { id: 'emo_b', name: 'Sad' }];
  const good = card({ vn: { emotions: list, emoDefault: 'emo_x' } }).vn;
  assert.deepEqual(good.emotions, [{ id: 'emo_a', name: 'Happy' }, { id: 'emo_b', name: 'Sad' }]);
  // Cleaned in place: the menu edits these objects.
  assert.equal(good.emotions, list);
  assert.equal(good.emoDefault, 'emo_a');
  assert.equal(api.emoSet().own, true);
  const bad = [
    [{ id: 'emo_a', name: 'Happy' }, { id: 'emo_a', name: 'Sad' }],
    [{ id: 'emo_a', name: 'Happy' }, { id: 'emo_b', name: 'happy' }],
    [{ id: 'bad id!', name: 'Happy' }],
    [{ id: 'emo_a', name: long(101) }],
    Array.from({ length: 101 }, (_, i) => ({ id: `emo_${i}`, name: `E${i}` })),
    [],
    'Happy',
  ];
  for (const emotions of bad) {
    const v = card({ vn: { emotions, emoDefault: 'emo_a' } }).vn;
    assert.ok(!('emotions' in v) && !('emoDefault' in v), JSON.stringify(emotions).slice(0, 60));
    assert.equal(api.emoSet().own, false);
    assert.equal(api.emoSet().emotions, context.extensionSettings.chatvisuals.emotions);
  }
});
