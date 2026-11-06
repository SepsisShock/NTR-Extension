// The Claude Code hooks in .claude/hooks: commit-guard.mjs (the user approves wording changes, deletions and major
// version bumps before they reach GitHub, and Claude explains new tests), pr-checklist.mjs (the PR checklist comes up
// once each time a branch starts from main) and pr-update.mjs (Claude re-tests and updates the summary after pushing
// to an open PR).
// Each test feeds a hook the JSON Claude Code would send, in a scratch repo with its own "origin", so nothing touches
// this repo or GitHub. This checks the scripts only: whether settings.json still makes Claude Code run them (tool names,
// matchers, onFailure) can only be seen in a real session.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Not imported from env.mjs, which also starts the extension: these tests should only fail when a hook breaks.
const ROOT = fileURLToPath(new URL('..', import.meta.url));

const PUSH = 'git push origin feat';

// A repo on branch feat, level with main, with main already on its bare origin. Tests add the commits they need.
function scratch(t) {
  const tmp = mkdtempSync(join(tmpdir(), 'ntr-hooks-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const repo = join(tmp, 'repo');
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: 'pipe' }).trim();
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', join(tmp, 'origin.git')]);
  execFileSync('git', ['init', '-q', '-b', 'main', repo]);
  git('config', 'user.name', 'test');
  git('config', 'user.email', 'test@example.com');
  mkdirSync(join(repo, 'docs'), { recursive: true });
  copyFileSync(join(ROOT, 'docs/pr-checklist.md'), join(repo, 'docs/pr-checklist.md'));
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
  // What the hook decides: 'deny', 'ask', 'allow', or 'pass' when it lets the call through. A hook that crashes also
  // prints nothing, so it fails the test unless fails is set; Claude Code would block that call (onFailure) or let it through.
  const run = (name, data, env) => spawnSync(process.execPath, [join(ROOT, '.claude/hooks', name)], {
    input: JSON.stringify({ cwd: repo, ...data }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: repo, ...env },
  });
  const hook = (name, tool_name, tool_input, fails = false) => {
    const r = run(name, { tool_name, tool_input });
    if (fails) assert.notEqual(r.status, 0);
    else assert.equal(r.status, 0, r.stderr);
    const out = r.stdout ? JSON.parse(r.stdout).hookSpecificOutput : null;
    return { decision: out?.permissionDecision ?? 'pass', reason: out?.permissionDecisionReason ?? '' };
  };
  const bash = (name, command, fails) => hook(name, 'Bash', { command }, fails);
  return { repo, git, commit, run, hook, bash };
}

test('commit-guard lets a push through when only code changed', (t) => {
  const s = scratch(t);
  s.commit('a.js', 'y\n');
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'pass');
});

test('commit-guard shows changes first, then lets .md-only changes through and asks for others', (t) => {
  const s = scratch(t);
  s.commit('a.md', 'y\n');
  const first = s.bash('commit-guard.mjs', PUSH);
  assert.equal(first.decision, 'deny');
  assert.match(first.reason, /changes a\.md/);
  assert.match(first.reason, /\*\*After:\*\*\n```\ny\n```/);
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'allow');
  s.commit('a.js', null);
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'deny');
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'ask');
});

test('commit-guard flags a major bump and a deletion, but not a minor bump or other .json changes', (t) => {
  const s = scratch(t);
  s.commit('manifest.json', '{ "version": "1.1.0", "name": "x" }\n');
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'pass');
  s.commit('manifest.json', '{ "version": "2.0.0", "name": "x" }\n');
  assert.match(s.bash('commit-guard.mjs', PUSH).reason, /raises the major version/);
  s.git('push', '-q', 'origin', 'feat');
  s.commit('manifest.json', '{ "version": "2.0.0", "name": "y" }\n');
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'pass');
  s.commit('a.js', null);
  assert.match(s.bash('commit-guard.mjs', PUSH).reason, /deletes a\.js/);
});

