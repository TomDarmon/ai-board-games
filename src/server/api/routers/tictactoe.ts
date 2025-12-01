import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { GameType, MatchStatus, gameTurn } from "~/drizzle/schema";
import { type PlayerId, gameMatch } from "~/drizzle/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { GameResult, TicTacToeMove } from "~/server/games";
import { GameStatus, getEngine, isGameResult } from "~/server/games";

const engine = getEngine(GameType.ticTacToe);

function mapMatchStatusToGameStatus(status: MatchStatus): GameStatus {
	switch (status) {
		case MatchStatus.playing:
			return GameStatus.playing;
		case MatchStatus.finished:
			return GameStatus.finished;
		default:
			return GameStatus.playing;
	}
}

function mapWinnerToGameResult(winner: string | null): GameResult | null {
	if (!winner) return null;
	if (isGameResult(winner)) return winner;
	return null;
}

type AgentInfo = {
	name: string;
	model?: string | null;
};

type TicTacToeTurn = {
	moveNumber: number;
	player: PlayerId;
	move: { position: number };
	stateAfterMove?: { board: (PlayerId | null)[] };
};

type TicTacToeMatch = {
	id: string;
	gameType: "ticTacToe";
	status: GameStatus;
	winner: GameResult | null;
	currentPlayer: PlayerId;
	state: { board: (PlayerId | null)[] };
	turns: TicTacToeTurn[];
	agents: Partial<Record<PlayerId, AgentInfo>>;
	createdAt: Date;
	updatedAt: Date;
};

type TicTacToeMatchSummary = {
	id: string;
	gameType: "ticTacToe";
	status: GameStatus;
	winner: GameResult | null;
	currentPlayer: PlayerId;
	createdAt: Date;
	updatedAt: Date;
	lastMove: {
		moveNumber: number;
		player: PlayerId;
		move: { position: number };
	} | null;
};

export const ticTacToeRouter = createTRPCRouter({
	// Get a match by ID
	getMatch: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }): Promise<TicTacToeMatch> => {
			const userId = ctx.session.user.id;
			const match = await ctx.db.query.gameMatch.findFirst({
				where: and(eq(gameMatch.id, input.id), eq(gameMatch.userId, userId)),
				with: {
					gameTurns: {
						orderBy: asc(gameTurn.moveNumber),
					},
					playerXAgent: true,
					playerOAgent: true,
				},
			});

			if (!match) {
				throw new Error("Match not found");
			}

			if (match.gameType !== GameType.ticTacToe) {
				throw new Error("Match is not a tic-tac-toe game");
			}

			// Deserialize the current state
			const state = engine.deserialize(match.state) as {
				board: (PlayerId | null)[];
			};

			// Map turns to game-specific format
			const turns: TicTacToeTurn[] = (match.gameTurns || []).map((turn) => {
				const moveData = JSON.parse(turn.moveData) as TicTacToeMove;
				const stateAfterMove = turn.stateAfterMove
					? (engine.deserialize(turn.stateAfterMove) as {
							board: (PlayerId | null)[];
						})
					: undefined;

				return {
					moveNumber: turn.moveNumber,
					player: turn.player as PlayerId,
					move: {
						position: moveData.position,
					},
					stateAfterMove,
				};
			});

			// Build agent info map
			const agents: Partial<Record<PlayerId, AgentInfo>> = {};
			if (match.playerXAgent) {
				agents.X = {
					name: match.playerXAgent.name,
					model: match.playerXAgent.model,
				};
			}
			if (match.playerOAgent) {
				agents.O = {
					name: match.playerOAgent.name,
					model: match.playerOAgent.model,
				};
			}

			return {
				id: match.id,
				gameType: GameType.ticTacToe,
				status: mapMatchStatusToGameStatus(match.status),
				winner: mapWinnerToGameResult(match.winner),
				currentPlayer: match.currentPlayer,
				state,
				turns,
				agents,
				createdAt: new Date(match.createdAt),
				updatedAt: new Date(match.updatedAt),
			};
		}),

	// Get matches for tic-tac-toe with pagination
	getMatches: protectedProcedure
		.input(
			z.object({
				offset: z.number().min(0).default(0),
				limit: z.number().min(1).max(120).default(120),
			}),
		)
		.query(async ({ ctx, input }): Promise<TicTacToeMatchSummary[]> => {
			const userId = ctx.session.user.id;
			const matches = await ctx.db.query.gameMatch.findMany({
				where: and(
					eq(gameMatch.gameType, GameType.ticTacToe),
					eq(gameMatch.userId, userId),
				),
				with: {
					gameTurns: {
						orderBy: desc(gameTurn.moveNumber),
						limit: 1, // Get last move only
					},
				},
				orderBy: desc(gameMatch.createdAt),
				offset: input.offset,
				limit: input.limit,
			});

			return matches.map((match): TicTacToeMatchSummary => {
				const lastTurn = match.gameTurns?.[0];
				let lastMove: TicTacToeMatchSummary["lastMove"] = null;

				if (lastTurn) {
					const moveData = JSON.parse(lastTurn.moveData) as TicTacToeMove;
					lastMove = {
						moveNumber: lastTurn.moveNumber,
						player: lastTurn.player,
						move: {
							position: moveData.position,
						},
					};
				}

				return {
					id: match.id,
					gameType: GameType.ticTacToe,
					status: mapMatchStatusToGameStatus(match.status),
					winner: mapWinnerToGameResult(match.winner),
					currentPlayer: match.currentPlayer,
					createdAt: new Date(match.createdAt),
					updatedAt: new Date(match.updatedAt),
					lastMove,
				};
			});
		}),
});
