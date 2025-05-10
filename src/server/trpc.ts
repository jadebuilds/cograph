import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { prisma } from './db';

// Define context type
export interface Context {
  prisma: typeof prisma;
  session: { userId: string } | null;
}

// Context creator for API
export const createContext = async (
  opts: CreateFastifyContextOptions,
): Promise<Context> => {
  // Extract the auth token from the request
  let userId: string | undefined;
  const authHeader = opts.req.headers.authorization;

  if (authHeader) {
    try {
      // In the main server.ts file, we're using JWT verification
      // Here we just assume that token verification happens there
      // and the userId would be extracted and passed properly
      // This will be populated by the server.ts code
    } catch (err) {
      // Invalid token, no userId
    }
  }

  return {
    prisma,
    session: userId ? { userId } : null,
  };
};

// Create tRPC instance
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Add additional error data if needed
        stack: error.code === 'INTERNAL_SERVER_ERROR' && process.env.NODE_ENV !== 'production'
          ? error.stack
          : undefined,
      },
    };
  },
});

// Export procedures and middleware
export const router = t.router;
export const publicProcedure = t.procedure;

// Create protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Infers that session exists and has userId
      session: { ...ctx.session },
    },
  });
});