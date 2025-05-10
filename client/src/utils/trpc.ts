import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../src/server/routers/root';

// Create a tRPC client
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/trpc',
      // Add headers with auth token from localStorage if it exists
      headers() {
        const token = localStorage.getItem('auth_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});