test('commit-guard lets a code rename through, still asks for a .md rename and a deletion after a pushed copy', (t) => {
  const s = scratch(t);
  s.git('mv', 'a.js', 'b.js');
  s.git('commit', '-qm', 'rename');
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'pass');
  s.git('mv', 'a.md', 'b.md');
  s.git('commit', '-qm', 'rename md');
  assert.match(s.bash('commit-guard.mjs', PUSH).reason, /changes b\.md/);
  // b.js is pushed first so the diff against main shows a rename; the guard must still flag the deletion of a.js.
  const c = scratch(t);
  c.commit('b.js', 'x\n');
  c.git('push', '-q', 'origin', 'feat');
  c.commit('a.js', null);
  assert.match(c.bash('commit-guard.mjs', PUSH).reason, /deletes a\.js/);
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
  assert.equal(s.bash('commit-guard.mjs', PUSH, true).decision, 'pass');
});

test('commit-guard has Claude explain each new test once, and asks only for changes that need approval', (t) => {
  const s = scratch(t);
  mkdirSync(join(s.repo, 'tests'));
  s.commit('tests/a.test.mjs', "test('one', () => {});\n");
  assert.match(s.bash('commit-guard.mjs', PUSH).reason, /New tests: tests\/a\.test\.mjs: one\..*No approval/);
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'pass');
  s.git('push', '-q', 'origin', 'feat');
  s.commit('tests/a.test.mjs', "test('one', () => { 1; });\ntest('two', () => {});\n");
  s.commit('a.js', null);
  const both = s.bash('commit-guard.mjs', PUSH);
  assert.match(both.reason, /deletes a\.js/);
  assert.match(both.reason, /New tests: tests\/a\.test\.mjs: two\./);
  assert.equal(s.bash('commit-guard.mjs', PUSH).decision, 'ask');
});

test('pr-update reminds after a push to an open PR, and sends Claude back once if the summary is unchanged', (t) => {
  const s = scratch(t);
  // A fake gh: the open PR list comes from open.json, a single PR from pr.json.
  const bin = join(s.repo, '..', 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'gh'), '#!/bin/sh\ncase "$2" in *state=open*) cat "$GH_DIR/open.json";; *) cat "$GH_DIR/pr.json";; esac\n', { mode: 0o755 });
  const pr = (open, body) => {
    writeFileSync(join(bin, 'open.json'), JSON.stringify(open ? [{ number: 7, body }] : []));
    writeFileSync(join(bin, 'pr.json'), JSON.stringify({ number: 7, body }));
  };
  const out = (data) => {
    const r = s.run('pr-update.mjs', { session_id: 'a', ...data }, { PATH: `${bin}:${process.env.PATH}`, GH_DIR: bin });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout && JSON.parse(r.stdout);
  };
  const push = () => out({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: PUSH } });
  const stop = () => out({ hook_event_name: 'Stop' });
  s.commit('a.js', 'y\n');
  s.git('push', '-q', 'origin', 'feat');
  pr(false, 'x');
  assert.equal(push(), '');
  pr(true, 'x');
  assert.match(push().hookSpecificOutput.additionalContext, /PR #7/);
  assert.equal(stop().decision, 'block');
  assert.equal(stop(), '');
  push();
  pr(true, 'y');
  assert.equal(stop(), '');
  // A push that didn't go through leaves origin's tracking ref behind.
  s.commit('a.js', 'z\n');
  assert.equal(push(), '');
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

test('pr-checklist shows the checklist again when the same branch is restarted from a newer main', (t) => {
  const s = scratch(t);
  s.commit('a.js', 'y\n');
  const pr = () => s.bash('pr-checklist.mjs', 'gh pr create --title x').decision;
  assert.equal(pr(), 'deny');
  assert.equal(pr(), 'pass');
  // The PR is merged, and the branch is restarted from the new main under the same name.
  s.git('checkout', '-q', 'main');
  s.git('merge', '-q', 'feat');
  s.git('push', '-q', 'origin', 'main');
  s.git('checkout', '-q', '-B', 'feat', 'origin/main');
  assert.equal(pr(), 'deny');
  assert.equal(pr(), 'pass');
});

test('pr-checklist lets the PR through without recording the branch if the checklist file is missing', (t) => {
  const s = scratch(t);
  unlinkSync(join(s.repo, 'docs/pr-checklist.md'));
  assert.equal(s.hook('pr-checklist.mjs', 'mcp__github__create_pull_request', { head: 'feat', base: 'main' }, true).decision, 'pass');
  assert.equal(existsSync(join(s.repo, '.git/ntr-pr-checklist.json')), false);
});
