"use client";

import { PlayerId } from "~/drizzle/schema";
import { cn } from "~/lib/utils";
import { type Turn, TurnStatus } from "~/shared/@types";

// Board positions for unique keys (never changes)
const BOARD_POSITIONS = [
	"cell-0",
	"cell-1",
	"cell-2",
	"cell-3",
	"cell-4",
	"cell-5",
	"cell-6",
	"cell-7",
	"cell-8",
] as const;

type Props = {
	turns: Turn[];
	currentStep?: number;
};

export function TicTacToeBoard({ turns, currentStep }: Props) {
	// If currentStep is provided, show board state at that step (for replay)
	// Otherwise show all successful moves (for live view)
	const turnsToApply =
		currentStep !== undefined
			? turns
					.slice(0, currentStep)
					.filter((t) => t.status === TurnStatus.success)
			: turns.filter((t) => t.status === TurnStatus.success);

	// Reconstruct board from moves
	const board = Array.from({ length: 9 }, () => null as PlayerId | null);

	for (const turn of turnsToApply) {
		if ("position" in turn.move) {
			const position = turn.move.position as number;
			if (position >= 0 && position < 9) {
				board[position] = turn.player;
			}
		}
	}

	return (
		<div className="mx-auto grid w-fit grid-cols-3 gap-2">
			{BOARD_POSITIONS.map((_, index) => {
				const cellValue = board[index];
				return (
					<button
						key={`${index}-${cellValue}`}
						type="button"
						disabled
						className={cn(
							"h-20 w-20 rounded border-2 bg-background font-bold text-2xl transition-colors disabled:cursor-default sm:h-24 sm:w-24",
							cellValue === PlayerId.X && "border-primary text-primary",
							cellValue === PlayerId.O && "border-destructive text-destructive",
							!cellValue && "border-muted",
						)}
					>
						{cellValue === PlayerId.X
							? "X"
							: cellValue === PlayerId.O
								? "O"
								: ""}
					</button>
				);
			})}
		</div>
	);
}
