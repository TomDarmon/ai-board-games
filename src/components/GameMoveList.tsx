"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { PlayerId } from "~/drizzle/schema";
import { cn } from "~/lib/utils";
import { type Turn, TurnStatus } from "~/shared/@types";

type Props = {
	turns: Turn[];
	currentStep?: number;
	onMoveClick?: (step: number) => void;
	playerNames?: Record<PlayerId, string>;
	formatMove?: (move: Turn["move"]) => string;
};

export function GameMoveList({
	turns,
	currentStep,
	onMoveClick,
	playerNames = { [PlayerId.X]: "Player X", [PlayerId.O]: "Player O" },
	formatMove,
}: Props) {
	const defaultFormatMove = (move: Turn["move"]) => {
		return JSON.stringify(move);
	};

	const getMoveText = (move: Turn["move"]) => {
		return formatMove ? formatMove(move) : defaultFormatMove(move);
	};

	const maxStep = turns.length;
	const showNavigation = onMoveClick !== undefined && turns.length > 0;
	const currentStepValue = currentStep ?? 0;

	const handleFirstMove = () => {
		onMoveClick?.(0); // Show initial empty board
	};

	const handlePreviousMove = () => {
		onMoveClick?.(Math.max(0, currentStepValue - 1));
	};

	const handleNextMove = () => {
		onMoveClick?.(Math.min(maxStep, currentStepValue + 1));
	};

	const handleLastMove = () => {
		onMoveClick?.(maxStep); // Show all moves
	};

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">Moves ({turns.length})</CardTitle>
			</CardHeader>
			{showNavigation && (
				<div className="border-t px-3 py-2">
					<div className="flex items-center justify-center gap-1">
						<Button
							variant="outline"
							size="icon-sm"
							onClick={handleFirstMove}
							disabled={currentStepValue === 0}
							title="First"
							className="h-7 w-7"
						>
							<span className="text-xs">⏮</span>
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							onClick={handlePreviousMove}
							disabled={currentStepValue === 0}
							title="Previous"
							className="h-7 w-7"
						>
							<span className="text-xs">◀</span>
						</Button>
						<div className="min-w-[60px] text-center">
							<span className="font-mono text-xs">
								{currentStepValue}/{maxStep}
							</span>
						</div>
						<Button
							variant="outline"
							size="icon-sm"
							onClick={handleNextMove}
							disabled={currentStepValue === maxStep}
							title="Next"
							className="h-7 w-7"
						>
							<span className="text-xs">▶</span>
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							onClick={handleLastMove}
							disabled={currentStepValue === maxStep}
							title="Last"
							className="h-7 w-7"
						>
							<span className="text-xs">⏭</span>
						</Button>
					</div>
				</div>
			)}
			<CardContent className="flex-1 p-0">
				<ScrollArea className="h-[calc(100vh-400px)] max-h-[500px] min-h-[300px]">
					<div className="space-y-1 px-3 pb-3">
						{turns.length === 0 ? (
							<div className="py-6 text-center">
								<p className="text-muted-foreground text-xs">No moves yet</p>
							</div>
						) : (
							turns.map((turn, index) => {
								const isSelected =
									currentStep !== undefined && index === currentStep - 1;
								const isClickable = onMoveClick !== undefined;

								return (
									<button
										key={`turn-${turn.turnNumber}-${turn.player}`}
										type="button"
										onClick={() => onMoveClick?.(index + 1)}
										disabled={!isClickable}
										className={cn(
											"w-full rounded border p-1.5 text-left transition-all",
											isClickable && "cursor-pointer hover:bg-muted/50",
											!isClickable && "cursor-default",
											isSelected &&
												"border-primary bg-primary/10 ring-1 ring-primary/20",
											!isSelected && "border-border",
										)}
									>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-1.5">
												<span className="font-mono text-[10px] text-muted-foreground">
													#{turn.turnNumber}
												</span>
												<span
													className={cn(
														"text-[11px]",
														turn.player === PlayerId.X
															? "text-primary"
															: "text-destructive",
													)}
												>
													{playerNames[turn.player]}
												</span>
											</div>
											<div className="flex flex-1 items-center justify-end gap-1">
												{turn.status === TurnStatus.loading ? (
													<span className="animate-pulse text-[10px]">⏳</span>
												) : turn.status === TurnStatus.illegal ? (
													<>
														<code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[10px] text-red-700">
															Illegal
														</code>
														<span className="text-[10px] text-red-600">✗</span>
													</>
												) : (
													<>
														<code className="max-w-[120px] truncate rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
															{getMoveText(turn.move)}
														</code>
														<span className="text-[10px] text-green-600">
															✓
														</span>
													</>
												)}
											</div>
										</div>
									</button>
								);
							})
						)}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
