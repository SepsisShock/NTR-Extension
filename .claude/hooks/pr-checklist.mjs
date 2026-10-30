// PreToolUse hook (see .claude/settings.json): the first time Claude opens a PR from a branch, blocks it and shows the
// checklist in pr-checklist.md, so those rules come up when they apply instead of sitting in CLAUDE.md. The next try
// goes through.
//
// - gh pr create always runs by itself (commit-guard.mjs denies other forms), so a command that doesn't start with it
//   only mentions it in quoted text.
// - Branches already shown are kept in .git/ntr-pr-checklist.json, which git doesn't track. A new container starts
//   without it, so a branch can see the checklist again in a later session.
// - It's a reminder, not a guard: if this script fails, the PR goes through.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const dir = process.env.CLAUDE_PROJECT_DIR || input.cwd;
const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();

let branch = input.tool_input.head;
if (input.tool_name === 'Bash') {
  const cmd = input.tool_input.command.trim();
  if (!/^gh\s+pr\s+create\b/.test(cmd)) process.exit(0);
  branch = cmd.match(/(?:--head|-H)[=\s]+["']?([^\s"']+)/)?.[1] ?? git('symbolic-ref', '--short', 'HEAD');
}
// A head like owner:branch names a fork's branch.
branch = branch.replace(/^[^:]*:/, '');

const stateFile = join(git('rev-parse', '--absolute-git-dir'), 'ntr-pr-checklist.json');
let branches = [];
try { branches = JSON.parse(readFileSync(stateFile, 'utf8')).branches; } catch {}
if (branches.includes(branch)) process.exit(0);
const checklist = readFileSync(join(dir, '.claude/hooks/pr-checklist.md'), 'utf8');
writeFileSync(stateFile, JSON.stringify({ branches: [...branches, branch] }));
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny',
  permissionDecisionReason: `Before opening a PR from ${branch}, go through this checklist, then open it again with a summary that covers it:\n\n${checklist}` } }));
