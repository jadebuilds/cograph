import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const commentRouter = router({
  // List comments by proposal ID
  listByProposal: publicProcedure
    .input(z.object({
      proposalId: z.string().uuid(),
      parentId: z.string().uuid().optional(), // For getting replies to a specific comment
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().uuid().optional(), // For pagination
    }))
    .query(async ({ input, ctx }) => {
      const { proposalId, parentId, limit, cursor } = input;
      
      // Build where clause
      const where = {
        proposalId,
        parentId: parentId !== undefined ? parentId : null, // Specifically handle null for top-level comments
        id: cursor ? { lt: cursor } : undefined, // For pagination
      };

      // Get one more item than requested for next cursor
      const comments = await ctx.prisma.comment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
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

      // Check if there are more items
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

  // Get a single comment with its replies
  get: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
              _count: {
                select: {
                  replies: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      return comment;
    }),

  // Create a comment
  create: protectedProcedure
    .input(z.object({
      proposalId: z.string().uuid(),
      parentId: z.string().uuid().optional(),
      content: z.string().min(1).max(10000),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify proposal exists
      const proposal = await ctx.prisma.proposal.findUnique({
        where: { id: input.proposalId },
      });

      if (!proposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        });
      }

      // If replying to a comment, verify parent exists
      if (input.parentId) {
        const parentComment = await ctx.prisma.comment.findUnique({
          where: { id: input.parentId },
        });

        if (!parentComment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent comment not found',
          });
        }

        // Ensure parent comment belongs to the same proposal
        if (parentComment.proposalId !== input.proposalId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Parent comment does not belong to this proposal',
          });
        }
      }

      return ctx.prisma.comment.create({
        data: {
          proposalId: input.proposalId,
          authorId: ctx.session.userId,
          parentId: input.parentId,
          content: input.content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
    }),

  // Update a comment
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      content: z.string().min(1).max(10000),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify comment exists and user is author
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.id },
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      // Only allow author to update
      if (comment.authorId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the comment author can update it',
        });
      }

      return ctx.prisma.comment.update({
        where: { id: input.id },
        data: {
          content: input.content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
    }),

  // Delete a comment
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Verify comment exists and user is author
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.id },
        include: {
          replies: true,
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      // Only allow author to delete
      if (comment.authorId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the comment author can delete it',
        });
      }

      // Delete all replies first if any exist
      if (comment.replies.length > 0) {
        await ctx.prisma.comment.deleteMany({
          where: { parentId: input.id },
        });
      }

      return ctx.prisma.comment.delete({
        where: { id: input.id },
      });
    }),
});