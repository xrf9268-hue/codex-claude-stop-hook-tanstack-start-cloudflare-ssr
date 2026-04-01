export const ssrArchitectureDiagram = `flowchart TB
  A["HTTP 请求<br/>review.aixie.de"] --> B["Cloudflare Worker<br/>workerd Runtime"]
  B --> C["src/server.ts<br/>handler.fetch"]
  C --> D["TanStack Start SSR Engine"]
  D --> E{"路由匹配<br/>routeTree.gen.ts"}
  E -->|"页面路由 /"| F["Route Loader<br/>ensureQueryData"]
  E -->|"API 路由 /api/*"| G["server.handlers<br/>GET / POST"]
  F --> H["createServerFn<br/>服务端函数"]
  H --> I["cloudflare:workers<br/>env.MY_VAR"]
  F --> J["React 组件<br/>useSuspenseQuery"]
  J --> K["shellComponent<br/>SSR Streaming"]
  K --> L["HTML Stream<br/>响应客户端"]
  G --> M["Response.json"]
  L --> N["React Hydration<br/>客户端接管"]
  N --> O["交互式 SPA"]`;

export const stopHookDiagram = `flowchart TB
  A["Claude Code<br/>准备结束本轮"] --> B{"Stop 事件<br/>触发所有 hooks"}
  B --> C["verify-before-stop.mjs<br/>项目质量门禁"]
  C --> D{"stop_hook_active?"}
  D -->|"是 — 递归保护"| Z["允许停止"]
  D -->|"否"| F["git diff<br/>检测变更文件"]
  F --> G{"有代码/配置<br/>变更?"}
  G -->|"无变更"| Z
  G -->|"有变更"| H["pnpm lint"]
  H -->|"通过"| I["pnpm typecheck"]
  H -->|"失败"| BL1["block: lint 失败"]
  I -->|"通过"| K["pnpm test:ci<br/>workerd 环境"]
  I -->|"失败"| BL2["block: typecheck 失败"]
  K -->|"通过"| Z
  K -->|"失败"| BL3["block: test 失败"]
  BL1 --> FIX["Claude 继续修复"]
  BL2 --> FIX
  BL3 --> FIX
  FIX --> A

  B --> CRG["stop-review-gate-hook.mjs<br/>Codex Plugin"]
  CRG --> CK{"stopReviewGate<br/>已启用?"}
  CK -->|"否"| Z
  CK -->|"是"| CR["Codex CLI<br/>review 上一轮变更"]
  CR --> CJ{"Codex 判定"}
  CJ -->|"ALLOW"| Z
  CJ -->|"BLOCK"| BL4["block: 需要修复"]
  BL4 --> FIX`;

export const buildPipelineDiagram = `flowchart LR
  A["pnpm dev"] --> B["Vite Dev Server<br/>:3000"]
  B --> C["cloudflare plugin<br/>SSR env"]
  C --> D["tanstackStart plugin<br/>路由 + ServerFn"]
  D --> E["viteReact plugin<br/>JSX + HMR"]

  F["pnpm build"] --> G["Vite Build"]
  G --> H["dist/server/<br/>Worker Bundle"]
  G --> I["dist/client/<br/>Client Assets"]

  J["pnpm deploy"] --> F
  F --> K["wrangler deploy"]
  K --> L["review.aixie.de<br/>Cloudflare Edge"]

  M["pnpm check"] --> N["pnpm lint"]
  N --> O["pnpm typecheck"]
  O --> P["pnpm test:ci"]
  P --> Q["Quality Gate<br/>通过"]`;

export const reviewGateDetailDiagram = `flowchart TB
  A["stop-review-gate-hook.mjs<br/>收到 Stop 事件 stdin"] --> B["读取 state.json<br/>检查 config.stopReviewGate"]
  B --> C{"stopReviewGate<br/>已启用?"}
  C -->|"false（默认）"| Z["exit 0<br/>允许停止"]
  C -->|"true"| D["检查 Codex CLI<br/>登录状态"]
  D -->|"未登录"| W["stderr 提示<br/>运行 /codex:setup"]
  D -->|"已登录"| E["构建 review prompt<br/>注入上一轮 Claude 响应"]
  E --> F["spawnSync codex-companion.mjs<br/>task --json prompt"]
  F --> G{"等待 Codex<br/>（上限 15 分钟）"}
  G -->|"超时"| BL1["block: review 超时"]
  G -->|"返回结果"| H["解析 JSON output"]
  H --> I{"首行判定"}
  I -->|"ALLOW: ..."| Z
  I -->|"BLOCK: ..."| BL2["block: 需要修复<br/>附带 Codex 原因"]
  I -->|"格式异常"| BL3["block: 输出无法解析"]`;

export const stopEventSequenceDiagram = `sequenceDiagram
  participant CC as Claude Code
  participant SE as Stop 事件分发
  participant VH as verify-before-stop.mjs
  participant RG as stop-review-gate-hook.mjs
  participant GIT as git
  participant SJ as state.json
  participant CX as Codex CLI

  CC->>SE: 准备结束本轮
  Note over SE: 收集所有注册的 Stop hooks<br/>（项目 + 插件）

  par 并行触发两层 hook
    SE->>VH: stdin: {"stop_hook_active": false, ...}
    SE->>RG: stdin: {"stop_hook_active": false, ...}
  end

  Note over VH: Layer 1: 机器质检
  VH->>VH: 检查 stop_hook_active
  VH->>GIT: git diff --name-only HEAD
  GIT-->>VH: 变更文件列表
  alt 无代码变更
    VH-->>SE: exit 0（放行）
  else 有代码变更
    VH->>VH: pnpm lint
    VH->>VH: pnpm typecheck
    VH->>VH: pnpm test:ci
    alt 全部通过
      VH-->>SE: exit 0（放行）
    else 任一失败
      VH-->>SE: {"decision":"block","reason":"..."}
    end
  end

  Note over RG: Layer 2: 老师傅复检
  RG->>SJ: 读取 config.stopReviewGate
  alt 未启用（默认）
    RG-->>SE: exit 0（跳过）
  else 已启用
    RG->>CX: codex-companion.mjs task --json
    Note over CX: Codex 审查上一轮<br/>代码变更（≤15min）
    CX-->>RG: ALLOW / BLOCK
    alt ALLOW
      RG-->>SE: exit 0（放行）
    else BLOCK
      RG-->>SE: {"decision":"block","reason":"..."}
    end
  end

  SE->>CC: 综合结果
  Note over CC: 全部放行 → 停止<br/>任一 block → 继续修复`;
