/**
 * Match Orchestrator Service
 *
 * Handles match lifecycle, turn processing, and state management.
 * Works with the generic Engine interface to support any game type.
 */

import { and, asc, desc, eq } from "drizzle-orm";
import { type GameType, MatchStatus, PlayerId } from "~/drizzle/schema";
import { db } from "~/server/db";
import { GameResult, GameStatus, getEngine } from "~/server/games";
import type {
	CreateMatchConfig,
	Move,
	SerializedState,
	TurnResult,
} from "~/server/games";

import { agentProfile, gameMatch, gameTurn } from "~/drizzle/schema";

/**
 * Match orchestrator class
 */
const AGENT_ILLEGAL_THRESHOLD = 3;

class MatchOrchestrator {
	/**
	 * Create a new match with initial state
	 */
	async createMatch(config: CreateMatchConfig) {
		const engine = getEngine(config.gameType);
		const initialState = engine.initialState();
		const serializedState = engine.serialize(initialState);

		const playerXType = config.playerXType;
		const playerOType = config.playerOType;

		// Validate agent IDs if provided
		if (config.playerXAgentId) {
			const agent = await db.query.agentProfile.findFirst({
				where: eq(agentProfile.id, config.playerXAgentId),
			});
			if (!agent) {
				throw new Error(`Agent profile not found: ${config.playerXAgentId}`);
			}
		}

		if (config.playerOAgentId) {
			const agent = await db.query.agentProfile.findFirst({
				where: eq(agentProfile.id, config.playerOAgentId),
			});
			if (!agent) {
				throw new Error(`Agent profile not found: ${config.playerOAgentId}`);
			}
		}

		const match = await db
			.insert(gameMatch)
			.values({
				gameType: config.gameType,
				userId: config.userId,
				playerXtype: playerXType,
				playerXagentId: config.playerXAgentId ?? null,
				playerOtype: playerOType,
				playerOagentId: config.playerOAgentId ?? null,
				state: serializedState,
				currentPlayer: PlayerId.X,
				status: MatchStatus.playing,
			})
			.returning();

		if (!match[0]) {
			throw new Error("Failed to create match");
		}

		return match[0];
	}

	/**
	 * Get match with full details including turns
	 */
	async getMatch(matchId: string, userId?: string) {
		const conditions = [eq(gameMatch.id, matchId)];
		if (userId) {
			conditions.push(eq(gameMatch.userId, userId));
		}

		const match = await db.query.gameMatch.findFirst({
			where: conditions.length > 1 ? and(...conditions) : conditions[0],
			with: {
				gameTurns: {
					orderBy: asc(gameTurn.moveNumber),
				},
				playerXAgent: true,
				playerOAgent: true,
			},
		});

		if (!match) {
			throw new Error(`Match not found: ${matchId}`);
		}

		return match;
	}

	/**
	 * Process a turn (move) for a match
	 * Validates the move, applies it, and persists the updated state
	 */
	async processTurn(
		matchId: string,
		move: Move,
		playerId?: PlayerId, // Optional: if not provided, uses match.currentPlayer
	): Promise<TurnResult> {
		// Get match and validate
		const match = await db.query.gameMatch.findFirst({
			where: eq(gameMatch.id, matchId),
			with: {
				gameTurns: {
					orderBy: asc(gameTurn.moveNumber),
				},
			},
		});

		if (!match) {
			throw new Error(`Match not found: ${matchId}`);
		}

		if (match.status !== MatchStatus.playing) {
			throw new Error("Match is not in playing status");
		}

		// Determine the player making the move
		const matchCurrentPlayer = match.currentPlayer as PlayerId;
		const currentPlayer = (playerId ?? matchCurrentPlayer) as PlayerId;

		if (currentPlayer !== matchCurrentPlayer) {
			throw new Error(
				`Not ${currentPlayer}'s turn. Current player: ${matchCurrentPlayer}`,
			);
		}

		// Get engine and deserialize state
		const engine = getEngine(match.gameType);
		const state = engine.deserialize(match.state);

		// Validate move
		if (!engine.isLegalMove(state, move, currentPlayer)) {
			throw new Error("Illegal move");
		}

		// Apply move
		const moveResult = engine.applyMove(state, move, currentPlayer);
		const nextTurnNumber = (match.gameTurns?.length ?? 0) + 1;

		// Persist turn and update match state in a batch
		await db.batch([
			db.insert(gameTurn).values({
				matchId,
				player: currentPlayer,
				moveNumber: nextTurnNumber,
				moveData: JSON.stringify(move),
				stateAfterMove: engine.serialize(moveResult.nextState),
			}),

			db
				.update(gameMatch)
				.set({
					state: engine.serialize(moveResult.nextState),
					currentPlayer: moveResult.nextPlayer,
					status:
						moveResult.status === GameStatus.finished
							? MatchStatus.finished
							: MatchStatus.playing,
					winner:
						moveResult.result === GameResult.none ? null : moveResult.result,
				})
				.where(eq(gameMatch.id, matchId)),
		]);

		return {
			matchId,
			turnNumber: nextTurnNumber,
			newState: moveResult.nextState,
			currentPlayer: moveResult.nextPlayer,
			status: moveResult.status,
			result: moveResult.result,
		};
	}

