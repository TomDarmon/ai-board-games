"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PlayerId } from "~/drizzle/schema";
import {
	type GameResult,
	type MatchCompleteData,
	type MatchInitData,
	type MatchTurnData,
	type Turn,
	TurnStatus,
} from "~/shared/@types";
import type { MatchConfig } from "~/shared/match";
import { type MatchUIMessage, dataPartNames } from "~/shared/match";
import { getTRPCErrorMessage } from "~/trpc/error";
import { api } from "~/trpc/react";

export type AgentInfo = {
	name: string;
	model?: string | null;
};

type UseMatchStreamingOptions = {
	onMatchStart?: (matchId: string) => void;
	onMatchComplete?: (winner: GameResult) => void;
};

export function useMatchStreaming(options: UseMatchStreamingOptions = {}) {
	const [matchId, setMatchId] = useState<string | null>(null);
	const [isComplete, setIsComplete] = useState(false);
	const [loading, setLoading] = useState(false);
	const [winner, setWinner] = useState<GameResult | null>(null);
	const [currentPlayer, setCurrentPlayer] = useState<PlayerId | null>(null);
	const [turns, setTurns] = useState<Turn[]>([]);
	const [agentNames, setAgentNames] = useState<Record<PlayerId, string>>({
		[PlayerId.X]: "Player X",
		[PlayerId.O]: "Player O",
	});
	const [agents, setAgents] = useState<Partial<Record<PlayerId, AgentInfo>>>(
		{},
	);
	const router = useRouter();
	const abandonMatch = api.match.abandon.useMutation();

	const { messages, sendMessage, stop, error } = useChat<MatchUIMessage>({
		transport: new DefaultChatTransport({ api: "/api/game/stream" }),
		onData: (dataPart) => {
			if (dataPart.type === dataPartNames.matchInit && dataPart.data) {
				const initData = dataPart.data as MatchInitData;
				setMatchId(initData.matchId);
				setIsComplete(false);
				setWinner(null);
				setCurrentPlayer(PlayerId.X); // X always starts
				setTurns([]); // Reset turns for new match

				// Set agent names if provided (for backwards compatibility)
				setAgentNames({
					[PlayerId.X]: initData.playerXAgentName ?? "Player X",
					[PlayerId.O]: initData.playerOAgentName ?? "Player O",
				});

				// Set full agent info with model
				const newAgents: Partial<Record<PlayerId, AgentInfo>> = {};
				if (initData.playerXAgentName) {
					newAgents[PlayerId.X] = {
						name: initData.playerXAgentName,
						model: initData.playerXModel ?? null,
					};
				}
				if (initData.playerOAgentName) {
					newAgents[PlayerId.O] = {
						name: initData.playerOAgentName,
						model: initData.playerOModel ?? null,
					};
				}
				setAgents(newAgents);

				options.onMatchStart?.(initData.matchId);
			}

			if (dataPart.type === dataPartNames.matchTurn && dataPart.data) {
				const turnData = dataPart.data as MatchTurnData;
				// Add or update turn in state
				setTurns((prevTurns) => {
					// Check if this turn already exists
					const existingIndex = prevTurns.findIndex(
						(t) =>
							t.turnNumber === turnData.turnNumber &&
							t.player === turnData.player,
					);

					if (existingIndex >= 0) {
						// Update existing turn (e.g., loading -> success)
						const newTurns = [...prevTurns];
						newTurns[existingIndex] = {
							turnNumber: turnData.turnNumber,
							player: turnData.player,
							move: turnData.move,
							status: turnData.status,
						};
						return newTurns;
					}

					// Add new turn
					return [
						...prevTurns,
						{
							turnNumber: turnData.turnNumber,
							player: turnData.player,
							move: turnData.move,
							status: turnData.status,
						},
					];
				});

				if (turnData.status === TurnStatus.success) {
					// Update current player to next player
					setCurrentPlayer(
						turnData.player === PlayerId.X ? PlayerId.O : PlayerId.X,
					);
				}
			}

			if (dataPart.type === dataPartNames.matchComplete && dataPart.data) {
				setIsComplete(true);
				const completeData = dataPart.data as MatchCompleteData;
				setWinner(completeData.winner);
				options.onMatchComplete?.(completeData.winner);
			}
		},
		onFinish: () => {
			setLoading(false);
			// Refresh the page to update match history
			router.refresh();
		},
		onError: (error) => {
			setLoading(false);
			toast.error(getTRPCErrorMessage(error));
		},
	});

	const startMatch = (config: MatchConfig) => {
		setLoading(true);
		setMatchId(null);
		setIsComplete(false);
		setTurns([]);
		setAgents({});
		// Send configuration to the streaming endpoint
		void sendMessage({
			role: "user",
			parts: [
				{
					type: "text",
					text: JSON.stringify(config),
				},
			],
		});
	};

	const stopMatch = async () => {
		// First, mark the match as abandoned on the backend
		if (matchId) {
			void (await abandonMatch.mutateAsync({ matchId }).catch((error) => {
				toast.error(getTRPCErrorMessage(error));
			}));
		}

		// Then stop the streaming
		stop();
		setLoading(false);
		toast.info("Match stopped");
	};

	const reset = () => {
		setMatchId(null);
		setIsComplete(false);
		setLoading(false);
		setWinner(null);
		setCurrentPlayer(null);
		setTurns([]);
		setAgents({});
	};

	return {
		matchId,
		isComplete,
		loading,
		winner,
		currentPlayer,
		turns,
		agentNames,
		agents,
		error,
		messages,
		startMatch,
		stopMatch,
		reset,
	};
}
