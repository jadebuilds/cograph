import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ProposalStatus } from '@prisma/client';

export const proposalRouter = router({
  // List all proposals with filtering options
  list: publicProcedure
    .input(z.object({
      notebookId: z.string().uuid().optional(),
      status: z.nativeEnum(ProposalStatus).optional(),
      authorId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().uuid().optional(), // For pagination
    }))
    .query(async ({ input, ctx }) => {
      const { notebookId, status, authorId, limit, cursor } = input;
      
      // Build where clause based on filters
      const where = {
        notebookId: notebookId ? notebookId : undefined,
        status: status ? status : undefined,
        authorId: authorId ? authorId : undefined,
        id: cursor ? { lt: cursor } : undefined, // For pagination
      };

      // Get one more item than requested for next cursor
      const proposals = await ctx.prisma.proposal.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
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

      // Check if there are more items
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

  // Get a single proposal by ID
  get: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const proposal = await ctx.prisma.proposal.findUnique({
        where: { id: input.id },
        include: {
          author: true,
          notebook: true,
          comments: {
            where: {
              parentId: null, // Only get top-level comments
            },
            include: {
              author: true,
              _count: {
                select: {
                  replies: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!proposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        });
      }

      return proposal;
    }),

  // Create a new proposal
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(200),
      notebookId: z.string().uuid(),
      thresholdPct: z.number().min(0).max(100), // Percentage for passing
      quorum: z.number().int().min(1), // Minimum votes required
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify notebook exists
      const notebook = await ctx.prisma.notebook.findUnique({
        where: { id: input.notebookId },
      });

      if (!notebook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notebook not found',
        });
      }

      return ctx.prisma.proposal.create({
        data: {
          title: input.title,
          notebookId: input.notebookId,
          authorId: ctx.session.userId,
          thresholdPct: input.thresholdPct,
          quorum: input.quorum,
          status: ProposalStatus.DRAFT,
        },
      });
    }),

  // Update a proposal
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(3).max(200).optional(),
      thresholdPct: z.number().min(0).max(100).optional(),
      quorum: z.number().int().min(1).optional(),
      status: z.nativeEnum(ProposalStatus).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify proposal exists and user is author
      const proposal = await ctx.prisma.proposal.findUnique({
        where: { id: input.id },
      });

      if (!proposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        });
      }

      // Only allow author to update (in a real app, you might allow admins too)
      if (proposal.authorId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the proposal author can update it',
        });
      }

      // Only allow updates if not in ACTIVE, PASSED, or REJECTED state
      if (proposal.status !== ProposalStatus.DRAFT && 
          input.status !== ProposalStatus.EXPIRED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot update proposal in current state',
        });
      }

      return ctx.prisma.proposal.update({
        where: { id: input.id },
        data: {
          title: input.title,
          thresholdPct: input.thresholdPct,
          quorum: input.quorum,
          status: input.status,
        },
      });
    }),

  // Delete a proposal (only if in DRAFT status)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Verify proposal exists and user is author
      const proposal = await ctx.prisma.proposal.findUnique({
        where: { id: input.id },
        include: {
          comments: true,
        },
      });

      if (!proposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        });
      }

      // Only allow author to delete
      if (proposal.authorId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the proposal author can delete it',
        });
      }

      // Only allow deletion of DRAFT proposals
      if (proposal.status !== ProposalStatus.DRAFT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft proposals can be deleted',
        });
      }

      // Delete all comments first (cascade doesn't work for self-referential relations)
      if (proposal.comments.length > 0) {
        await ctx.prisma.comment.deleteMany({
          where: { proposalId: input.id },
        });
      }

      return ctx.prisma.proposal.delete({
        where: { id: input.id },
      });
    }),
  
  // Activate a proposal (change from DRAFT to ACTIVE)
  activate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Verify proposal exists and user is author
      const proposal = await ctx.prisma.proposal.findUnique({
        where: { id: input.id },
      });

      if (!proposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        });
      }

      // Only allow author to activate
      if (proposal.authorId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the proposal author can activate it',
        });
      }

      // Only allow activation of DRAFT proposals
      if (proposal.status !== ProposalStatus.DRAFT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft proposals can be activated',
        });
      }

      return ctx.prisma.proposal.update({
        where: { id: input.id },
        data: {
          status: ProposalStatus.ACTIVE,
        },
      });
    }),
});