"use client";

import { PlayerId } from "~/drizzle/schema";
import { cn } from "~/lib/utils";
import { type Turn, TurnStatus } from "~/shared/@types";

const COLS = 7;
const ROWS = 6;

const PLAYER_COLORS: Record<PlayerId, string> = {
	[PlayerId.X]: "bg-primary",
	[PlayerId.O]: "bg-destructive",
};

type ConnectFourBoard = (PlayerId | null)[][];

type Props = {
	turns: Turn[];
	currentStep?: number;
};

function createEmptyBoard(): ConnectFourBoard {
	return Array.from({ length: ROWS }, () =>
		Array.from({ length: COLS }, () => null as PlayerId | null),
	);
}

export function ConnectFourBoard({ turns, currentStep }: Props) {
	// If currentStep is provided, show board state at that step (for replay)
	// Otherwise show all successful moves (for live view)
	const turnsToApply =
		currentStep !== undefined
			? turns
					.slice(0, currentStep)
					.filter((t) => t.status === TurnStatus.success)
			: turns.filter((t) => t.status === TurnStatus.success);

	// Reconstruct board from moves
	const board = createEmptyBoard();

	for (const turn of turnsToApply) {
		if ("column" in turn.move) {
			const column = turn.move.column as number;
			// Drop piece to lowest available row
			for (let row = ROWS - 1; row >= 0; row--) {
				const boardRow = board[row];
				if (boardRow && boardRow[column] === null) {
					boardRow[column] = turn.player;
					break;
				}
			}
		}
	}

	return (
		<div className="mx-auto w-full max-w-[480px]">
			<div className="flex w-full flex-col gap-[2%] rounded-lg border-4 border-blue-600 bg-blue-600 p-[2%]">
				{board.map((row, rowIndex) => {
					const rowKey = `row-${rowIndex}`;
					return (
						<div key={rowKey} className="flex gap-[2%]">
							{row.map((cell, colIndex) => {
								const cellValue = cell;
								const cellKey = `${rowKey}-cell-${colIndex}`;
								return (
									<div
										key={cellKey}
										className={cn(
											"flex aspect-square flex-1 items-center justify-center rounded-full border-2",
											cellValue === PlayerId.X
												? cn(
														PLAYER_COLORS[PlayerId.X],
														"border-primary shadow-lg",
													)
												: cellValue === PlayerId.O
													? cn(
															PLAYER_COLORS[PlayerId.O],
															"border-destructive shadow-lg",
														)
													: "border-blue-700 bg-gray-100 dark:bg-gray-800",
										)}
									/>
								);
							})}
						</div>
					);
				})}
			</div>
		</div>
	);
}
