// The Claude Code hooks in .claude/hooks: commit-guard.mjs (the user approves wording changes, deletions, renames and
// major version bumps before they reach GitHub) and pr-checklist.mjs (the PR checklist comes up once per branch).
// Each test feeds a hook the JSON Claude Code would send, in a scratch repo with its own "origin", so nothing touches
// this repo or GitHub. This checks the scripts only: whether settings.json still makes Claude Code run them (tool names,
// matchers, onFailure) can only be seen in a real session.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from './env.mjs';

const PUSH = 'git push origin feat';

// A repo on branch feat, one commit ahead of main, with main already on its bare origin.
function scratch(t) {
  const tmp = mkdtempSync(join(tmpdir(), 'ntr-hooks-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const repo = join(tmp, 'repo');
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: 'pipe' }).trim();
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', join(tmp, 'origin.git')]);
  execFileSync('git', ['init', '-q', '-b', 'main', repo]);
  git('config', 'user.name', 'test');
  git('config', 'user.email', 'test@example.com');
  mkdirSync(join(repo, '.claude/hooks'), { recursive: true });
  copyFileSync(join(ROOT, '.claude/hooks/pr-checklist.md'), join(repo, '.claude/hooks/pr-checklist.md'));
  writeFileSync(join(repo, 'manifest.json'), '{ "version": "1.0.0", "name": "x" }\n');
  writeFileSync(join(repo, 'a.md'), 'x\n');
  writeFileSync(join(repo, 'a.js'), 'x\n');
  git('add', '.');
  git('commit', '-qm', 'start');
  git('remote', 'add', 'origin', join(tmp, 'origin.git'));
  git('push', '-q', 'origin', 'main');
  git('checkout', '-qb', 'feat');
  const commit = (file, text) => {
    if (text == null) git('rm', '-q', file);
    else { writeFileSync(join(repo, file), text); git('add', file); }
    git('commit', '-qm', file);
  };
  // What the hook decides: 'deny', 'ask', or 'pass' when it lets the call through; status is its exit code.
  const hook = (name, tool_name, tool_input) => {
    const r = spawnSync(process.execPath, [join(ROOT, '.claude/hooks', name)], {
      input: JSON.stringify({ cwd: repo, tool_name, tool_input }), encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: repo },
    });
    const out = r.stdout ? JSON.parse(r.stdout).hookSpecificOutput : null;
    return { decision: out?.permissionDecision ?? 'pass', reason: out?.permissionDecisionReason ?? '', status: r.status };
  };
  const bash = (name, command) => hook(name, 'Bash', { command });
  return { repo, git, commit, hook, bash };
}

test('commit-guard lets a push through when only code changed', (t) => {
  const s = scratch(t);
  s.commit('a.js', 'y\n');
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'pass');
});

test('commit-guard shows a .md change first, then asks with the same changes', (t) => {
  const s = scratch(t);
  s.commit('a.md', 'y\n');
  const first = s.bash('commit-guard.mjs', PUSH);
  assert.equal(first.decision, 'deny');
  assert.match(first.reason, /changes a\.md/);
  assert.match(first.reason, /\+y/);
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'ask');
});

test('commit-guard flags .json changes beyond "version", a major bump and a deletion, but not a minor bump', (t) => {
  const s = scratch(t);
  s.commit('manifest.json', '{ "version": "1.1.0", "name": "x" }\n');
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'pass');
  s.commit('manifest.json', '{ "version": "2.0.0", "name": "x" }\n');
  assert.match(s.bash('commit-guard.mjs', PUSH).reason, /raises the major version/);
  s.commit('manifest.json', '{ "version": "2.0.0", "name": "y" }\n');
  assert.match(s.bash('commit-guard.mjs', PUSH).reason, /changes manifest\.json beyond "version"/);
  s.commit('a.js', null);
  assert.match(s.bash('commit-guard.mjs', PUSH).reason, /deletes a\.js/);
});

test('commit-guard denies pushes and PRs chained with other commands, and ignores them in quoted text', (t) => {
  const s = scratch(t);
  assert.equal(s.bash('commit-guard.mjs', `git add . && ${PUSH}`).decision, 'deny');
  assert.equal(s.bash('commit-guard.mjs', 'git push --all origin').decision, 'deny');
  assert.equal(s.bash('commit-guard.mjs', 'gh pr create --title x; ls').decision, 'deny');
  assert.equal(s.bash('commit-guard.mjs', 'git commit -m "git push later"').decision, 'pass');
});

test('commit-guard checks the content of GitHub tools that commit', (t) => {
  const s = scratch(t);
  assert.equal(s.hook('commit-guard.mjs', 'mcp__github__delete_file', { path: 'a.js' }).decision, 'deny');
  assert.equal(s.hook('commit-guard.mjs', 'mcp__github__create_or_update_file', { path: 'b.js', content: 'x' }).decision, 'pass');
  assert.equal(s.hook('commit-guard.mjs', 'mcp__github__push_files', { files: [{ path: 'b.md', content: 'x' }] }).decision, 'deny');
});

test('commit-guard fails when GitHub can\'t be read, so onFailure blocks the push', (t) => {
  const s = scratch(t);
  s.commit('a.js', 'y\n');
  s.git('remote', 'set-url', 'origin', join(s.repo, 'missing.git'));
  const r = s.bash('commit-guard.mjs', PUSH);
  assert.equal(r.decision, 'pass');
  assert.notEqual(r.status, 0);
});

test('pr-checklist shows the checklist once per branch, from the CLI or the GitHub tool', (t) => {
  const s = scratch(t);
  const first = s.bash('pr-checklist.mjs', 'gh pr create --title x');
  assert.equal(first.decision, 'deny');
  assert.match(first.reason, /Before opening a PR from feat/);
  assert.match(first.reason, /PR Summary/);
  assert.equal(s.hook('pr-checklist.mjs', 'mcp__github__create_pull_request', { head: 'feat', base: 'main' }).decision, 'pass');
  assert.equal(s.hook('pr-checklist.mjs', 'mcp__github__create_pull_request', { head: 'owner:other', base: 'main' }).decision, 'deny');
  assert.equal(s.hook('pr-checklist.mjs', 'mcp__github__create_pull_request', { head: 'other', base: 'main' }).decision, 'pass');
});

test('pr-checklist uses the checked-out branch, not --head text, and ignores other commands', (t) => {
  const s = scratch(t);
  s.git('checkout', '-qb', 'third');
  assert.match(s.bash('pr-checklist.mjs', 'gh pr create --title "Document --head usage" --head feature-a').reason, /from third,/);
  assert.equal(s.hook('pr-checklist.mjs', 'mcp__github__create_pull_request', { head: 'third', base: 'main' }).decision, 'pass');
  assert.equal(s.bash('pr-checklist.mjs', 'gh pr list').decision, 'pass');
  s.git('checkout', '-qb', 'fourth');
  assert.equal(s.bash('pr-checklist.mjs', 'git commit -m "gh pr create later"').decision, 'pass');
});

test('pr-checklist lets the PR through without recording the branch if the checklist file is missing', (t) => {
  const s = scratch(t);
  unlinkSync(join(s.repo, '.claude/hooks/pr-checklist.md'));
  const r = s.hook('pr-checklist.mjs', 'mcp__github__create_pull_request', { head: 'feat', base: 'main' });
  assert.equal(r.decision, 'pass');
  assert.notEqual(r.status, 0);
  assert.equal(existsSync(join(s.repo, '.git/ntr-pr-checklist.json')), false);
});
