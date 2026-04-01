import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <div className="panel stack">
      <h2>页面不存在</h2>
      <p>这个地址没有匹配到 TanStack Start 路由。</p>
      <Link className="button-link" to="/">
        回到首页
      </Link>
    </div>
  );
}
