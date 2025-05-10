import { router } from '../trpc';
import { authRouter } from './auth';
import { notebookRouter } from './notebooks';
import { proposalRouter } from './proposals';
import { commentRouter } from './comments';
import { userRouter } from './users';

export const appRouter = router({
  auth: authRouter,
  notebooks: notebookRouter,
  proposals: proposalRouter,
  comments: commentRouter,
  users: userRouter,
});

export type AppRouter = typeof appRouter;