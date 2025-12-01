import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { GameType, MatchStatus, gameTurn } from "~/drizzle/schema";
import { type PlayerId, gameMatch } from "~/drizzle/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	type ConnectFourMove,
	type GameResult,
	GameStatus,
	getEngine,
	isGameResult,
} from "~/server/games";

const engine = getEngine(GameType.connectFour);

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

type ConnectFourBoard = (PlayerId | null)[][];

type ConnectFourTurn = {
	moveNumber: number;
	player: PlayerId;
	move: { column: number };
	stateAfterMove?: { board: ConnectFourBoard };
};

type ConnectFourMatch = {
	id: string;
	gameType: "connectFour";
	status: GameStatus;
	winner: GameResult | null;
	currentPlayer: PlayerId;
	state: { board: ConnectFourBoard };
	turns: ConnectFourTurn[];
	createdAt: Date;
	updatedAt: Date;
};

type ConnectFourMatchSummary = {
	id: string;
	gameType: "connectFour";
	status: GameStatus;
	winner: GameResult | null;
	currentPlayer: PlayerId;
	createdAt: Date;
	updatedAt: Date;
	lastMove: {
		moveNumber: number;
		player: PlayerId;
		move: { column: number };
	} | null;
};

export const connectFourRouter = createTRPCRouter({
	// Get a match by ID
	getMatch: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }): Promise<ConnectFourMatch> => {
			const userId = ctx.session.user.id;
			const match = await ctx.db.query.gameMatch.findFirst({
				where: and(eq(gameMatch.id, input.id), eq(gameMatch.userId, userId)),
				with: {
					gameTurns: {
						orderBy: asc(gameTurn.moveNumber),
					},
				},
			});

			if (!match) {
				throw new Error("Match not found");
			}

			if (match.gameType !== GameType.connectFour) {
				throw new Error("Match is not a connect-four game");
			}

			// Deserialize the current state
			const state = engine.deserialize(match.state) as {
				board: ConnectFourBoard;
			};

			// Map turns to game-specific format
			const turns: ConnectFourTurn[] = (match.gameTurns || []).map((turn) => {
				const moveData = JSON.parse(turn.moveData) as ConnectFourMove;
				const stateAfterMove = turn.stateAfterMove
					? (engine.deserialize(turn.stateAfterMove) as {
							board: ConnectFourBoard;
						})
					: undefined;

				return {
					moveNumber: turn.moveNumber,
					player: turn.player,
					move: {
						column: moveData.column,
					},
					stateAfterMove,
				};
			});

			return {
				id: match.id,
				gameType: GameType.connectFour,
				status: mapMatchStatusToGameStatus(match.status),
				winner: mapWinnerToGameResult(match.winner),
				currentPlayer: match.currentPlayer,
				state,
				turns,
				createdAt: new Date(match.createdAt),
				updatedAt: new Date(match.updatedAt),
			};
		}),

	// Get matches for connect-four with pagination
	getMatches: protectedProcedure
		.input(
			z.object({
				offset: z.number().min(0).default(0),
				limit: z.number().min(1).max(120).default(120),
			}),
		)
		.query(async ({ ctx, input }): Promise<ConnectFourMatchSummary[]> => {
			const userId = ctx.session.user.id;
			const matches = await ctx.db.query.gameMatch.findMany({
				where: and(
					eq(gameMatch.gameType, GameType.connectFour),
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

			return matches.map((match): ConnectFourMatchSummary => {
				const lastTurn = match.gameTurns?.[0];
				let lastMove: ConnectFourMatchSummary["lastMove"] = null;

				if (lastTurn) {
					const moveData = JSON.parse(lastTurn.moveData) as ConnectFourMove;
					lastMove = {
						moveNumber: lastTurn.moveNumber,
						player: lastTurn.player,
						move: {
							column: moveData.column,
						},
					};
				}

				return {
					id: match.id,
					gameType: "connectFour" as const,
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
