import { Maximize2, Minimize2 } from "lucide-solid";
import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";
import LocalBoard from "@/components/game/local-board";
import { Button } from "@/components/ui/button";
import type { Game } from "@/lib/types";

interface UltimateBoardProps {
	game: Game;
	globalBoard: (string | null)[];
	currentBoard: number | null;
	onCellClick: (boardIndex: number, cellIndex: number) => void;
	inView?: boolean;
}

export default function UltimateBoard(props: UltimateBoardProps) {
	const [isFullscreen, setIsFullscreen] = createSignal(false);
	const [isMobile, setIsMobile] = createSignal(false);

	createEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		onCleanup(() => window.removeEventListener("resize", checkMobile));
	});

	const toggleFullscreen = () => {
		setIsFullscreen(!isFullscreen());
	};

	const renderBoard = () => (
		<div class="w-full max-w-[min(90vw,90vh)] aspect-square relative p-2 rounded-lg shadow-lg bg-background">
			<div class="w-full h-full flex flex-col">
				<For each={[0, 1, 2]}>
					{(row) => (
						<>
							<Show when={row > 0}>
								<div class="h-2 bg-gray-400/50 dark:bg-gray-600/50" />
							</Show>
							<div class="flex-1 flex flex-row">
								<For each={[0, 1, 2]}>
									{(col) => {
										const boardIndex = row * 3 + col;
										return (
											<>
												<Show when={col > 0}>
													<div class="w-2 bg-gray-400/50 dark:bg-gray-600/50" />
												</Show>
												<div
													class={`relative flex-1 ${props.currentBoard === boardIndex ? "border-3 border-yellow-400 dark:border-yellow-500 bg-yellow-400/10 dark:bg-yellow-400/5" : "border-3 border-transparent"}`}
												>
													<LocalBoard
														board={props.game[boardIndex] ?? []}
														boardIndex={boardIndex}
														onCellClick={props.onCellClick}
														isActive={
															props.currentBoard === null ||
															props.currentBoard === boardIndex
														}
														winner={props.globalBoard[boardIndex] ?? null}
													/>
												</div>
											</>
										);
									}}
								</For>
							</div>
						</>
					)}
				</For>
			</div>
		</div>
	);

	return (
		<Motion.div
			class="w-full h-full flex flex-col items-center justify-center space-y-4"
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{
				opacity: props.inView !== false ? 1 : 0,
				scale: props.inView !== false ? 1 : 0.8,
			}}
			transition={{ duration: 0.5, easing: "ease-out" }}
		>
			<Show when={isMobile() && !isFullscreen()}>
				<div class="w-full max-w-[min(90vw,90vh)] flex justify-end mb-2">
					<Button
						variant="outline"
						size="sm"
						class="z-50"
						onClick={toggleFullscreen}
					>
						<Maximize2 class="h-4 w-4 mr-2" />
						Fullscreen
					</Button>
				</div>
			</Show>
			<Presence>
				<Show when={isFullscreen()}>
					<Motion.div
						class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<Motion.div
							class="z-50 relative"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.3, easing: "ease-out" }}
						>
							{renderBoard()}
							<Button
								variant="outline"
								size="sm"
								class="absolute top-[-40px] right-0 z-50"
								onClick={toggleFullscreen}
							>
								<Minimize2 class="h-4 w-4 mr-2" />
								Exit Fullscreen
							</Button>
						</Motion.div>
					</Motion.div>
				</Show>
			</Presence>
			<Show when={!isFullscreen()}>{renderBoard()}</Show>
		</Motion.div>
	);
}
