import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  // Sign in with OAuth provider (simulated)
  signIn: publicProcedure
    .input(
      z.object({
        oauthProvider: z.enum(['github', 'google']),
        oauthId: z.string(),
        name: z.string(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Find existing user or create a new one
      const user = await ctx.prisma.user.upsert({
        where: {
          oauthId: input.oauthId,
        },
        update: {
          name: input.name,
          avatarUrl: input.avatarUrl,
        },
        create: {
          oauthId: input.oauthId,
          name: input.name,
          avatarUrl: input.avatarUrl,
        },
      });

      // In a real app, you'd set up a session/token here
      return {
        user,
        // Return a simulated session token
        sessionToken: `dummy-session-token-for-${user.id}`,
      };
    }),

  // Sign out
  signOut: protectedProcedure
    .mutation(async () => {
      // In a real app, you'd invalidate the session here
      return { success: true };
    }),

  // Get current session
  getSession: publicProcedure
    .query(({ ctx }) => {
      if (!ctx.session?.userId) {
        return null;
      }
      
      return ctx.session;
    }),

  // Get current user
  getUser: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),
});