# Claude Code Stop Hook + Codex + TanStack Start + Cloudflare Workers

面向 **pnpm + TypeScript + TanStack Start SSR + React Query + Cloudflare Workers + Vitest** 的最小可用模板。

核心目标是将三层质量保障机制接通：

1. **TanStack Start SSR** — 在 Cloudflare Workers 上运行的全栈 React 应用
2. **Claude Code Stop Hook** — 本地 deterministic gate（lint → typecheck → test）
3. **Codex Review Gate** — 在 Claude Code 的 Stop 事件中插入 Codex 代码审查

## 功能概览

- TanStack Start + Cloudflare Vite Plugin 的 SSR Streaming
- 自定义 `src/server.ts` Worker 入口，导出 `handler.fetch`
- TanStack Query SSR 集成（`createServerFn` → `queryOptions` → `ensureQueryData` → `useSuspenseQuery`）
- `/api/health` API 路由（`server.handlers.GET`）
- ESLint v9 flat config（React Hooks + React Refresh 规则）
- `@cloudflare/vitest-pool-workers` 集成测试（真实 workerd 环境）
- Node 原生测试（`node --test`），验证 Stop Hook 阻断逻辑
- Mermaid 交互式架构图（SSR 数据流、Stop Hook 流程、构建流水线）
- 自定义域名 `review.aixie.de` 部署

## 安装

```bash
corepack enable
pnpm install
pnpm cf-typegen
```

> `postinstall` 会自动运行 `wrangler types` 生成 `worker-configuration.d.ts`。如果该文件报错，删除后重新执行 `pnpm cf-typegen`。

## 开发

```bash
pnpm dev        # Vite dev server on :3000
```

## 质量检查

```bash
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
pnpm test:ci    # Vitest（Cloudflare Workers pool）
pnpm test:hook  # Node 原生测试（hook 行为验证）
pnpm check      # 以上全部（lint + typecheck + test:ci）
```

## 部署

```bash
pnpm dlx wrangler login   # 首次登录
pnpm deploy               # build + wrangler deploy → review.aixie.de
```

## Stop Hook

`.claude/hooks/verify-before-stop.mjs` 在 Claude Code 的 `Stop` 事件触发时执行：

1. **递归保护** — 检测 `stop_hook_active`，如为 `true` 则跳过（防止与 Codex Review Gate 循环）
2. **变更检测** — 通过 `git diff` 获取变更文件列表，仅关注代码和关键配置文件
3. **跳过条件** — 无代码变更（如仅修改 README）时直接放行
4. **顺序执行** — `pnpm lint` → `pnpm typecheck` → `pnpm test:ci`
5. **阻断机制** — 任一步失败输出 `{ "decision": "block", "reason": "..." }`，Claude Code 将继续修复

配置位于 `.claude/settings.local.json`。

## Claude Code + Codex Review Gate

### 安装 Codex 插件

```text
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
/codex:setup
```

### 启用 / 禁用 Review Gate

```text
/codex:setup --enable-review-gate    # 启用
/codex:setup --disable-review-gate   # 禁用
```

### 工作机制

Codex 插件注册了自己的 `Stop` hook（`stop-review-gate-hook.mjs`），与项目自身的 Stop Hook **并行生效**：

- **未启用时**（默认）：hook 检测到 `stopReviewGate: false`，直接跳过
- **启用后**：hook 调用 `codex-companion.mjs` 发起 Codex review，聚焦于上一轮 Claude 的代码变更
  - Codex 返回 `ALLOW:` → 放行
  - Codex 返回 `BLOCK:` → 转换为 `{ "decision": "block" }` 阻止停止
  - 超时上限 15 分钟

> **注意**：启用 Review Gate 可能导致 Claude / Codex 循环，消耗较多用量。建议仅在主动监控会话时开启。

### 两层 Stop Hook 协作

| 层级 | 来源 | 检查内容 | 触发条件 |
|------|------|----------|----------|
| Deterministic Gate | `.claude/settings.local.json` | lint + typecheck + test | 代码/配置变更时 |
| Codex Review Gate | `codex-plugin-cc` 插件 | AI 代码审查 | `stopReviewGate: true` |

任一层返回 `block`，Claude Code 都会继续当前轮次进行修复。

## ESLint

默认保留 **ESLint**，React / TanStack 规则生态兼容性最佳。

如需替代方案，参考：

- `biome.jsonc.example` — Biome 配置示例
- `docs/linting-options.md` — Linter 选型对比

## 项目结构

```
src/
├── server.ts                 # Worker 入口（handler.fetch）
├── router.tsx                # TanStack Router + QueryClient
├── routeTree.gen.ts          # 自动生成（勿编辑）
├── routes/
│   ├── __root.tsx            # 根布局（shellComponent SSR Streaming）
│   ├── index.tsx             # 首页（SSR 数据 + 架构图）
│   └── api/health.ts         # API 端点
├── lib/
│   ├── runtime.ts            # Cloudflare env 访问
│   ├── diagrams.ts           # Mermaid 架构图定义
│   └── queries/runtime-info.ts  # 服务端函数 + Query Options
├── components/
│   ├── MermaidChart.tsx       # 客户端 Mermaid 渲染组件
│   ├── DefaultCatchBoundary.tsx
│   └── NotFound.tsx
└── styles/app.css

.claude/
├── hooks/verify-before-stop.mjs  # Stop Hook
└── settings.local.json            # Hook 配置

test/                         # Vitest（workerd 环境）
internal-tests/               # Node 原生测试（hook 验证）
```
