// PreToolUse hook (see .claude/settings.json): the first time Claude opens a PR from a branch, blocks it and shows the
// checklist in pr-checklist.md, so those rules come up when they apply instead of sitting in CLAUDE.md. The next try
// goes through.
//
// - gh pr create always runs by itself (commit-guard.mjs denies other forms), so a command that doesn't start with it
//   only mentions it in quoted text. Its branch is the checked-out one: --head isn't read, since the title or body can
//   contain that text too.
// - Branches already shown are kept in .git/ntr-pr-checklist.json, which git doesn't track, along with the commit
//   where the checked-out branch left GitHub's main. Cloud sessions reuse one branch name for every PR, restarting it
//   from main, so a restarted branch counts as new. A new container starts without the file, so a branch can see the
//   checklist again in a later session.
// - It's a reminder, not a guard: if this script fails, the PR goes through.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const dir = process.env.CLAUDE_PROJECT_DIR || input.cwd;
const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();

let branch = input.tool_input.head;
if (input.tool_name === 'Bash') {
  if (!/^gh\s+pr\s+create\b/.test(input.tool_input.command.trim())) process.exit(0);
  branch = git('symbolic-ref', '--short', 'HEAD');
}
// A head like owner:branch names a fork's branch.
branch = branch.replace(/^[^:]*:/, '');
// Without a copy of GitHub's main, the branch name alone is the key.
const base = spawnSync('git', ['merge-base', 'HEAD', 'refs/remotes/origin/main'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
const key = base ? `${branch}@${base}` : branch;

const stateFile = join(git('rev-parse', '--absolute-git-dir'), 'ntr-pr-checklist.json');
let branches = [];
try { branches = JSON.parse(readFileSync(stateFile, 'utf8')).branches; } catch {}
if (branches.includes(key)) process.exit(0);
const checklist = readFileSync(join(dir, '.claude/hooks/pr-checklist.md'), 'utf8');
writeFileSync(stateFile, JSON.stringify({ branches: [...branches, key] }));
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny',
  permissionDecisionReason: `Before opening a PR from ${branch}, go through this checklist, then open it again with a summary that covers it:\n\n${checklist}` } }));
