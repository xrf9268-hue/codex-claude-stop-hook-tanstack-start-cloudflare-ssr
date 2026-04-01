import { env } from 'cloudflare:workers';

export interface RuntimeInfo {
  runtime: 'cloudflare-workers';
  binding: string;
  userAgent: string;
}

export function readBindingValue(): string {
  return env.MY_VAR ?? 'MY_VAR is not configured';
}

export function buildRuntimeInfo(userAgent = navigator.userAgent): RuntimeInfo {
  return {
    runtime: 'cloudflare-workers',
    binding: readBindingValue(),
    userAgent,
  };
}
