import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

for (const rel of [
  '.claude/hooks/verify-before-stop.mjs',
  '.claude/settings.local.json',
  'src/routes/__root.tsx',
  'src/routes/index.tsx',
  'src/routes/api/health.ts',
  'src/router.tsx',
  'src/routeTree.gen.ts',
  'src/server.ts',
  'wrangler.jsonc',
  'vite.config.ts',
  'vitest.config.ts',
]) {
  test(`exists: ${rel}`, () => {
    assert.equal(existsSync(path.join(root, rel)), true);
  });
}

test('package.json exposes the expected quality scripts', () => {
  assert.equal(pkg.scripts.lint, 'eslint .');
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit');
  assert.equal(pkg.scripts['test:ci'], 'vitest run');
});
