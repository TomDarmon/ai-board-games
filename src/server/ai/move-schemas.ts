/**
 * Zod schemas for structured output per game type
 * Used with Mastra's structuredOutput for reliable move parsing
 */

import { z } from "zod";
import { GameType } from "~/drizzle/schema";

/**
 * Tic-Tac-Toe move schema: position (0-8)
 */
const ticTacToeMoveSchema = z.object({
	position: z.number().int().min(0).max(8),
});

/**
 * Connect Four move schema: column (0-6)
 */
export const connectFourMoveSchema = z.object({
	column: z.number().int().min(0).max(6),
});

/**
 * Chess move schema: from/to squares + optional promotion
 */
const chessMoveSchema = z.object({
	from: z
		.string()
		.length(2)
		.regex(/^[a-h][1-8]$/),
	to: z
		.string()
		.length(2)
		.regex(/^[a-h][1-8]$/),
	promotion: z.enum(["q", "r", "b", "n"]).optional(),
});

/**
 * Get the appropriate move schema for a game type
 */
export function getMoveSchema(gameType: GameType) {
	switch (gameType) {
		case GameType.ticTacToe:
			return ticTacToeMoveSchema;
		case GameType.connectFour:
			return connectFourMoveSchema;
		case GameType.chess:
			return chessMoveSchema;
		default:
			throw new Error(`No move schema for game type: ${gameType}`);
	}
}
