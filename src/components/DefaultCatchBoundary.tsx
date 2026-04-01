import { ErrorComponent, Link, type ErrorComponentProps } from '@tanstack/react-router';

export function DefaultCatchBoundary(props: ErrorComponentProps) {
  return (
    <div className="panel stack panel-error">
      <h2>页面渲染失败</h2>
      <p>可以先回到首页，或者根据下面的错误信息继续修复。</p>
      <ErrorComponent {...props} />
      <Link className="button-link" to="/">
        返回首页
      </Link>
    </div>
  );
}
