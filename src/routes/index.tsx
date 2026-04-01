import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { MermaidChart } from '~/components/MermaidChart';
import {
  buildPipelineDiagram,
  ssrArchitectureDiagram,
  stopHookDiagram,
} from '~/lib/diagrams';
import { runtimeInfoQueryOptions } from '~/lib/queries/runtime-info';

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(runtimeInfoQueryOptions),
  component: HomePage,
});

function HomePage() {
  const { data } = useSuspenseQuery(runtimeInfoQueryOptions);

  return (
    <>
      <section className="grid-two">
        <article className="panel stack">
          <h2>当前运行环境</h2>
          <dl className="info-grid">
            <div>
              <dt>Runtime</dt>
              <dd>{data.runtime}</dd>
            </div>
            <div>
              <dt>Binding</dt>
              <dd>{data.binding}</dd>
            </div>
          </dl>
          <p className="muted">SSR 首屏数据通过 TanStack Query + TanStack Router 集成预取。</p>
        </article>

        <article className="panel stack">
          <h2>User-Agent</h2>
          <pre className="code-block">{data.userAgent}</pre>
        </article>

        <article className="panel stack full-span">
          <h2>Stop hook 会做什么</h2>
          <ol>
            <li>只在存在代码或关键配置变更时触发。</li>
            <li>依次执行 <code>pnpm lint</code>、<code>pnpm typecheck</code>、<code>pnpm test:ci</code>。</li>
            <li>任一步失败就向 Claude Code 返回 block，让本轮继续修复。</li>
          </ol>
        </article>
      </section>

      <section className="diagrams-section">
        <h2 className="section-title">Architecture</h2>
        <div className="diagram-grid">
          <MermaidChart title="SSR 数据流" chart={ssrArchitectureDiagram} />
          <MermaidChart title="Stop Hook + Codex Review Gate" chart={stopHookDiagram} />
          <MermaidChart title="构建 / 部署流水线" chart={buildPipelineDiagram} />
        </div>
      </section>
    </>
  );
}
