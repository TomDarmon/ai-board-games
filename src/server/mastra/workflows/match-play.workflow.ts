import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { GameType, MatchStatus, PlayerId, PlayerType } from "~/drizzle/schema";

import { db } from "~/server/db";
import {
	GameStatus,
	MatchEventType,
	type TurnResult,
	TurnStatus,
	getEngine,
} from "~/server/games";
import { matchOrchestrator } from "~/server/orchestrator/match-orchestrator";
import { decideMove } from "../agents/move-decider.agent";
import { normalizePlayerConfigMap, playerConfigMapSchema } from "../types";
import type { NormalizedPlayerConfigMap } from "../types";

const MATCH_PLAY_WORKFLOW_ID = "match-play" as const;

const matchPlayWorkflowInputSchema = z.object({
	matchId: z.string().optional(),
	gameType: z.enum(GameType).optional().default(GameType.ticTacToe),
	playerXAgentId: z.string(),
	playerOAgentId: z.string(),
	playerConfigs: playerConfigMapSchema.optional(),
	userId: z.string(),
});

const matchPlayWorkflowStateSchema = z.object({
	matchId: z.string(),
	gameType: z.enum(GameType),
	playerConfigs: playerConfigMapSchema,
	done: z.boolean(),
	retryGuidance: z.string().nullable().optional(),
	userId: z.string(),
});

export type MatchPlayWorkflowState = z.infer<
	typeof matchPlayWorkflowStateSchema
>;

function buildRetryGuidance(
	legalMoves: Array<Record<string, unknown>>,
): string {
	const legalMovesList = legalMoves
		.map((move) => JSON.stringify(move))
		.join(", ");
	return [
		"Your previous move was illegal.",
		`Select one of the legal moves: ${legalMovesList}.`,
		"Respond ONLY with valid JSON matching the required schema.",
	].join(" ");
}

const initOrAttachMatchStep = createStep({
	id: "initOrAttachMatch",
	description: "Create a new match or attach to an existing one.",
	inputSchema: matchPlayWorkflowInputSchema,
	outputSchema: matchPlayWorkflowStateSchema,
	stateSchema: matchPlayWorkflowStateSchema,
	async execute({ inputData, writer }) {
		// Ensure inputData is defined and validate it
		const validatedInput = matchPlayWorkflowInputSchema.parse(inputData ?? {});
		const {
			matchId,
			gameType,
			playerConfigs,
			playerXAgentId,
			playerOAgentId,
			userId,
		} = validatedInput;

		const normalizedConfigs: NormalizedPlayerConfigMap =
			normalizePlayerConfigMap(playerConfigs ?? {});

		let finalMatchId: string;
		let finalGameType: GameType;

		if (matchId) {
			const existingMatch = await matchOrchestrator.getMatch(matchId, userId);
			finalMatchId = matchId;
			finalGameType = existingMatch.gameType;
		} else {
			if (!gameType) {
				throw new Error("gameType is required when creating a new match");
			}

			const newMatch = await matchOrchestrator.createMatch({
				gameType,
				userId,
				playerXType: PlayerType.agent,
				playerOType: PlayerType.agent,
				playerXAgentId: playerXAgentId,
				playerOAgentId: playerOAgentId,
			});

			finalMatchId = newMatch.id;
			finalGameType = gameType;
		}

		// Load agent configs from DB if agents are assigned
		const match = await matchOrchestrator.getMatch(finalMatchId, userId);
		const loadedPlayerConfigs: NormalizedPlayerConfigMap = {
			...normalizedConfigs,
		};

		// Load agent X config if present and has a model
		if (match.playerXagentId && match.playerXAgent?.model) {
			loadedPlayerConfigs[PlayerId.X] = {
				model: match.playerXAgent.model,
				prompt: match.playerXAgent.prompt ?? null,
			};
		}

		// Load agent O config if present and has a model
		if (match.playerOagentId && match.playerOAgent?.model) {
			loadedPlayerConfigs[PlayerId.O] = {
				model: match.playerOAgent.model,
				prompt: match.playerOAgent.prompt ?? null,
			};
		}

		// Stream match initialization event
		await writer?.write({
			type: MatchEventType.matchInit,
			matchId: finalMatchId,
			gameType: finalGameType,
			status: MatchStatus.playing,
			playerXAgentName: match.playerXAgent?.name ?? null,
			playerOAgentName: match.playerOAgent?.name ?? null,
			playerXModel: match.playerXAgent?.model ?? null,
			playerOModel: match.playerOAgent?.model ?? null,
		});

		// Convert NormalizedPlayerConfigMap to playerConfigMapSchema format
		// Only include configs that have a valid model (required by schema)
		const configX = loadedPlayerConfigs[PlayerId.X];
		const configO = loadedPlayerConfigs[PlayerId.O];
		const configsForSchema: z.infer<typeof playerConfigMapSchema> = {
			[PlayerId.X]: configX?.model
				? {
						model: configX.model,
						prompt: configX.prompt ?? null,
					}
				: undefined,
			[PlayerId.O]: configO?.model
				? {
						model: configO.model,
						prompt: configO.prompt ?? null,
					}
				: undefined,
		};

		return {
			matchId: finalMatchId,
			gameType: finalGameType,
			playerConfigs: configsForSchema,
			done: false,
			retryGuidance: null,
			userId,
		};
	},
});

