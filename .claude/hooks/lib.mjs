import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export const input = JSON.parse(readFileSync(0, 'utf8'));
export const dir = process.env.CLAUDE_PROJECT_DIR || input.cwd;

// A plain git push of one branch to origin: no chaining, -C, quotes, variables, several branches or flags like --all.
// Returns what's pushed and the branch it goes to, or null for any other command.
export function pushed(cmd) {
  const m = cmd.trim().match(/^git\s+push(?:\s+(?:-u|--set-upstream|-f|--force|--force-with-lease|-q|--quiet))*\s+origin\s+\+?([\w./@^~-]+)(?::([\w./-]+))?$/);
  if (!m) return null;
  const [, src, dst] = m;
  return { src, branch: dst || (src !== 'HEAD' ? src : execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim()) };
}
