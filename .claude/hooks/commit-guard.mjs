// PreToolUse hook (see .claude/settings.json): before a commit, asks the user to approve it when it changes a .md file,
// changes a .json file beyond "version", raises the major version, or deletes or renames a file. The prompt shows the
// changes, so approving it is approving the wording. Covers git commits through Bash and the GitHub tools that commit.
//
// - Bash: the staged copies; the working-tree copies instead when the same command stages them (git add, commit -a),
//   and only the named files for git commit <paths>. Checks the repo git -C names, or the shell's folder.
// - Finishing a merge: files that match main's side came from main, so they don't ask.
// - Misses commits it can't see coming, like a file edited in the same command, git stash pop, or git run indirectly.
// - If this script fails, settings.json's onFailure blocks the command.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const cmd = input.tool_input.command || '';
const commit = cmd.match(/\bgit\b((?:\s+-[cC]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*)\s+commit\b([^;&|]*)/);
if (input.tool_name === 'Bash' && !commit) process.exit(0);
const target = commit?.[1].match(/-C\s+(\S+)/)?.[1].replace(/^(["'])(.*)\1$/, '$2');
let dir = input.tool_name === 'Bash' ? resolve(input.cwd, target ?? '.') : process.env.CLAUDE_PROJECT_DIR || input.cwd;
const show = (rev) => spawnSync('git', ['show', rev], { cwd: dir, encoding: 'utf8', maxBuffer: 64 << 20 }).stdout || null;
if (input.tool_name === 'Bash') {
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf8' });
  if (top.status) process.exit(0);
  dir = top.stdout.trim();
}
const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', maxBuffer: 64 << 20 });
const headText = (f) => show(`HEAD:${f}`);
const version = (text) => text?.match(/"version": "([^"]*)"/)?.[1];
const withoutVersion = (text) => text.replace(/"version": "[^"]*"/, '"version": ""');

const problems = [];
const shown = [];

// A diff of one file from HEAD to its new text, cut short so the prompt stays readable.
function diff(f, now) {
  const tmp = mkdtempSync(join(tmpdir(), 'ntr-guard-'));
  writeFileSync(join(tmp, 'a'), headText(f) ?? '');
  writeFileSync(join(tmp, 'b'), now ?? '');
  const out = spawnSync('git', ['diff', '--no-index', '--no-color', '-U1', 'a', 'b'], { cwd: tmp, encoding: 'utf8' }).stdout;
  rmSync(tmp, { recursive: true, force: true });
  const body = out.split('\n').slice(4).join('\n').trim();
  return `--- ${f}\n${body.length > 1500 ? `${body.slice(0, 1500)}\n(cut short)` : body}`;
}

function check(status, f, now) {
  if (status === 'D') return problems.push(`deletes ${f}`);
  if (status.startsWith('R')) return problems.push(`renames ${f} to ${status.slice(2)}`);
  const old = headText(f);
  if (f.endsWith('.md')) problems.push(`changes ${f}`);
  else if (f.endsWith('.json') && (old == null || withoutVersion(old) !== withoutVersion(now))) problems.push(`changes ${f} beyond "version"`);
  else if (f === 'manifest.json' && parseInt(version(now)) > parseInt(version(old))) problems.push(`raises the major version (${version(old)} to ${version(now)})`);
  else return;
  shown.push(diff(f, now));
}

if (input.tool_name === 'Bash') {
  // Files named after commit (git commit -m x a.md, or -- a.md): quoted text and flag values aren't paths.
  const words = commit[2].replace(/(["'])(?:\\.|(?!\1).)*\1/g, ' ').trim().split(/\s+/).filter(Boolean);
  const paths = words.filter((w, i) => !w.startsWith('-') && !/^-[mFcCt]$/.test(words[i - 1] || '') && existsSync(join(dir, w)));
  const staging = paths.length > 0 || /\bgit\b[^;&|]*\s(add|rm|mv)\b|\scommit\b[^;&|]*\s(-[a-zA-Z]*a[a-zA-Z]*|--all|--include|-i)\b/.test(cmd);
  const files = new Map();
  const add = (out) => {
    for (const line of out.split('\n').filter(Boolean)) {
      const [s, from, to] = line.split('\t');
      if (s.startsWith('R')) files.set(from, `R ${to}`).set(to, 'A');
      else if (!files.get(from)?.startsWith('R')) files.set(from, s);
    }
  };
  if (paths.length) add(git('diff', '--name-status', '-M', 'HEAD', '--', ...paths));
  else {
    add(git('diff', '--cached', '--name-status', '-M', 'HEAD'));
    if (staging) {
      add(git('diff', '--name-status', '-M', 'HEAD'));
      for (const f of git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean)) if (!files.has(f)) files.set(f, 'A');
    }
  }
  if (existsSync(join(git('rev-parse', '--absolute-git-dir').trim(), 'MERGE_HEAD'))) {
    const same = (f) => spawnSync('git', ['diff', '--quiet', ...(staging ? [] : ['--cached']), 'MERGE_HEAD', '--', f], { cwd: dir }).status === 0;
    for (const f of [...files.keys()]) if (same(f)) files.delete(f);
  }
  // What the commit will hold: the working-tree copy if this command stages it, else the staged copy.
  const content = (f) => (staging ? (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : null) : show(`:${f}`));
  for (const [f, s] of files) check(s, f, s === 'D' ? null : content(f));
} else if (input.tool_name === 'mcp__github__delete_file') {
  check('D', input.tool_input.path);
} else if (input.tool_name === 'mcp__github__create_or_update_file') {
  check('M', input.tool_input.path, input.tool_input.content);
} else if (input.tool_name === 'mcp__github__push_files') {
  for (const f of input.tool_input.files || []) check('M', f.path, f.content);
}

if (!problems.length) process.exit(0);
const why = `This commit ${problems.join('; ')}. You approve wording changes, deletions, renames and major version bumps before they're committed.`;
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: [why, ...shown].join('\n\n') } }));
