import { Circle, Eye, Hash, Minus, Trophy, X } from "lucide-solid";
import { createMemo, For, Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Player, Score } from "@/lib/types";

interface ScoreboardProps {
	players: Player[];
	localGame?: boolean;
	scores: Record<string, Score>;
	currentTurn: string | null;
	sessionCode?: string | null;
	ended?: boolean;
	onPlayAgain?: () => void;
	spectatorCount?: number;
	roomCode?: string;
}

export function Scoreboard(props: ScoreboardProps) {
	const sortedPlayers = createMemo(() => {
		return [...props.players].sort((a, b) => {
			if (props.localGame) return 0;
			if (a.sessionCode === props.sessionCode) return -1;
			if (b.sessionCode === props.sessionCode) return 1;
			return 0;
		});
	});

	const getPlayerSymbol = (player: Player): "X" | "O" => {
		if (props.localGame) {
			return player.id === "O" ? "O" : "X";
		}
		const key = player.sessionCode || player.id;
		const originalIndex = props.players.findIndex(
			(p) => (p.sessionCode || p.id) === key,
		);
		return originalIndex === 1 ? "O" : "X";
	};

	return (
		<Card class="w-full max-w-lg bg-background border-0 shadow-none">
			<CardContent class="p-6 space-y-6">
				<Show when={props.roomCode}>
					<Card class="rounded-none border-x-0 border-t-0">
						<CardContent class="p-3 flex justify-between items-center">
							<div class="flex items-center space-x-2">
								<div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
									<Eye class="w-4 h-4 text-muted-foreground" />
								</div>
								<div>
									<span class="text-sm font-medium">
										{props.spectatorCount}
									</span>
									<span class="text-xs text-muted-foreground ml-1">
										Spectators
									</span>
								</div>
							</div>
							<div class="flex items-center space-x-2">
								<div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
									<Hash class="w-4 h-4 text-muted-foreground" />
								</div>
								<div>
									<span class="text-sm font-medium">{props.roomCode}</span>
									<span class="text-xs text-muted-foreground ml-1">Room</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</Show>
				<div class="space-y-4">
					<For each={sortedPlayers()}>
						{(player, index) => (
							<Motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index() * 0.1 }}
							>
								<Card
									class={`overflow-hidden ${
										player.sessionCode === props.currentTurn ||
										player.id === props.currentTurn
											? "ring-0 ring-primary"
											: ""
									}`}
								>
									<div
										class={`p-4 ${
											player.sessionCode === props.currentTurn ||
											player.id === props.currentTurn
												? "bg-primary text-white"
												: "bg-muted"
										}`}
									>
										<div class="flex items-center justify-between">
											<div class="flex items-center space-x-3">
												<div
													class={`w-10 h-10 rounded-full flex items-center justify-center ${
														player.sessionCode === props.currentTurn ||
														player.id === props.currentTurn
															? "bg-white text-primary"
															: "bg-primary text-white"
													}`}
												>
													<Show
														when={getPlayerSymbol(player) === "O"}
														fallback={<X class="size-6" />}
													>
														<Circle class="size-6" />
													</Show>
												</div>
												<div>
													<span class="text-lg font-semibold">
														{player.name}
														<Show
															when={
																!props.localGame &&
																player.sessionCode === props.sessionCode
															}
														>
															{" "}
															(You)
														</Show>
													</span>
													<Show
														when={
															(player.sessionCode === props.currentTurn ||
																player.id === props.currentTurn) &&
															!props.ended
														}
													>
														<div class="text-sm font-medium">Current Turn</div>
													</Show>
												</div>
											</div>
											<Show when={!props.localGame && !player.connected}>
												<div class="text-sm font-medium text-yellow-300">
													(Disconnected)
												</div>
											</Show>
										</div>
									</div>
									<div class="p-4 bg-background">
										<div class="flex justify-between text-sm">
											<div class="flex items-center space-x-2">
												<Trophy class="size-5 text-yellow-400" />
												<span class="font-medium">
													{props.scores[player.sessionCode || player.id]
														?.wins || 0}
												</span>
											</div>
											<div class="flex items-center space-x-2">
												<X class="size-5 text-red-400" />
												<span class="font-medium">
													{props.scores[player.sessionCode || player.id]
														?.losses || 0}
												</span>
											</div>
											<div class="flex items-center space-x-2">
												<Minus class="size-5 text-blue-400" />
												<span class="font-medium">
													{props.scores[player.sessionCode || player.id]
														?.ties || 0}
												</span>
											</div>
										</div>
									</div>
								</Card>
							</Motion.div>
						)}
					</For>
				</div>
				<Presence>
					<Show when={props.ended}>
						<Motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.3 }}
						>
							<Button
								onClick={props.onPlayAgain}
								class="w-full h-12 text-base font-semibold transition duration-200"
							>
								Play Again
							</Button>
						</Motion.div>
					</Show>
				</Presence>
			</CardContent>
		</Card>
	);
}