const playOneTurnStep = createStep({
	id: "playOneTurn",
	description: "Play a single agent turn if required.",
	inputSchema: matchPlayWorkflowStateSchema,
	outputSchema: matchPlayWorkflowStateSchema,
	stateSchema: matchPlayWorkflowStateSchema,
	async execute({ inputData, writer }) {
		// Validate and parse the state input
		const state = matchPlayWorkflowStateSchema.parse(inputData);
		const { matchId, gameType, playerConfigs, userId } = state;

		const match = await matchOrchestrator.getMatch(matchId, userId);

		if (match.status !== MatchStatus.playing) {
			// Stream match complete event
			await writer?.write({
				type: MatchEventType.matchComplete,
				matchId,
				winner: match.winner,
				totalTurns: match.gameTurns.length,
				status: MatchStatus.finished,
			});

			return {
				...state,
				retryGuidance: null,
				done: true,
			};
		}

		const currentPlayerInfo =
			await matchOrchestrator.getCurrentPlayerInfo(matchId);
		const currentPlayer = currentPlayerInfo.playerId as PlayerId;

		if (currentPlayerInfo.type !== PlayerType.agent) {
			return {
				...state,
				retryGuidance: null,
				done: true,
			};
		}

		const engine = getEngine(gameType);
		const currentState = engine.deserialize(match.state);
		const legalMoves = await matchOrchestrator.getLegalMoves(matchId);

		if (legalMoves.length === 0) {
			return {
				...state,
				retryGuidance: null,
				done: true,
			};
		}

		// Get player config and validate it exists with a model
		const playerConfig = playerConfigs[currentPlayer];
		if (!playerConfig || !playerConfig.model) {
			throw new Error(
				`Player config for ${currentPlayer} is missing or has no model`,
			);
		}

		// Stream turn loading event
		await writer?.write({
			type: MatchEventType.matchTurn,
			turnNumber: match.gameTurns.length + 1,
			player: currentPlayer,
			move: {},
			status: TurnStatus.loading,
		});

		const generation = await decideMove(
			{
				gameType,
				state: currentState,
				legalMoves,
				player: currentPlayer,
				playerConfig,
				userId,
			},
			db,
		);

		if (!engine.isLegalMove(currentState, generation.move, currentPlayer)) {
			const penalty = await matchOrchestrator.recordAgentIllegalAttempt(
				matchId,
				currentPlayer,
			);

			const offenderCount =
				currentPlayer === PlayerId.X
					? penalty.illegalMovesX
					: penalty.illegalMovesO;

			// Stream illegal move event
			await writer?.write({
				type: MatchEventType.matchTurn,
				turnNumber: match.gameTurns.length + 1,
				player: currentPlayer,
				move: generation.move,
				status: TurnStatus.illegal,
				illegalAttempts: offenderCount,
			});

			if (penalty.finishedByPenalty) {
				// Stream match complete due to penalty
				const updatedMatch = await matchOrchestrator.getMatch(matchId, userId);
				await writer?.write({
					type: MatchEventType.matchComplete,
					matchId,
					winner: updatedMatch.winner,
					totalTurns: updatedMatch.gameTurns.length,
					status: MatchStatus.finished,
				});

				return {
					...state,
					retryGuidance: null,
					done: true,
				};
			}

			return {
				...state,
				retryGuidance: buildRetryGuidance(legalMoves),
				done: false,
			};
		}

		// Attempt to process the turn
		// Note: The match could have been abandoned by the user during the AI decision-making
		// above (decideMove can take several seconds). We wrap this in a try-catch to handle
		// the case where processTurn throws because the match is no longer in playing status.
		let turnResult: TurnResult;
		try {
			turnResult = await matchOrchestrator.processTurn(
				matchId,
				generation.move,
				currentPlayer,
			);
		} catch (error) {
			// Re-check match status to determine if it was abandoned
			const updatedMatch = await matchOrchestrator.getMatch(matchId, userId);

			if (updatedMatch.status === MatchStatus.abandoned) {
				// Match was abandoned during AI decision-making - exit gracefully
				await writer?.write({
					type: MatchEventType.matchComplete,
					matchId,
					winner: updatedMatch.winner,
					totalTurns: updatedMatch.gameTurns.length,
					status: MatchStatus.abandoned,
				});

				return {
					...state,
					retryGuidance: null,
					done: true,
				};
			}

			// If it wasn't an abandonment, re-throw the original error
			throw error;
		}

		// Stream successful turn event
		await writer?.write({
			type: MatchEventType.matchTurn,
			turnNumber: turnResult.turnNumber,
			player: currentPlayer,
			move: generation.move,
			status: TurnStatus.success,
		});

		// Check if match is finished and stream complete event
		if (turnResult.status === GameStatus.finished) {
			const finalMatch = await matchOrchestrator.getMatch(matchId, userId);
			await writer?.write({
				type: MatchEventType.matchComplete,
				matchId,
				winner: finalMatch.winner,
				totalTurns: finalMatch.gameTurns.length,
				status: MatchStatus.finished,
			});
		}

		return {
			...state,
			retryGuidance: null,
			done: turnResult.status === GameStatus.finished,
		};
	},
});

const matchPlayWorkflow = createWorkflow({
	id: MATCH_PLAY_WORKFLOW_ID,
	description: "Persisted agent gameplay workflow with per-turn retries.",
	inputSchema: matchPlayWorkflowInputSchema,
	outputSchema: matchPlayWorkflowStateSchema,
	stateSchema: matchPlayWorkflowStateSchema,
})
	.then(initOrAttachMatchStep)
	.dountil(playOneTurnStep, async ({ inputData: { done } }) => done === true)
	.commit();

export { matchPlayWorkflow, MATCH_PLAY_WORKFLOW_ID };
