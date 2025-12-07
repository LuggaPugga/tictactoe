import { Circle, X } from "lucide-solid";
import { For, Show } from "solid-js";
import { Motion } from "solid-motionone";
import type { CellValue, LocalBoard as LocalBoardType } from "@/lib/types";

interface LocalBoardProps {
	board: LocalBoardType;
	boardIndex: number;
	onCellClick: (boardIndex: number, cellIndex: number) => void;
	isActive: boolean;
	winner: string | null;
}

export default function LocalBoard(props: LocalBoardProps) {
	const getCellStyle = (value: CellValue) => {
		let style =
			"w-full h-full flex items-center justify-center transition-colors duration-200 p-2 ";

		if (value === "X") {
			style += "text-blue-600 dark:text-blue-400";
		} else if (value === "O") {
			style += "text-red-600 dark:text-red-400";
		} else {
			style +=
				props.isActive && !props.winner
					? "hover:bg-gray-100/5 dark:hover:bg-gray-100/5 cursor-pointer"
					: "cursor-not-allowed";
		}
		return style;
	};

	return (
		<div class="aspect-square overflow-hidden relative">
			<div class="w-full h-full relative">
				<svg
					class="absolute inset-0 w-full h-full"
					viewBox="0 0 100 100"
					preserveAspectRatio="none"
				>
					<title>Grid lines</title>
					<path
						d="M33.33 0 L33.33 100"
						stroke="currentColor"
						stroke-width="0.5"
						fill="none"
						class="text-gray-400/50 dark:text-gray-400/30"
					/>
					<path
						d="M66.67 0 L66.67 100"
						stroke="currentColor"
						stroke-width="0.5"
						fill="none"
						class="text-gray-400/50 dark:text-gray-400/30"
					/>
					<path
						d="M0 33.33 L100 33.33"
						stroke="currentColor"
						stroke-width="0.5"
						fill="none"
						class="text-gray-400/50 dark:text-gray-400/30"
					/>
					<path
						d="M0 66.67 L100 66.67"
						stroke="currentColor"
						stroke-width="0.5"
						fill="none"
						class="text-gray-400/50 dark:text-gray-400/30"
					/>
				</svg>
				<div class="grid grid-cols-3 h-full w-full relative z-20">
					<For each={props.board}>
						{(cell, cellIndex) => (
							<button
								type="button"
								class={`${getCellStyle(cell)} aspect-square`}
								onClick={() =>
									props.isActive &&
									props.onCellClick(props.boardIndex, cellIndex())
								}
								disabled={!props.isActive || cell !== null}
							>
								<Show
									when={cell && !props.winner}
									fallback={<span class="sr-only">Empty cell</span>}
								>
									<Motion.div
										initial={{ scale: 0, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										transition={{ duration: 0.3, easing: "ease-out" }}
										class="w-full h-full flex items-center justify-center"
									>
										<Show
											when={cell === "X"}
											fallback={<Circle class="w-10 h-10" />}
										>
											<X class="w-12 h-12" />
										</Show>
									</Motion.div>
								</Show>
							</button>
						)}
					</For>
				</div>
			</div>
			<Show when={props.winner}>
				<div
					class={`absolute inset-0 flex items-center justify-center ${
						props.winner === "X"
							? "text-blue-600 dark:text-blue-400"
							: "text-red-600 dark:text-red-400"
					}`}
				>
					<Show
						when={props.winner === "X"}
						fallback={<Circle class="w-4/6 h-4/6" />}
					>
						<X class="w-4/5 h-4/5" />
					</Show>
				</div>
			</Show>
		</div>
	);
}
