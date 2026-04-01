import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { buildRuntimeInfo } from '~/lib/runtime';

const getRuntimeInfo = createServerFn({ method: 'GET' }).handler(() => {
  return buildRuntimeInfo();
});

export const runtimeInfoQueryOptions = queryOptions({
  queryKey: ['runtime-info'],
  queryFn: () => getRuntimeInfo(),
});
