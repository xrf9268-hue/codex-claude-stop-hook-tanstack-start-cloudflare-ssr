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
