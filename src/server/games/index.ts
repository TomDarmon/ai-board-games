/**
 * Game engine registry and utilities
 */

import type { GameType } from "~/drizzle/schema";
import type { Engine } from "../../shared/@types";
import { chessEngine } from "./chess";
import { connectFourEngine } from "./connectFour";
import { ticTacToeEngine } from "./ticTacToe";

const ENGINE_REGISTRY: Record<GameType, Engine> = {
	ticTacToe: ticTacToeEngine,
	connectFour: connectFourEngine,
	chess: chessEngine,
};

/**
 * Get the engine for a specific game type
 */
export function getEngine(gameType: GameType): Engine {
	const engine = ENGINE_REGISTRY[gameType];
	if (!engine) {
		throw new Error(`Unknown game type: ${gameType}`);
	}
	return engine;
}

export { chessEngine };
export * from "../../shared/@types";