	/**
	 * Get the current state of a match
	 */
	async getMatchState(matchId: string): Promise<SerializedState> {
		const match = await db.query.gameMatch.findFirst({
			where: eq(gameMatch.id, matchId),
		});

		if (!match) {
			throw new Error(`Match not found: ${matchId}`);
		}

		const engine = getEngine(match.gameType);
		return engine.deserialize(match.state);
	}

	/**
	 * Get legal moves for the current player in a match
	 */
	async getLegalMoves(matchId: string): Promise<Move[]> {
		const match = await db.query.gameMatch.findFirst({
			where: eq(gameMatch.id, matchId),
		});

		if (!match) {
			throw new Error(`Match not found: ${matchId}`);
		}

		if (match.status !== MatchStatus.playing) {
			return [];
		}

		const engine = getEngine(match.gameType);
		const state = engine.deserialize(match.state);
		return engine.listLegalMoves(state, match.currentPlayer as PlayerId);
	}

	/**
	 * Check if it's an AI player's turn and return agent info if so
	 */
	async getCurrentPlayerInfo(matchId: string) {
		const match = await db.query.gameMatch.findFirst({
			where: eq(gameMatch.id, matchId),
			with: {
				playerXAgent: true,
				playerOAgent: true,
			},
		});

		if (!match) {
			throw new Error(`Match not found: ${matchId}`);
		}

		const currentPlayer = match.currentPlayer as PlayerId;
		const isPlayerX = currentPlayer === PlayerId.X;

		return {
			playerId: currentPlayer,
			type: isPlayerX ? match.playerXtype : match.playerOtype,
			agentId: isPlayerX ? match.playerXagentId : match.playerOagentId,
			agent: isPlayerX ? match.playerXAgent : match.playerOAgent,
		};
	}

	/**
	 * Update match status (e.g., mark as abandoned)
	 */
	async updateMatchStatus(
		matchId: string,
		status: MatchStatus,
		userId?: string,
	) {
		const conditions = [eq(gameMatch.id, matchId)];
		if (userId) {
			conditions.push(eq(gameMatch.userId, userId));
		}

		await db
			.update(gameMatch)
			.set({ status })
			.where(conditions.length > 1 ? and(...conditions) : conditions[0]);
	}

	/**
	 * Increment illegal move counter for an AI player and finish match if threshold reached.
	 */
	async recordAgentIllegalAttempt(matchId: string, offender: PlayerId) {
		const isOffenderX = offender === PlayerId.X;
		const opponent = isOffenderX ? PlayerId.O : PlayerId.X;
		const opponentResult =
			opponent === PlayerId.X ? GameResult.X : GameResult.O;

		// 1. Read current state (outside transaction)
		const currentMatch = await db.query.gameMatch.findFirst({
			where: eq(gameMatch.id, matchId),
		});

		if (!currentMatch) {
			throw new Error(`Match not found: ${matchId}`);
		}

		// 2. Calculate new state
		const newIllegalMovesX = isOffenderX
			? currentMatch.illegalMovesX + 1
			: currentMatch.illegalMovesX;
		const newIllegalMovesO = isOffenderX
			? currentMatch.illegalMovesO
			: currentMatch.illegalMovesO + 1;

		const offenderCount = isOffenderX ? newIllegalMovesX : newIllegalMovesO;
		const shouldFinish =
			offenderCount >= AGENT_ILLEGAL_THRESHOLD &&
			currentMatch.status === MatchStatus.playing;

		// 3. Update match in one atomic operation
		await db
			.update(gameMatch)
			.set({
				illegalMovesX: newIllegalMovesX,
				illegalMovesO: newIllegalMovesO,
				status: shouldFinish ? MatchStatus.finished : undefined,
				winner: shouldFinish ? opponentResult : undefined,
				currentPlayer: shouldFinish ? opponent : undefined,
			})
			.where(eq(gameMatch.id, matchId));

		return {
			finishedByPenalty: shouldFinish,
			illegalMovesX: newIllegalMovesX,
			illegalMovesO: newIllegalMovesO,
			winner: shouldFinish ? opponentResult : undefined,
		};
	}

	/**
	 * List all matches with optional filters
	 */
	async listMatches(filters?: {
		gameType?: GameType;
		status?: MatchStatus;
		userId?: string;
		limit?: number;
		offset?: number;
	}) {
		const conditions = [];

		if (filters?.gameType) {
			conditions.push(eq(gameMatch.gameType, filters.gameType));
		}

		if (filters?.status) {
			conditions.push(eq(gameMatch.status, filters.status));
		}

		if (filters?.userId) {
			conditions.push(eq(gameMatch.userId, filters.userId));
		}

		return db.query.gameMatch.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				gameTurns: {
					orderBy: asc(gameTurn.moveNumber),
					limit: 1, // Just to know if there are turns
				},
				playerXAgent: true,
				playerOAgent: true,
			},
			orderBy: desc(gameMatch.createdAt),
			limit: filters?.limit ?? 50,
			offset: filters?.offset ?? 0,
		});
	}
}

/**
 * Singleton instance of the match orchestrator
 */
export const matchOrchestrator = new MatchOrchestrator();
