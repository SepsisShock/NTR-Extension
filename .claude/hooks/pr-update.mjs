// PostToolUse and Stop hook (see .claude/settings.json): after a push to a branch with an open PR, reminds Claude to
// re-test and update the PR summary, and at Stop sends it back once if the summary hasn't changed since that push.
//
// - Open PRs are looked up with gh api. Without gh or its login it does nothing: it's a reminder, not a guard.
// - The waiting push is kept in .git/ntr-pr-update.json, which git doesn't track. The next Stop clears it, so Claude is
//   sent back at most once per push and can then stop after saying why it didn't re-test.
// - Doesn't read stop_hook_active: that's also true when stop-tests.mjs sent Claude back.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dir, input, pushed } from './lib.mjs';

const git = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' }).stdout.trim();
const gh = (endpoint) => {
  const r = spawnSync('gh', ['api', endpoint], { cwd: dir, encoding: 'utf8', timeout: 15000 });
  if (r.status !== 0) process.exit(0);
  return JSON.parse(r.stdout);
};
const summary = (pr) => createHash('sha256').update(pr.body ?? '').digest('hex');
const say = (out) => { process.stdout.write(JSON.stringify(out)); process.exit(0); };
const remind = (n) => `This push updated PR #${n}: re-test what it changed (the /run-ntr-extension item in docs/pr-checklist.md says when), then update the PR summary, or tell the user why not.`;
const stateFile = join(git('rev-parse', '--absolute-git-dir'), 'ntr-pr-update.json');

if (input.hook_event_name === 'PostToolUse') {
  const target = pushed(input.tool_input.command);
  // A push that went through moves origin's tracking ref to what it sent.
  if (!target || git('rev-parse', '-q', '--verify', `${target.src}^{commit}`) !== git('rev-parse', '-q', '--verify', `refs/remotes/origin/${target.branch}`)) process.exit(0);
  const [pr] = gh(`repos/{owner}/{repo}/pulls?state=open&head={owner}:${encodeURIComponent(target.branch)}`);
  if (!pr) process.exit(0);
  writeFileSync(stateFile, JSON.stringify({ session: input.session_id, pr: pr.number, summary: summary(pr) }));
  say({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: remind(pr.number) } });
}

let waiting;
try { waiting = JSON.parse(readFileSync(stateFile, 'utf8')); } catch { process.exit(0); }
rmSync(stateFile);
if (waiting.session !== input.session_id || summary(gh(`repos/{owner}/{repo}/pulls/${waiting.pr}`)) !== waiting.summary) process.exit(0);
say({ decision: 'block', reason: `${remind(waiting.pr)} Its summary hasn't changed since.` });
