import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const input = JSON.parse(readFileSync(0, 'utf8'));
export const dir = process.env.CLAUDE_PROJECT_DIR;

// git in the project folder. gitRun gives its whole result; gitTry its output, trimmed, whether it worked or not; git
// the same output, but throws when git fails or times out.
export const gitRun = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8', maxBuffer: 256 << 20, timeout: 15000 });
export const gitTry = (...args) => gitRun(...args).stdout.trim();
export function git(...args) {
  const r = gitRun(...args);
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.error?.message ?? r.stderr}`);
  return r.stdout.trim();
}
export const currentBranch = () => git('symbolic-ref', '--short', 'HEAD');

// A hook's saved state, in .git (which git doesn't track). readState gives undefined while there's none, or it can't
// be read.
export const statePath = (name) => join(git('rev-parse', '--absolute-git-dir'), `ntr-${name}.json`);
export const readState = (path) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch {} };

// Hands Claude Code the hook's answer, and ends the hook.
export const say = (out) => { process.stdout.write(JSON.stringify(out)); process.exit(0); };
// A PreToolUse answer: 'allow', 'deny' or 'ask', with the reason shown.
export const decide = (decision, reason) => say({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason } });

// A plain git push of one branch to origin: no chaining, -C, quotes, variables, several branches or flags like --all.
// Returns what's pushed and the branch it goes to, or null for any other command.
export function pushed(cmd) {
  const m = cmd.trim().match(/^git\s+push(?:\s+(?:-u|--set-upstream|-f|--force|--force-with-lease|-q|--quiet))*\s+origin\s+\+?([\w./@^~-]+)(?::([\w./-]+))?$/);
  if (!m) return null;
  const [, src, dst] = m;
  return { src, branch: dst || (src !== 'HEAD' ? src : currentBranch()) };
}
