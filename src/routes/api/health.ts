import { createFileRoute } from '@tanstack/react-router';
import { buildRuntimeInfo } from '~/lib/runtime';

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          ok: true,
          ...buildRuntimeInfo(),
        });
      },
    },
  },
});
