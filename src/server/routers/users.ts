import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  // Get user profile
  getProfile: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          _count: {
            select: {
              proposals: true,
              comments: true,
            },
          },
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

  // Get user's proposals
  getUserProposals: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      limit: z.number().int().min(1).max(100).default(10),
      cursor: z.string().uuid().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { userId, limit, cursor } = input;
      
      const proposals = await ctx.prisma.proposal.findMany({
        where: {
          authorId: userId,
          id: cursor ? { lt: cursor } : undefined,
        },
        include: {
          notebook: {
            select: {
              id: true,
              filePath: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit + 1,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (proposals.length > limit) {
        const nextItem = proposals.pop();
        nextCursor = nextItem?.id;
      }

      return {
        proposals,
        nextCursor,
      };
    }),

  // Get user's comments
  getUserComments: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().uuid().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { userId, limit, cursor } = input;
      
      const comments = await ctx.prisma.comment.findMany({
        where: {
          authorId: userId,
          id: cursor ? { lt: cursor } : undefined,
        },
        include: {
          proposal: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit + 1,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (comments.length > limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem?.id;
      }

      return {
        comments,
        nextCursor,
      };
    }),

  // Update profile (authenticated user can only update their own profile)
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // At least one field to update must be provided
      if (!input.name && !input.avatarUrl) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'At least one field to update must be provided',
        });
      }

      return ctx.prisma.user.update({
        where: { id: ctx.session.userId },
        data: {
          name: input.name,
          avatarUrl: input.avatarUrl,
        },
      });
    }),
});