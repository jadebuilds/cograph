import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const notebookRouter = router({
  // List all notebooks
  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.notebook.findMany({
        orderBy: {
          filePath: 'asc',
        },
      });
    }),
  
  // Get a single notebook by ID
  get: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const notebook = await ctx.prisma.notebook.findUnique({
        where: { id: input.id },
        include: {
          proposals: {
            select: {
              id: true,
              title: true,
              status: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!notebook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notebook not found',
        });
      }

      return notebook;
    }),
  
  // Create a new notebook
  create: protectedProcedure
    .input(z.object({ 
      filePath: z.string().min(1)
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if notebook with this path already exists
      const existing = await ctx.prisma.notebook.findUnique({
        where: { filePath: input.filePath },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A notebook with this file path already exists',
        });
      }

      return ctx.prisma.notebook.create({
        data: {
          filePath: input.filePath,
        },
      });
    }),
  
  // Update a notebook
  update: protectedProcedure
    .input(z.object({ 
      id: z.string().uuid(),
      filePath: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if notebook exists
      const notebook = await ctx.prisma.notebook.findUnique({
        where: { id: input.id },
      });

      if (!notebook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notebook not found',
        });
      }

      // Check if path is already used by another notebook
      const existing = await ctx.prisma.notebook.findFirst({
        where: { 
          filePath: input.filePath,
          id: { not: input.id },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A notebook with this file path already exists',
        });
      }

      return ctx.prisma.notebook.update({
        where: { id: input.id },
        data: {
          filePath: input.filePath,
        },
      });
    }),
  
  // Delete a notebook
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check if notebook exists
      const notebook = await ctx.prisma.notebook.findUnique({
        where: { id: input.id },
        include: { proposals: true },
      });

      if (!notebook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notebook not found',
        });
      }

      // Check if notebook has proposals
      if (notebook.proposals.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete notebook with existing proposals',
        });
      }

      return ctx.prisma.notebook.delete({
        where: { id: input.id },
      });
    }),
});