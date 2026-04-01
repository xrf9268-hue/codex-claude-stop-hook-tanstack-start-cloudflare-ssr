/// <reference types="vite/client" />
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import * as React from 'react';
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary';
import { NotFound } from '~/components/NotFound';
import appCss from '~/styles/app.css?url';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Codex + Claude Stop Hook Starter' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div>
              <p className="eyebrow">TanStack Start + Cloudflare Workers</p>
              <h1>Claude Stop Hook + Codex Review 基础模板</h1>
            </div>
            <nav className="nav-row">
              <Link activeProps={{ className: 'active-link' }} activeOptions={{ exact: true }} to="/">
                首页
              </Link>
              <Link activeProps={{ className: 'active-link' }} to="/guide">
                指南
              </Link>
              <a href="/api/health">/api/health</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
