# Claude Code Stop Hook + Codex + TanStack Start + Cloudflare Workers

这是面向 **pnpm + TypeScript + TanStack Start SSR + React Query + Cloudflare Workers + Vitest** 的最小可用模板。

目标不是做一个大而全的脚手架，而是先把下面三层协作接通：

1. **TanStack Start SSR** 在 Cloudflare Workers 上运行
2. **Claude Code Stop hook** 做本地 deterministic gate
3. **codex-plugin-cc review gate** 在 Claude Code 里接管 Stop 时机的 Codex 审查

## 这版包含什么

- TanStack Start + Cloudflare Vite plugin
- 自定义 `src/server.ts` Worker 入口
- TanStack Query SSR 集成
- 一个可测试的 `/api/health` server route
- ESLint flat config
- Cloudflare Workers Vitest 集成
- Claude Code Stop hook
- Node 原生测试，验证 hook 阻断逻辑

## 安装

```bash
corepack enable
pnpm install
pnpm cf-typegen
```

## 开发

```bash
pnpm dev
```

## 质量检查

```bash
pnpm lint
pnpm typecheck
pnpm test:ci
pnpm test:hook
```

## 部署

```bash
pnpm dlx wrangler login
pnpm deploy
```

## Claude Code + Codex

先安装并启用插件：

```text
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
/codex:setup
/codex:setup --enable-review-gate
```

这份仓库里的 `.claude/settings.local.json` 只负责 **本地 deterministic gate**：

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:ci`

Codex review gate 由 `codex-plugin-cc` 自带的 `Stop` hook 提供。

## Stop hook 规则

- 只有在代码或关键配置发生变更时才触发
- 如果只是改 README / 文档，不触发
- 任一步失败时返回 `decision: block`
- 检测到 `stop_hook_active` 时直接跳过，避免循环

## 为什么还保留 ESLint

默认保留 **ESLint**，因为 React / TanStack 规则兼容性最好。

如果你想试更现代的方案：

- `biome.jsonc.example`
- `docs/linting-options.md`

## 我在当前环境里实际验证过什么

当前容器无法访问 npm registry，因此我**没有**在这里跑完整的 `pnpm install`、`vite build` 或 `vitest`。

我实际验证的是：

- `node --check .claude/hooks/verify-before-stop.mjs`
- `node --test internal-tests/*.test.mjs`
- 目录结构和关键文件存在性检查

所以这份模板是 **“结构与集成逻辑已校验”** 的版本；真正的框架依赖安装与运行，需要你在有网络的本地环境执行。
