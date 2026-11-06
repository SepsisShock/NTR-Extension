// Stop hook (see .claude/settings.json): runs tests/*.test.mjs at a session's first stop and whenever the code changed
// since the last check, and sends Claude back to fix what fails. It checks the files on disk, so edits made through
// Bash and commits count too.
//
// - First check of a session: always runs, and failures are only reported, so an already broken branch can't block a
//   plain answer.
// - After that, nothing changed (questions, plans): no run.
// - Sent back already, then nothing changed or the same tests still fail: Claude may stop, and the user is told.
//
// What it saw last, and whether it sent Claude back, is kept in .git/ntr-stop-hook.json, which git doesn't track.
// stop_hook_active isn't used: it's also true when another Stop hook sent Claude back.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dir, input } from './lib.mjs';

const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', maxBuffer: 256 << 20 });
const CODE = ['*.js', '*.mjs', '*.cjs', '*.css'];

// The commit plus every uncommitted change to the code, so any edit or commit gives a new value.
function fingerprint() {
  const h = createHash('sha256').update(git('rev-parse', 'HEAD')).update(git('diff', 'HEAD', '--', ...CODE));
  for (const f of git('ls-files', '--others', '--exclude-standard', '--', ...CODE).split('\n').filter(Boolean)) h.update(f).update(readFileSync(join(dir, f)));
  return h.digest('hex');
}

const stateFile = join(git('rev-parse', '--absolute-git-dir').trim(), 'ntr-stop-hook.json');
let prev = {};
try { prev = JSON.parse(readFileSync(stateFile, 'utf8')); } catch {}
const first = prev.session !== input.session_id;
const fp = fingerprint();
const say = (out) => { process.stdout.write(JSON.stringify(out)); process.exit(0); };
const still = (failing) => say({ systemMessage: `Tests still fail after Claude's fix attempt: ${failing.join('; ')}` });

const save = (failing, blocked) => writeFileSync(stateFile, JSON.stringify({ session: input.session_id, fp, failing, blocked }));

if (!first && prev.fp === fp) {
  if (!prev.blocked) process.exit(0);
  save(prev.failing, false);
  still(prev.failing);
}

const files = readdirSync(join(dir, 'tests')).filter((f) => f.endsWith('.test.mjs')).map((f) => join('tests', f));
const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: dir, encoding: 'utf8', timeout: 120000, maxBuffer: 64 << 20 });
const failing = run.error ? [`the tests didn't finish: ${run.error.message}`]
  : [...run.stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]).concat(run.status && !/^not ok /m.test(run.stdout) ? ['the test run failed'] : []);
const blocked = !first && failing.length > 0 && !(prev.blocked && failing.join('\n') === prev.failing.join('\n'));
save(failing, blocked);

if (!failing.length) process.exit(0);
if (first) say({ systemMessage: `Tests fail (first check this session, so Claude wasn't sent back): ${failing.join('; ')}` });
if (!blocked) still(failing);
say({ decision: 'block', reason: `These tests fail: ${failing.join('; ')}. Run node --test tests/*.test.mjs to see why, then fix them, or tell the user why they can't be fixed.` });
