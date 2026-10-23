// The extension's version, kept the same in every place that has it.
//   node scripts/version.cjs check          shows every place and fails if they differ (CI runs this)
//   node scripts/version.cjs bump patch     2.63.3 -> 2.63.4, for fixes
//   node scripts/version.cjs bump minor     2.63.3 -> 2.64.0, for new features
// Bump once per PR: if this branch is already ahead of main, bump stops unless --force is added.
// A module that gets its own version string goes in PLACES.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PLACES = [
  ['manifest.json', null],
  ['index.js', 'VERSION'],
  ['cast.js', 'CAST_VERSION'],
  ['vn.js', 'VN_VERSION'],
  ['map.js', 'MAP_VERSION'],
  ['opening.js', 'OP_VERSION'],
  ['overlays.js', 'OVERLAYS_VERSION'],
  ['regex.js', 'REGEX_VERSION'],
  ['reader.js', 'READER_VERSION'],
  ['agents.js', 'AGENTS_VERSION'],
  ['elements.js', 'ELEMENTS_VERSION'],
  ['text.js', 'TEXT_VERSION'],
  ['avatars.js', 'AVATARS_VERSION'],
  ['decor.js', 'DECOR_VERSION'],
  ['layout.js', 'LAYOUT_VERSION'],
  ['fonts.js', 'FONTS_VERSION'],
];
const SEMVER = /^\d+\.\d+\.\d+$/;
const ci = !!process.env.GITHUB_ACTIONS;

function fail(msg) {
  console.log(ci ? `::error::${msg}` : `Error: ${msg}`);
  process.exit(1);
}

const pattern = (name) => (name ? new RegExp(`const ${name} = '([^']*)';`, 'g') : /"version": "([^"]*)"/g);

// Reads every place. Each must hold the version exactly once.
function read() {
  const problems = [];
  const found = PLACES.map(([file, name]) => {
    let text = '';
    try { text = fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch (e) { problems.push(`${file} can't be read.`); }
    const hits = [...text.matchAll(pattern(name))];
    const what = name ? `const ${name}` : '"version"';
    if (text && hits.length !== 1) problems.push(`${file} has ${what} ${hits.length} times instead of once.`);
    return { file, name, text, version: hits.length === 1 ? hits[0][1] : '(not found)' };
  });
  return { found, problems };
}

function check(quiet) {
  const { found, problems } = read();
  if (!quiet) for (const f of found) console.log(`${f.file}: ${f.version}`);
  if (problems.length) fail(problems.join(' '));
  const versions = new Set(found.map((f) => f.version));
  if (versions.size !== 1) fail(`The version is not the same in all ${PLACES.length} places: ${found.map((f) => `${f.file} ${f.version}`).join(', ')}. Set them all to one version first.`);
  const [v] = versions;
  if (!SEMVER.test(v)) fail(`The version "${v}" isn't three numbers like 2.63.3.`);
  return { found, version: v };
}

const parts = (v) => v.split('.').map(Number);
const newer = (a, b) => { const x = parts(a), y = parts(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };

// main's version, or null when git or main isn't available.
function mainVersion() {
  for (const ref of ['origin/main', 'main']) {
    try {
      const text = execFileSync('git', ['show', `${ref}:manifest.json`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      return JSON.parse(text).version;
    } catch (e) {}
  }
  return null;
}

function bump(kind, force) {
  if (kind === 'major') fail('Major bumps need the owner\'s approval, so this script doesn\'t do them. Edit the files by hand once it\'s approved.');
  if (kind !== 'patch' && kind !== 'minor') fail('Say which bump: patch (fixes) or minor (new features).');
  const { found, version } = check(true);
  const main = mainVersion();
  if (main === null) console.log('Note: main\'s version could not be read, so there\'s no check for a second bump.');
  else if (newer(version, main) && !force) fail(`This branch is already bumped (main has ${main}, this branch ${version}). One bump per PR; add --force to bump again anyway.`);
  const [a, b, c] = parts(version);
  const next = kind === 'minor' ? `${a}.${b + 1}.0` : `${a}.${b}.${c + 1}`;
  // Every new file is worked out before any is written.
  const out = found.map((f) => ({ ...f, text: f.text.replace(pattern(f.name), (m, v) => m.replace(v, next)) }));
  for (const f of out) fs.writeFileSync(path.join(ROOT, f.file), f.text);
  console.log(`${version} -> ${next} in ${out.map((f) => f.file).join(', ')}`);
}

const [cmd, arg, ...rest] = process.argv.slice(2);
if (cmd === 'check') check();
else if (cmd === 'bump') bump(arg, rest.includes('--force'));
else fail('Use "check", "bump patch" or "bump minor".');
