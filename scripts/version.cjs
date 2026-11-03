// The extension's version, kept the same in every place that has it.
//   node scripts/version.cjs check          shows every place and fails if they differ (CI runs this)
//   node scripts/version.cjs bump patch     2.63.3 -> 2.63.4, for fixes
//   node scripts/version.cjs bump minor     2.63.3 -> 2.64.0, for new features
//   node scripts/version.cjs bumped <ref>   fails unless the version is newer than <ref>'s (CI runs this on PRs)
// Bump once per PR: if this branch is already ahead of main, bump stops unless --force is added.
// manifest.json and every top-level .js file hold it, each file as one `const <NAME>VERSION = '...'`.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PLACES = ['manifest.json', ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.js')).sort()];
const SEMVER = /^\d+\.\d+\.\d+$/;
const ci = !!process.env.GITHUB_ACTIONS;

function fail(msg) {
  console.log(ci ? `::error::${msg}` : `Error: ${msg}`);
  process.exit(1);
}

const pattern = (file) => (file.endsWith('.js') ? /const [A-Z_]*VERSION = '([^']*)';/g : /"version": "([^"]*)"/g);

// Reads every place. Each must hold the version exactly once.
function read() {
  const problems = [];
  const found = PLACES.map((file) => {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const hits = [...text.matchAll(pattern(file))];
    const what = file.endsWith('.js') ? 'a version constant' : '"version"';
    if (hits.length !== 1) problems.push(`${file} has ${what} ${hits.length} times instead of once.`);
    return { file, text, version: hits.length === 1 ? hits[0][1] : '(not found)' };
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

// The first of these refs' version, or null when git or the refs aren't available.
function refVersion(refs) {
  for (const ref of refs) {
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
  const main = refVersion(['origin/main', 'main']);
  if (main === null) console.log('Note: main\'s version could not be read, so there\'s no check for a second bump.');
  else if (newer(version, main) && !force) fail(`This branch is already bumped (main has ${main}, this branch ${version}). One bump per PR; add --force to bump again anyway.`);
  const [a, b, c] = parts(version);
  const next = kind === 'minor' ? `${a}.${b + 1}.0` : `${a}.${b}.${c + 1}`;
  // Every new file is worked out before any is written.
  const out = found.map((f) => ({ ...f, text: f.text.replace(pattern(f.file), (m, v) => m.replace(v, next)) }));
  for (const f of out) fs.writeFileSync(path.join(ROOT, f.file), f.text);
  console.log(`${version} -> ${next} in ${out.map((f) => f.file).join(', ')}`);
}

function bumped(ref) {
  if (!ref) fail('Say which ref to compare with: bumped <ref>.');
  const { version } = check(true);
  const base = refVersion([ref]);
  if (base === null) fail(`${ref}'s manifest.json could not be read.`);
  console.log(`${ref}: ${base}, this branch: ${version}`);
  if (!newer(version, base)) fail(`A .js or .css file changed, but the version was not bumped. It is ${version}; ${ref} has ${base}. Merge main in, then bump with node scripts/version.cjs bump patch (fixes) or minor (features).`);
}

const [cmd, arg, ...rest] = process.argv.slice(2);
if (cmd === 'check') check();
else if (cmd === 'bump') bump(arg, rest.includes('--force'));
else if (cmd === 'bumped') bumped(arg);
else fail('Use "check", "bump patch", "bump minor" or "bumped <ref>".');
