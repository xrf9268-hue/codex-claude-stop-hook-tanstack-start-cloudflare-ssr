import { SELF, env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

describe('Cloudflare Worker integration', () => {
  it('exposes Wrangler vars in the runtime env', () => {
    expect(env.MY_VAR).toBe('Hello from Cloudflare');
  });

  it('serves the TanStack Start server route at /api/health', async () => {
    const response = await SELF.fetch('http://example.com/api/health');
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      ok: boolean;
      runtime: string;
      binding: string;
      userAgent: string;
    };

    expect(payload.ok).toBe(true);
    expect(payload.runtime).toBe('cloudflare-workers');
    expect(payload.binding).toBe('Hello from Cloudflare');
    expect(typeof payload.userAgent).toBe('string');
  });
});
