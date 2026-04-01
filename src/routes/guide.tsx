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

        <h3>Step 6：Layer 2 — Codex 审查日志</h3>
        <p>
          以下是从 Codex job 日志文件中提取的原始记录，加上中文注解帮助理解。
          注解用 <code className="inline-code">#</code> 标注，其余为日志原文。
          完整原始日志存储在：
        </p>
        <pre className="code-block">{`~/.claude/plugins/data/codex-openai-codex/state/
  <project-slug>/jobs/<job-id>.log`}</pre>

        <h4>第 1 轮：深度代码审查（07:35 ~ 07:41，约 5.5 分钟）</h4>
        <pre className="code-block">{`# 以下时间戳和消息摘自原始日志，中文注解为事后添加

[07:35:35.564Z] Starting Codex Stop Gate Review.
[07:35:41.229Z] Thread ready (019d47f8-25be-...).
[07:35:41.276Z] Turn started (019d47f8-31d9-...).
[07:36:27.724Z] Codex error: Reconnecting... 2/5
[07:37:15.443Z] Codex error: Reconnecting... 5/5

# Codex 的第一条 assistant message（原文）：
[07:37:50.530Z] "使用 using-superpowers，先确认该回合是否真的
  产出了可审查的直接编辑，再只针对那一批改动做 stop-gate review。
  接下来我会核对最近提交和 diff，而不是把上一条回复本身当作证据。"

# Codex 执行的命令（摘选，原始日志记录了每条的 exit code）：
[07:37:50] git status --short / git log --oneline
[07:38:04] git show --name-only 0e86241
[07:38:04] git show --stat --summary 0e86241
[07:38:18] sed -n '1,260p' src/routes/guide.tsx
[07:38:18] sed -n '1,240p' src/lib/diagrams.ts
[07:38:18] sed -n '1,220p' src/routes/__root.tsx
[07:38:18] sed -n '1,260p' src/styles/app.css
[07:38:26] sed -n '261,520p' src/routes/guide.tsx
[07:38:31] sed -n '1,260p' src/routeTree.gen.ts

# 注解：Codex 逐个读取了所有变更文件的完整内容

[07:38:41.358Z] "继续收窄范围。我已经确认上一回合对应的是 0e86241，
  而且确实新增了 /guide 页和相关路由样式，不是单纯状态汇报。
  现在在看这些具体改动是否引入了会阻止发版的问题。"

[07:38:41] sed -n src/components/MermaidChart.tsx
[07:38:41] sed -n src/routes/index.tsx
[07:38:41] cat package.json
[07:38:59] rg "stopReviewGate|codex-companion|ALLOW|BLOCK"
[07:39:09] sed -n .claude/hooks/verify-before-stop.mjs
[07:39:09] sed -n README.md
[07:39:20] git diff b6c5bfa..0e86241 -- (all changed files)

# 注解：Codex 自己跑了质检命令
[07:39:49] pnpm lint       (exit 0)
[07:39:49] pnpm typecheck  (exit 0)
[07:39:49] pnpm test:ci    (exit 1, workerd 在 Codex 沙箱中不可用)

[07:41:08.043Z] "lint、typecheck 都过了。测试我没法在只读沙箱里
  跑完，所以我转去核对文档里最容易出事故的部分：它对外部
  codex-plugin-cc 行为写了很多实测描述，我要确认这些说法
  是不是有本地依据。"

# 日志在 07:41:10 后无新条目（第 1 轮因超时结束，未输出最终判定）`}</pre>

        <div className="callout">
          <strong>观察：</strong>Codex 自主决定了审查策略——
          先确认提交是否有实质编辑，再逐文件读源码，交叉验证文档描述与实际代码是否一致，
          最后自己跑了 lint/typecheck。第 1 轮因耗时过长未能在超时前完成判定。
        </div>

        <h4>第 2 轮：快速放行（07:42 ~ 07:43，45 秒）</h4>
        <p>
          第 1 轮超时后，Claude 继续执行但未做新的代码编辑，
          再次触发 Stop。Codex 这次快速识别出无需审查：
        </p>
        <pre className="code-block">{`# 原始日志（完整，未删减）

[07:42:37.092Z] Starting Codex Stop Gate Review.
[07:42:37.519Z] Starting Codex task thread.
[07:42:39.219Z] Thread ready (019d47fe-8c39-...).
[07:42:39.269Z] Turn started (019d47fe-92a3-...).

[07:42:54.897Z] "Using using-superpowers to load the required workflow,
  then I'll verify whether the immediately previous Claude turn
  actually produced edits before doing any review."

[07:43:10.487Z] git rev-parse --short HEAD  (exit 0)
[07:43:10.489Z] git status --short          (exit 0)
[07:43:10.492Z] git log -1 --stat --oneline (exit 0)

[07:43:22.265Z] ALLOW: previous turn was status/reporting only;
  repo state shows HEAD at 0e86241 with no tracked edits
  from that turn to review.

[07:43:22.311Z] Turn completed.
[07:43:22.341Z] Final output
ALLOW: previous turn was status/reporting only; repo state shows
HEAD at 0e86241 with no tracked edits from that turn to review.`}</pre>

        <div className="callout">
          <strong>关键设计：</strong>Codex 的 review prompt 要求它只审查
          "上一轮 Claude 的直接代码编辑"。如果上一轮只是状态汇报或命令输出
          （没有实际写代码），Codex 会快速返回 ALLOW。
          这是防止 Claude/Codex 无限循环的核心机制之一。
        </div>

        <h4>Review Gate 也能抓 bug</h4>
        <p>
          在编写本文的过程中，Review Gate 实际拦截了一次问题：文章初版将经过编辑注解的日志
          标称为"真实/完整"日志，Codex 审查后返回了：
        </p>
        <pre className="code-block">{`BLOCK: guide page presents edited/inferred review logs
as literal "real/complete" logs.`}</pre>
        <p>
          下图是终端中 Review Gate 拦截时的实际输出截图——可以看到 Stop hook
          反馈的完整 BLOCK 原因，以及随后修复并重新部署的过程：
        </p>
        <figure className="screenshot-figure">
          <img
            src="/images/review-gate-block-terminal.png"
            alt="终端截图：Codex Review Gate 返回 BLOCK，提示日志呈现方式不准确，随后修复并重新部署"
            className="screenshot"
          />
          <figcaption className="muted">
            终端实录：Review Gate 返回 BLOCK 后，Claude 修正文章并重新提交部署
          </figcaption>
        </figure>
        <p>
          这促使我们修正了日志的呈现方式——明确区分原始日志和事后注解。
          这恰好证明了"老师傅复检"的价值：机器质检（lint/typecheck/test）
          不会发现文档准确性问题，但 AI 审查可以。
        </p>
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
