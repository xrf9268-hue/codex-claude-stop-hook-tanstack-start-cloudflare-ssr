import { createFileRoute } from '@tanstack/react-router';
import { MermaidChart } from '~/components/MermaidChart';
import {
  reviewGateDetailDiagram,
  stopEventSequenceDiagram,
  stopHookDiagram,
} from '~/lib/diagrams';

export const Route = createFileRoute('/guide')({
  component: GuidePage,
});

function GuidePage() {
  return (
    <article>
      {/* ── 开篇 ── */}
      <section className="article-section panel stack">
        <h1 className="article-title">Stop Hook + Codex Review Gate 运作指南</h1>
        <p className="article-subtitle">理论 + 实战：理解 Claude Code 的双层质量门禁</p>
        <p>
          想象一下：你经营一家工厂，产品出厂前要过质检。
          <strong>机器质检</strong>（X 光、称重、尺寸）速度快、标准固定，但只能检查"硬指标"；
          <strong>老师傅复检</strong>则能发现机器看不出的设计缺陷——但速度慢、成本高。
        </p>
        <p>
          Claude Code 的 Stop Hook 就是这条质检流水线。当 Claude 说"我做完了"准备停下时，
          两道门禁依次拦截：
        </p>
        <ol>
          <li>
            <strong>Layer 1 — 机器质检</strong>（<code className="inline-code">verify-before-stop.mjs</code>）：
            自动跑 lint、类型检查、测试。标准固定，不漏不多。
          </li>
          <li>
            <strong>Layer 2 — 老师傅复检</strong>（<code className="inline-code">stop-review-gate-hook.mjs</code>）：
            调用 Codex（OpenAI）对变更做 AI 代码审查，发现设计层面的问题。
          </li>
        </ol>
        <p className="muted">
          任一道门禁喊停，Claude 就不能"下班"，必须回去修。两道都放行，才能结束本轮。
        </p>
      </section>

      {/* ── Layer 1: 机器质检 ── */}
      <section className="article-section panel stack">
        <h2>Layer 1：机器质检 — verify-before-stop.mjs</h2>
        <p>
          这是项目自带的 Stop Hook，配置在{' '}
          <code className="inline-code">.claude/settings.local.json</code> 中。
          它的逻辑很直白：有代码改动？跑三件套。没改动？直接放行。
        </p>

        <h3>执行流程</h3>
        <MermaidChart chart={stopHookDiagram} />

        <h3>Hook 的输入与输出</h3>
        <p>Claude Code 通过 stdin 传入 JSON，Hook 通过 stdout 返回决策：</p>

        <div className="grid-two">
          <div>
            <h4>stdin（Claude Code → Hook）</h4>
            <pre className="code-block">{`{
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "stop_hook_active": false,
  "last_assistant_message": "我已完成..."
}`}</pre>
          </div>
          <div>
            <h4>stdout（Hook → Claude Code）</h4>
            <pre className="code-block">{`// 阻止停止：
{
  "decision": "block",
  "reason": "pnpm lint 失败。先修复后再结束本轮。"
}

// 允许停止：
// （无输出，exit code 0）`}</pre>
          </div>
        </div>

        <div className="callout">
          <strong>递归保护：</strong>当{' '}
          <code className="inline-code">stop_hook_active: true</code> 时，说明 Claude
          正在处理上一次 block 后的修复轮次。此时 Hook 直接跳过，防止
          "质检员检查质检员"的无限循环。
        </div>
      </section>

      {/* ── Layer 2: 老师傅复检 ── */}
      <section className="article-section panel stack">
        <h2>Layer 2：老师傅复检 — Codex Review Gate</h2>
        <p>
          这一层由{' '}
          <a href="https://github.com/openai/codex-plugin-cc" target="_blank" rel="noreferrer">
            codex-plugin-cc
          </a>{' '}
          插件提供。与 Layer 1 不同，它默认<strong>关闭</strong>——毕竟请老师傅来复检要额外花钱（Codex
          用量）。
        </p>

        <h3>state.json：复检开关在哪里？</h3>
        <p>
          Codex 插件用一个 JSON 文件记录"这个项目是否启用了复检"。路径计算规则：
        </p>
        <pre className="code-block">{`$CLAUDE_PLUGIN_DATA/state/<项目名slug>-<路径SHA256前16位>/state.json

# 本项目实际路径：
~/.claude/plugins/data/codex-openai-codex/state/
  codex-claude-stop-hook-tanstack-start-cloudflare-ssr-ddbc86ee5106fb39/
  state.json`}</pre>
        <p>文件内容：</p>
        <pre className="code-block">{`{
  "version": 1,
  "config": {
    "stopReviewGate": true   // ← 这个开关
  },
  "jobs": []
}`}</pre>

        <h3>如何启用 / 禁用</h3>
        <pre className="code-block">{`/codex:setup --enable-review-gate    # 启用
/codex:setup --disable-review-gate   # 禁用`}</pre>

        <h3>Review Gate 详细流程</h3>
        <MermaidChart chart={reviewGateDetailDiagram} />

        <div className="callout">
          <strong>类比：</strong>启用 Review Gate 就像在工厂流水线末尾加了一个"老师傅工位"。
          产品先过机器检（Layer 1），再送到老师傅那里（Layer 2）。
          老师傅看完说"没问题"（ALLOW），产品才能出厂；说"这里设计有问题"（BLOCK），
          就退回去改。老师傅最多等 15 分钟，超时也会退回。
        </div>
      </section>

      {/* ── 完整时序 ── */}
      <section className="article-section panel stack">
        <h2>完整时序：Stop 事件全景</h2>
        <p>
          当 Claude Code 触发 Stop 事件时，所有注册的 Stop hooks（项目 + 插件）被并行调度。
          下面的时序图展示了两层 hook 从触发到返回决策的完整过程：
        </p>
        <MermaidChart chart={stopEventSequenceDiagram} />
        <p className="muted">
          关键点：两层 hook 是并行触发的。只要有一层返回 block，Claude 就不能停止。
          两层都放行（exit 0 且无 block JSON），Claude 才会结束本轮。
        </p>
      </section>

      {/* ── 实战 ── */}
      <section className="article-section panel stack">
        <h2>实战：启用 Review Gate 并测试</h2>
        <p>下面是在本项目中实际启用和测试 Review Gate 的完整记录。</p>

        <h3>Step 1：确认前置条件</h3>
        <pre className="code-block">{`# Codex CLI 已安装
$ codex --version
codex-cli 0.118.0

# Codex 插件已安装
$ cat ~/.claude/plugins/installed_plugins.json | grep codex
"codex@openai-codex": [...]

# Review Gate 当前状态：未启用（state.json 不存在）`}</pre>

        <h3>Step 2：启用 Review Gate</h3>
        <pre className="code-block">{`/codex:setup --enable-review-gate

# 返回结果（JSON）：
{
  "ready": true,
  "codex": {
    "available": true,
    "detail": "codex-cli 0.118.0; advanced runtime available"
  },
  "auth": {
    "loggedIn": true,
    "detail": "authenticated"
  },
  "reviewGateEnabled": true,
  "actionsTaken": [
    "Enabled the stop-time review gate for .../codex-claude-stop-hook-..."
  ]
}`}</pre>

        <h3>Step 3：验证 state.json</h3>
        <p>
          启用后，检查 state.json 确认开关已写入：
        </p>
        <pre className="code-block">{`$ cat ~/.claude/plugins/data/codex-openai-codex/state/\\
  codex-claude-stop-hook-tanstack-start-cloudflare-ssr-ddbc86ee5106fb39/\\
  state.json

{
  "version": 1,
  "config": {
    "stopReviewGate": true    ← 已启用
  },
  "jobs": []
}`}</pre>

        <h3>Step 4：触发 Stop 事件</h3>
        <p>
          做一个代码改动后，让 Claude 完成并尝试停止。此时两层 hook 都会触发：
        </p>
        <ul>
          <li>Layer 1：检测到代码变更 → 顺序执行 lint/typecheck/test</li>
          <li>Layer 2：检测到 <code className="inline-code">stopReviewGate: true</code> → 调用 Codex CLI review</li>
        </ul>

        <h3>Step 5：Layer 1 实际输出</h3>
        <pre className="code-block">{`# verify-before-stop.mjs 执行过程：
$ git diff --name-only HEAD
src/routes/guide.tsx
src/lib/diagrams.ts
src/styles/app.css
src/routes/__root.tsx

# 检测到 4 个代码文件变更，开始质检：
$ pnpm lint        ✓  (0 errors, 3 warnings)
$ pnpm typecheck   ✓
$ pnpm test:ci     ✓  (1 file, 3 tests passed)

# 全部通过 → exit 0（放行）`}</pre>

        <h3>Step 6：Layer 2 实际输出</h3>
        <pre className="code-block">{`# stop-review-gate-hook.mjs 执行过程：
1. 读取 state.json → stopReviewGate: true
2. 检查 Codex 登录状态 → authenticated
3. 构建 review prompt（注入上一轮 Claude 响应）
4. spawnSync codex-companion.mjs task --json <prompt>
5. 等待 Codex 返回...（通常 30s ~ 3min）

# Codex 判定结果：
# - 如果上一轮只是文档/UI 变更 → ALLOW: no code changes to review
# - 如果有逻辑变更且无问题 → ALLOW: changes look good
# - 如果发现问题 → BLOCK: <具体原因>

# 本次结果：ALLOW（放行）→ Claude 成功停止`}</pre>

        <div className="callout">
          <strong>实测体验：</strong>Layer 1（lint/typecheck/test）通常 3~8 秒完成。
          Layer 2（Codex review）首次启动 runtime 约 10~30 秒，后续 review 约 30s~3min。
          两层并行执行，总耗时取决于较慢的那一层（通常是 Codex）。
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="article-section panel stack">
        <h2>常见问题</h2>

        <h3>Review Gate 会不会导致无限循环？</h3>
        <p>
          不会。Claude Code 在因 block 继续修复时，会在 stdin 中设置{' '}
          <code className="inline-code">stop_hook_active: true</code>。
          项目的 verify-before-stop.mjs 检测到这个标志会直接跳过。
          Codex 插件的 hook 也有类似保护——它只审查上一轮的<em>直接代码编辑</em>，
          如果上一轮只是状态报告或修复确认，会直接返回 ALLOW。
        </p>

        <h3>启用后会消耗多少 Codex 用量？</h3>
        <p>
          每次 Stop 事件（Claude 尝试停止时）触发一次 Codex review。
          如果 Codex 返回 BLOCK，Claude 修复后再次停止会再触发一次。
          建议仅在主动监控会话时开启，用完随手关：
        </p>
        <pre className="code-block">{`/codex:setup --disable-review-gate`}</pre>

        <h3>两层 Hook 的执行顺序是什么？</h3>
        <p>
          并行触发，不保证顺序。但只要<strong>任一层</strong>返回{' '}
          <code className="inline-code">{`{"decision":"block"}`}</code>，
          Claude 就会继续修复。全部放行才会真正停止。
        </p>

        <h3>如果 Codex 没安装或没登录怎么办？</h3>
        <p>
          Review Gate hook 会检查 Codex 登录状态。如果未安装或未登录，
          会在 stderr 输出提示信息并跳过审查（不会 block）。运行{' '}
          <code className="inline-code">/codex:setup</code> 可以诊断状态。
        </p>
      </section>
    </article>
  );
}
