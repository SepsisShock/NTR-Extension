// Stop and SessionStart hook (see .claude/settings.json): runs tests/*.test.mjs at a session's first stop and whenever
// the code changed since the last check, and sends Claude back to fix what fails. It checks the files on disk, so
// edits made through Bash and commits count too.
//
// - SessionStart: records the code's fingerprint, and prints nothing, since Claude Code adds its output to Claude's
//   context. Compaction and resuming fire it again; a session's first record stands, so a compaction during the first
//   turn can't hide the changes made before it.
// - First stop: always runs. Failures send Claude back only if the code changed since that record. With no change, or
//   no record (another session in the repo replaced it), they're only reported, so an already broken branch can't
//   block a plain answer.
// - After that, nothing changed (questions, plans): no run.
// - Sent back already, then nothing changed or the same tests still fail: Claude may stop, and the user is told.
//
// What it saw last, and whether it sent Claude back, is kept in .git/ntr-stop-hook.json, which git doesn't track.
// stop_hook_active isn't used: it's also true when another Stop hook sent Claude back.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dir, git, input, readState, say, statePath } from './lib.mjs';

const CODE = ['*.js', '*.mjs', '*.cjs', '*.css'];

// The commit plus every uncommitted change to the code, so any edit or commit gives a new value.
function fingerprint() {
  const h = createHash('sha256').update(git('rev-parse', 'HEAD')).update(git('diff', 'HEAD', '--', ...CODE));
  for (const f of git('ls-files', '--others', '--exclude-standard', '--', ...CODE).split('\n').filter(Boolean)) h.update(f).update(readFileSync(join(dir, f)));
  return h.digest('hex');
}

const stateFile = statePath('stop-hook');
const prev = readState(stateFile) ?? {};
const same = prev.session === input.session_id;
const save = (state) => writeFileSync(stateFile, JSON.stringify({ session: input.session_id, ...state }));

if (input.hook_event_name === 'SessionStart') {
  if (!same) save({ start: fingerprint() });
  process.exit(0);
}

const fp = fingerprint();
const still = (failing) => say({ systemMessage: `Tests still fail after Claude's fix attempt: ${failing.join('; ')}` });

if (same && prev.fp === fp) {
  if (!prev.blocked) process.exit(0);
  save({ fp, failing: prev.failing, blocked: false });
  still(prev.failing);
}

const files = readdirSync(join(dir, 'tests')).filter((f) => f.endsWith('.test.mjs')).map((f) => join('tests', f));
const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: dir, encoding: 'utf8', timeout: 120000, maxBuffer: 64 << 20 });
const failing = run.error ? [`the tests didn't finish: ${run.error.message}`]
  : [...run.stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]).concat(run.status && !/^not ok /m.test(run.stdout) ? ['the test run failed'] : []);
const reportOnly = !same || prev.start === fp;
const blocked = !reportOnly && failing.length > 0 && !(prev.blocked && failing.join('\n') === prev.failing.join('\n'));
save({ fp, failing, blocked });

if (!failing.length) process.exit(0);
if (reportOnly) say({ systemMessage: `Tests fail (no code change seen this session, so Claude wasn't sent back): ${failing.join('; ')}` });
if (!blocked) still(failing);
say({ decision: 'block', reason: `These tests fail: ${failing.join('; ')}. Run node --test tests/*.test.mjs to see why, then fix them, or tell the user why they can't be fixed.` });
