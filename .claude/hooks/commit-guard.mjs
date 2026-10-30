// PreToolUse hook (see .claude/settings.json): before changes reach GitHub, gets the user's approval when they change
// a .md file, change a .json file beyond "version", raise the major version, or delete or rename a file.
//
// - The claude.ai app's permission prompt shows only the command, so the first attempt is denied with the changes for
//   Claude to show the user in chat. Trying again with the same changes then asks, as the final confirmation.
//   What was last shown is kept in .git/ntr-commit-guard.json, which git doesn't track.
// - git push and gh pr create: checks the commits already made, so it doesn't matter how they were made. A file asks
//   only if the pushed copy differs from both GitHub's copy of the branch and main, so changes merged in from main
//   and changes already pushed don't ask again.
// - Either command chained with others is denied, since the commits it would push may not exist yet when this runs.
//   So is a push of anything but one branch to origin, since that's the only one it compares.
// - If GitHub's copies can't be read, the command is blocked rather than let through.
// - GitHub tools that commit (push_files, create_or_update_file, delete_file): checks their content against HEAD.
// - If this script fails, settings.json's onFailure blocks the command.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const dir = process.env.CLAUDE_PROJECT_DIR || input.cwd;
const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8', maxBuffer: 64 << 20, timeout: 15000 });
const out = (...args) => run(...args).stdout.trim();
// For reads the check depends on: a failure throws, and settings.json's onFailure blocks the command.
const must = (...args) => { const r = run(...args); if (r.status) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`); return r.stdout.trim(); };
const show = (rev, f) => { const r = run('show', `${rev}:${f}`); return r.status === 0 ? r.stdout : null; };
const version = (text) => text?.match(/"version": "([^"]*)"/)?.[1];
const withoutVersion = (text) => text?.replace(/"version": "[^"]*"/, '"version": ""');

const problems = [];
const shown = [];
const say = (decision, reason) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason } }));
  process.exit(0);
};

// A diff of one file from its old text to its new text, cut short so it stays readable in chat.
function diff(f, old, now) {
  const tmp = mkdtempSync(join(tmpdir(), 'ntr-guard-'));
  writeFileSync(join(tmp, 'a'), old ?? '');
  writeFileSync(join(tmp, 'b'), now ?? '');
  const text = spawnSync('git', ['diff', '--no-index', '--no-color', '-U1', 'a', 'b'], { cwd: tmp, encoding: 'utf8' }).stdout;
  rmSync(tmp, { recursive: true, force: true });
  const body = text.split('\n').slice(4).join('\n').trim();
  return `--- ${f}\n${body.length > 1500 ? `${body.slice(0, 1500)}\n(cut short)` : body}`;
}

// Records why a file needs approval. now is null for a deleted file; olds are the copies it's compared with, and the
// first one is shown as the diff's old side.
function check(f, now, olds, renamedTo) {
  const differs = (g) => olds.every((o) => g(o) !== g(now));
  if (now == null) problems.push(renamedTo ? `renames ${f} to ${renamedTo}` : `deletes ${f}`);
  else if (f.endsWith('.md')) problems.push(`changes ${f}`);
  else if (f.endsWith('.json') && differs(withoutVersion)) problems.push(`changes ${f} beyond "version"`);
  else if (f === 'manifest.json' && olds.every((o) => parseInt(version(now)) > parseInt(version(o)))) problems.push(`raises the major version (${version(olds[0])} to ${version(now)})`);
  else return;
  if (now != null) shown.push(diff(f, olds[0], now));
}

if (input.tool_name === 'Bash') {
  const cmd = input.tool_input.command.trim();
  // Heredoc bodies and quoted text with spaces, like commit messages, aren't commands. Quotes or backslashes inside a
  // single word (git "push", pu\sh) are unwrapped first, since they can hide the subcommand itself.
  const bare = cmd.replace(/<<-?\s*(['"]?)(\w+)\1[\s\S]*?\n\2(?=\n|$)/g, '').replace(/(["'])([^\s"']*)\1/g, '$2').replace(/\\(?=\w)/g, '')
    .replace(/(["'])(?:\\.|(?!\1)[\s\S])*\1/g, '""');
  const push = /\bgit\b/.test(bare) && /\bpush\b/.test(bare);
  const pr = /\bgh\s+pr\s+create\b/.test(bare);
  if (!push && !pr) process.exit(0);
  // Only plain forms, so the commits are already made and exactly one branch goes to origin: no chaining, -C, quotes,
  // variables, other remotes, several branches or flags like --all.
  const form = cmd.match(/^git\s+push(?:\s+(?:-u|--set-upstream|-f|--force|--force-with-lease|-q|--quiet))*\s+origin\s+\+?([\w./@^~-]+)(?::([\w./-]+))?$/);
  if (push && (!form || out('config', '--get-all', 'remote.origin.push'))) say('deny', 'Run git push by itself as git push [-u] origin <branch>, from the project folder: one branch, to origin, with no other commands, -C, quotes or variables, so the guard can check the commits it sends.');
  if (pr && !/^gh\s+pr\s+create\b[^;&|`$<>\n]*$/.test(bare)) say('deny', 'Run gh pr create by itself, after pushing, so the guard can check the commits it sends.');

  // What's pushed: the refspec's source (gh pr create: HEAD). Where to: the refspec's target, or the source branch.
  const [src, dst] = form ? [form[1], form[2]] : ['HEAD'];
  const sha = must('rev-parse', `${src}^{commit}`);
  const branch = dst || (src !== 'HEAD' ? src : must('symbolic-ref', '--short', 'HEAD'));
  // GitHub's current copies of main and the branch, fetched into their usual refs. A branch GitHub doesn't have yet has none.
  const main = 'refs/remotes/origin/main';
  must('fetch', '-q', 'origin', `+refs/heads/main:${main}`);
  const branchLookup = run('ls-remote', '--exit-code', '--heads', 'origin', branch);
  if (branchLookup.status && branchLookup.status !== 2) throw new Error(`git ls-remote failed: ${branchLookup.stderr}`);
  const branchRef = branchLookup.status ? null : `refs/remotes/origin/${branch}`;
  if (branchRef) must('fetch', '-q', 'origin', `+refs/heads/${branch}:${branchRef}`);
  const changed = (base) => new Set(must('diff', '--name-only', '--no-renames', base, sha).split('\n').filter(Boolean));
  let files = changed(main);
  if (branchRef) { const r = changed(branchRef); files = new Set([...files].filter((f) => r.has(f))); }
  const renames = new Map(must('diff', '--name-status', '-M', main, sha).split('\n').filter((l) => l.startsWith('R')).map((l) => l.split('\t').slice(1)));
  for (const f of files) check(f, show(sha, f), branchRef ? [show(branchRef, f), show(main, f)] : [show(main, f)], renames.get(f));
} else if (input.tool_name === 'mcp__github__delete_file') {
  check(input.tool_input.path, null, [show('HEAD', input.tool_input.path)]);
} else if (input.tool_name === 'mcp__github__create_or_update_file') {
  check(input.tool_input.path, input.tool_input.content, [show('HEAD', input.tool_input.path)]);
} else if (input.tool_name === 'mcp__github__push_files') {
  for (const f of input.tool_input.files || []) check(f.path, f.content, [show('HEAD', f.path)]);
}

if (!problems.length) process.exit(0);
const changes = [`Not on GitHub yet: this ${problems.join('; ')}.`, ...shown].join('\n\n');
const key = createHash('sha256').update(changes).digest('hex');
const stateFile = join(run('rev-parse', '--absolute-git-dir').stdout.trim(), 'ntr-commit-guard.json');
let shownKey = null;
try { shownKey = JSON.parse(readFileSync(stateFile, 'utf8')).key; } catch {}
if (shownKey === key) say('ask', `${changes}\n\nThe user approves wording changes, deletions, renames and major version bumps before they reach GitHub.`);
writeFileSync(stateFile, JSON.stringify({ key }));
say('deny', `The user approves these before they reach GitHub, and the permission prompt won't show them. Show the user the changes below in chat, unchanged, and ask for approval. Once they approve, run the same command again; they'll then confirm it in the prompt.\n\n${changes}`);
