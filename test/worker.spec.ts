import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { buildRuntimeInfo, readBindingValue } from '../src/lib/runtime';

describe('Cloudflare Worker integration', () => {
  it('exposes Wrangler vars in the runtime env', () => {
    expect(env.MY_VAR).toBe('Hello from Cloudflare');
  });

  it('reads binding value from Cloudflare env', () => {
    expect(readBindingValue()).toBe('Hello from Cloudflare');
  });

  it('builds runtime info with correct shape', () => {
    const info = buildRuntimeInfo();
    expect(info.runtime).toBe('cloudflare-workers');
    expect(info.binding).toBe('Hello from Cloudflare');
    expect(typeof info.userAgent).toBe('string');
  });
});
