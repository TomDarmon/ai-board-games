import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { MatchStatus } from "~/drizzle/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { matchOrchestrator } from "~/server/orchestrator/match-orchestrator";

export const matchRouter = createTRPCRouter({
	abandon: protectedProcedure
		.input(z.object({ matchId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { matchId } = input;
			const userId = ctx.session.user.id;

			// Verify match belongs to user before abandoning
			try {
				await matchOrchestrator.getMatch(matchId, userId);
			} catch {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Match not found or you don't have access to it",
				});
			}

			await matchOrchestrator.updateMatchStatus(
				matchId,
				MatchStatus.abandoned,
				userId,
			);
		}),
});
