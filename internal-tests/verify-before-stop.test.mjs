import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const fixtureRoot = path.resolve(process.cwd());
const hookPath = path.join(fixtureRoot, '.claude/hooks/verify-before-stop.mjs');

function run(cmd, args, cwd, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function setupRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'hook-mvp-'));
  mkdirSync(path.join(dir, '.claude/hooks'), { recursive: true });
  mkdirSync(path.join(dir, 'src'), { recursive: true });
  mkdirSync(path.join(dir, 'bin'), { recursive: true });

  writeFileSync(path.join(dir, '.claude/hooks/verify-before-stop.mjs'), readFileSync(hookPath));
  writeFileSync(path.join(dir, 'src/index.ts'), 'export const ok = true;\n');
  writeFileSync(path.join(dir, 'README.md'), '# temp\n');

  writeFileSync(
    path.join(dir, 'bin/pnpm'),
    '#!/usr/bin/env bash\n' +
      'echo "$@" >> "$PNPM_LOG"\n' +
      'case "$1" in\n' +
      '  lint) exit "${PNPM_LINT_EXIT:-0}" ;;\n' +
      '  typecheck) exit "${PNPM_TYPECHECK_EXIT:-0}" ;;\n' +
      '  test:ci) exit "${PNPM_TEST_EXIT:-0}" ;;\n' +
      '  *) exit 0 ;;\n' +
      'esac\n',
    { mode: 0o755 },
  );

  run('git', ['init'], dir);
  run('git', ['config', 'user.email', 'test@example.com'], dir);
  run('git', ['config', 'user.name', 'Test User'], dir);
  run('git', ['add', '.'], dir);
  run('git', ['commit', '-m', 'init'], dir);
  return dir;
}

function invokeHook(dir, input = {}, env = {}) {
  const logFile = path.join(dir, 'pnpm.log');
  writeFileSync(logFile, '');

  return spawnSync('node', ['.claude/hooks/verify-before-stop.mjs'], {
    cwd: dir,
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
      CLAUDE_PROJECT_DIR: dir,
      PNPM_LOG: logFile,
      PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`,
    },
  });
}

test('skips when stop_hook_active is true', () => {
  const dir = setupRepo();
  try {
    const result = invokeHook(dir, { stop_hook_active: true });
    assert.equal(result.status, 0);
    assert.equal(readFileSync(path.join(dir, 'pnpm.log'), 'utf8'), '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('skips when only docs change', () => {
  const dir = setupRepo();
  try {
    writeFileSync(path.join(dir, 'README.md'), '# changed\n');
    const result = invokeHook(dir, {});
    assert.equal(result.status, 0);
    assert.equal(readFileSync(path.join(dir, 'pnpm.log'), 'utf8'), '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('runs lint, typecheck and tests when code changes', () => {
  const dir = setupRepo();
  try {
    writeFileSync(path.join(dir, 'src/index.ts'), 'export const ok = false;\n');
    const result = invokeHook(dir, {});
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '');
    assert.equal(readFileSync(path.join(dir, 'pnpm.log'), 'utf8'), 'lint\ntypecheck\ntest:ci\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('blocks when lint fails', () => {
  const dir = setupRepo();
  try {
    writeFileSync(path.join(dir, 'src/index.ts'), 'export const broken = true;\n');
    const result = invokeHook(dir, {}, { PNPM_LINT_EXIT: '1' });
    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout.trim());
    assert.equal(payload.decision, 'block');
    assert.match(payload.reason, /pnpm lint 失败/);
    assert.equal(readFileSync(path.join(dir, 'pnpm.log'), 'utf8'), 'lint\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
