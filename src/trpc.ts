import { initTRPC } from '@trpc/server';
import { z } from 'zod';

// Create a tRPC instance
export const t = initTRPC.create();

// Create router and procedure helpers
const router = t.router;
const publicProcedure = t.procedure;

// Define the router with a "hello" procedure
export const appRouter = router({
  hello: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return {
        greeting: `hello ${input.name ?? 'world'}`,
      };
    }),
});

// Export type router type signature
export type AppRouter = typeof appRouter;