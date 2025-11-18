import { agentRouter } from "~/server/api/routers/agent";
import { aiRouter } from "~/server/api/routers/ai";
import { chessRouter } from "~/server/api/routers/chess";
import { connectFourRouter } from "~/server/api/routers/connectfour";
import { matchRouter } from "~/server/api/routers/match";
import { ticTacToeRouter } from "~/server/api/routers/tictactoe";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	agent: agentRouter,
	ticTacToe: ticTacToeRouter,
	connectFour: connectFourRouter,
	chess: chessRouter,
	match: matchRouter,
	ai: aiRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
