import type { UIMessage } from "ai";
import { z } from "zod";
import { GameType, PlayerId } from "~/drizzle/schema";
import {
	type MatchCompleteData as MatchCompleteDataType,
	type MatchInitData as MatchInitDataType,
	type MatchTurnData as MatchTurnDataType,
	aiPlayerConfigSchema,
} from "./@types";

// Re-export shared types from centralized location
export {
	MatchEventType,
	type MatchInitData,
	type MatchTurnData,
	type MatchCompleteData,
} from "./@types";

export type MatchUIMessage = UIMessage<{
	"match-init": MatchInitDataType;
	"match-turn": MatchTurnDataType;
	"match-complete": MatchCompleteDataType;
}>;

export enum dataPartNames {
	matchInit = "data-match-init",
	matchTurn = "data-match-turn",
	matchComplete = "data-match-complete",
}

/**
 * Client-to-server match configuration schema
 * Used for the streaming API endpoint
 */

export const matchConfigSchema = z
	.object({
		matchId: z.string().optional(),
		gameType: z.enum(GameType).optional().default(GameType.ticTacToe),
		sharedPrompt: z.string().nullable().optional(),
		playerXAgentId: z.string().optional(),
		playerOAgentId: z.string().optional(),
		playerConfigs: z
			.object({
				[PlayerId.X]: aiPlayerConfigSchema.optional().nullable(),
				[PlayerId.O]: aiPlayerConfigSchema.optional().nullable(),
			})
			.optional(),
	})
	.default({
		gameType: GameType.ticTacToe,
	});

export type MatchConfig = z.infer<typeof matchConfigSchema>;
