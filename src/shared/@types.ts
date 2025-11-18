/**
 * Shared enums and types for game engines and orchestration.
 *
 * Centralizes all cross-cutting game definitions so both the
 * backend routers/orchestrators and the frontend UI can rely
 * on a single source of truth.
 */

import { z } from "zod";
import type { GameType, PlayerType } from "~/drizzle/schema";
import { PlayerId } from "~/drizzle/schema";

export const PLAYER_TURN_ORDER: readonly PlayerId[] = [PlayerId.X, PlayerId.O];

export enum GameStatus {
	playing = "playing",
	finished = "finished",
}

export enum GameResult {
	X = "X",
	O = "O",
	draw = "draw",
	none = "none",
}

/**
 * Game-specific move helpers. Engines can use the strongly typed helpers for clarity
 * while the generic Move type remains flexible for orchestration and persistence.
 */
export type TicTacToeMove = {
	position: number;
};

export type ConnectFourMove = {
	column: number;
};

export type ChessPromotionPiece = "q" | "r" | "b" | "n";

export type ChessMove = {
	from: string;
	to: string;
	promotion?: ChessPromotionPiece;
};

/**
 * A move in the game - structure depends on game type.
 * Tic-Tac-Toe: { position: number }
 * Connect Four: { column: number }
 * Chess: { from: string, to: string, promotion?: "q" | "r" | "b" | "n" }
 */
export type Move = {
	[key: string]: number | string | boolean | null | undefined;
};

/**
 * Serialized game state - JSON-serializable representation.
 */
export type SerializedState = Record<string, unknown>;

export type ChessSerializedState = {
	fen: string;
};

/**
 * Result of applying a move.
 */
export type MoveResult = {
	nextState: SerializedState;
	nextPlayer: PlayerId;
	status: GameStatus;
	result: GameResult;
};

/**
 * Generic game engine interface.
 * All game-specific logic should implement this interface.
 */
export interface Engine {
	/**
	 * Get the initial game state.
	 */
	initialState(): SerializedState;

	/**
	 * Get all legal moves for the current player given a state.
	 */
	listLegalMoves(state: SerializedState, currentPlayer: PlayerId): Move[];

	/**
	 * Validate if a move is legal.
	 */
	isLegalMove(
		state: SerializedState,
		move: Move,
		currentPlayer: PlayerId,
	): boolean;

	/**
	 * Apply a move to a state and return the new state and game status.
	 * Should not mutate the input state.
	 */
	applyMove(
		state: SerializedState,
		move: Move,
		currentPlayer: PlayerId,
	): MoveResult;

	/**
	 * Check if the game is in a terminal state (finished).
	 */
	isTerminal(state: SerializedState): boolean;

	/**
	 * Get the game result if terminal, GameResult.none otherwise.
	 */
	getResult(state: SerializedState): GameResult;

	/**
	 * Serialize state to JSON (for persistence).
	 */
	serialize(state: SerializedState): string;

	/**
	 * Deserialize state from JSON (for resuming).
	 */
	deserialize(serialized: string): SerializedState;

	/**
	 * Get the next player after a move (X -> O, O -> X).
	 */
	getNextPlayer(currentPlayer: PlayerId): PlayerId;
}

/**
 * AI Player Configuration - Zod schema and type
 */
export const aiPlayerConfigSchema = z.object({
	model: z.string(),
	prompt: z.string().nullable().optional(),
});

export type AiPlayerConfig = z.infer<typeof aiPlayerConfigSchema>;

/**
 * Configuration for creating a new match (orchestrator-level).
 */
export type CreateMatchConfig = {
	gameType: GameType;
	userId: string;
	playerXType: PlayerType;
	playerXAgentId?: string | null;
	playerOType: PlayerType;
	playerOAgentId?: string | null;
};

/**
 * Result of processing a turn in the match orchestrator.
 */
export type TurnResult = {
	matchId: string;
	turnNumber: number;
	newState: SerializedState;
	currentPlayer: PlayerId;
	status: GameStatus;
	result: GameResult;
};

export const isGameStatus = (value: unknown): value is GameStatus =>
	value === GameStatus.playing || value === GameStatus.finished;

export const isGameResult = (value: unknown): value is GameResult =>
	value === GameResult.X ||
	value === GameResult.O ||
	value === GameResult.draw ||
	value === GameResult.none;

/**
 * Match streaming event types for real-time game updates
 */
export enum MatchEventType {
	matchInit = "match-init",
	matchTurn = "match-turn",
	matchComplete = "match-complete",
}

export enum TurnStatus {
	loading = "loading",
	success = "success",
	illegal = "illegal",
}

export type MatchInitData = {
	type: MatchEventType.matchInit;
	matchId: string;
	gameType: GameType;
	status: "created";
	playerXAgentName?: string | null;
	playerOAgentName?: string | null;
	playerXModel?: string | null;
	playerOModel?: string | null;
};

export type MatchTurnData = {
	type: MatchEventType.matchTurn;
	turnNumber: number;
	player: PlayerId;
	move: Move;
	status: TurnStatus;
	illegalAttempts?: number;
};

export type MatchCompleteData = {
	type: MatchEventType.matchComplete;
	matchId: string;
	winner: GameResult;
	totalTurns: number;
	status: "finished";
};

/**
 * UI-specific types for match streaming components
 */
export type Turn = {
	turnNumber: number;
	player: PlayerId;
	move: Move;
	status: TurnStatus;
};

export type MatchStreamState = {
	matchId: string | null;
	isComplete: boolean;
	winner: GameResult | null;
	currentPlayer: PlayerId | null;
	turns: Turn[];
	loading: boolean;
	error: Error | null;
};

export type ReplayState = {
	currentStep: number;
	maxStep: number;
	isLive: boolean;
};
