import { useEffect, useRef, useState } from 'react';

interface MermaidChartProps {
  chart: string;
  title?: string;
}

export function MermaidChart({ chart, title }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            darkMode: true,
            background: '#17213a',
            primaryColor: '#1e3a5f',
            primaryTextColor: '#eef3ff',
            primaryBorderColor: '#7dd3fc',
            lineColor: '#7dd3fc',
            secondaryColor: '#2a1f4e',
            tertiaryColor: '#1a3a2a',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
        });
        const id = `mermaid-${Math.random().toString(36).slice(2, 8)}`;
        const { svg: rendered } = await mermaid.render(id, chart);
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className="panel panel-error stack">
        {title && <h3>{title}</h3>}
        <pre className="code-block">{chart}</pre>
        <p className="muted">Mermaid render error: {error}</p>
      </div>
    );
  }

  return (
    <div className="panel stack">
      {title && <h3>{title}</h3>}
      {svg ? (
        <div
          ref={containerRef}
          className="mermaid-container"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="mermaid-placeholder">Loading diagram...</div>
      )}
    </div>
  );
}
