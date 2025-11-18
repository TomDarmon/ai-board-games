"use client";

import { AgentSelector } from "~/components/AgentSelector";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

type GameLobbyStartCardProps = {
	playerXLabel: string;
	playerOLabel: string;
	agentX: string | null;
	agentO: string | null;
	onAgentXChange: (value: string | null) => void;
	onAgentOChange: (value: string | null) => void;
	onStartMatch: () => void;
	loading: boolean;
	buttonText?: string;
};

export function GameLobbyStartCard({
	playerXLabel,
	playerOLabel,
	agentX,
	agentO,
	onAgentXChange,
	onAgentOChange,
	onStartMatch,
	loading,
	buttonText = "Play AI vs AI",
}: GameLobbyStartCardProps) {
	const isStartDisabled = loading || !agentX || !agentO;

	return (
		<Card>
			<CardContent className="space-y-4 p-4">
				<AgentSelector
					label={playerXLabel}
					value={agentX}
					onChange={onAgentXChange}
				/>
				<AgentSelector
					label={playerOLabel}
					value={agentO}
					onChange={onAgentOChange}
				/>
				<Button
					onClick={onStartMatch}
					disabled={isStartDisabled}
					className="w-full"
				>
					{loading ? "Starting..." : buttonText}
				</Button>
			</CardContent>
		</Card>
	);
}
