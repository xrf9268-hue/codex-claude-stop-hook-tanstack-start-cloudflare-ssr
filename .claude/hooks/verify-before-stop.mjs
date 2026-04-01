#!/usr/bin/env node
import fs from 'node:fs';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
if (input.stop_hook_active) {
  process.exit(0);
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const relevantPattern = /(^|\/)(src|test|internal-tests|\.claude)\/|(^|\/)(vite\.config\.ts|vitest\.config\.ts|eslint\.config\.mjs|wrangler\.jsonc|package\.json|tsconfig(\.[^.]+)?\.json|worker-configuration\.d\.ts)$/;
const codePattern = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|json|jsonc|css|html)$/;

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (result.status !== 0) return '';
  return result.stdout.trim();
}

function hasHead() {
  return spawnSync('git', ['rev-parse', '--verify', 'HEAD'], {
    cwd: projectDir,
    stdio: 'ignore',
  }).status === 0;
}

function getChangedFiles() {
  const outputs = hasHead()
    ? [runGit(['diff', '--name-only', 'HEAD'])]
    : [
        runGit(['diff', '--name-only']),
        runGit(['diff', '--cached', '--name-only']),
        runGit(['ls-files', '--others', '--exclude-standard']),
      ];

  return [...new Set(outputs.flatMap((output) => output.split('\n')).map((file) => file.trim()).filter(Boolean))].sort();
}

function isRelevant(file) {
  return relevantPattern.test(file) || codePattern.test(file);
}

function runStep(label, args) {
  const childEnv = { ...process.env };
  delete childEnv.NODE_TEST_CONTEXT;

  const result = spawnSync(args[0], args.slice(1), {
    cwd: projectDir,
    env: childEnv,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    const changed = changedFiles.slice(0, 10).join(', ');
    process.stdout.write(
      JSON.stringify({
        decision: 'block',
        reason: `${label} 失败。先修复后再结束本轮。涉及变更：${changed || '未知文件'}`,
      }) + '\n',
    );
    process.exit(0);
  }
}

const changedFiles = getChangedFiles();
const relevantFiles = changedFiles.filter(isRelevant);
if (relevantFiles.length === 0) {
  process.exit(0);
}

runStep('pnpm lint', ['pnpm', 'lint']);
runStep('pnpm typecheck', ['pnpm', 'typecheck']);
runStep('pnpm test:ci', ['pnpm', 'test:ci']);
