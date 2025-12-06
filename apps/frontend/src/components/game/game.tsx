import { makePersisted } from "@solid-primitives/storage";
import { useNavigate } from "@tanstack/solid-router";
import { LogOut } from "lucide-solid";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { Scoreboard } from "@/components/game/scoreboard";
import UltimateBoard from "@/components/game/ultimate-board";
import { WinnerAnimation } from "@/components/game/winning-animation";
import { RoomNotFound } from "@/components/room-not-found";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WaitingRoom } from "@/components/waiting-screen";
import { useWinnerAnimation } from "@/hooks/use-winner-animation";
import { createGameStore } from "@/lib/game-store";
import type { Player } from "@/lib/types";
import { connectWs, type WsSubscription } from "@/lib/ws-client";

interface GameComponentProps {
	roomCode: string;
}

export default function GameComponent(props: GameComponentProps) {
	const { state, set } = createGameStore();
	const [sessionCode, setSessionCode] = createSignal<string | null>(null);
	const [roomExists, setRoomExists] = createSignal(true);
	const [isNameSet, setIsNameSet] = createSignal(false);
	const [isSpectator, setIsSpectator] = createSignal(false);
	const [spectators, setSpectators] = createSignal<string[]>([]);
	const [isLoading, setIsLoading] = createSignal(false);
	const [playerName, setPlayerName] = makePersisted(createSignal(""), {
		name: "playerName",
	});

	const navigate = useNavigate();
	const { showAnimation, triggerAnimation, cleanup } = useWinnerAnimation();
	let ws: WsSubscription | null = null;

	createEffect(() => {
		const storedSession = sessionStorage.getItem(
			`sessionCode_${props.roomCode}`,
		);
		if (storedSession) setSessionCode(storedSession);

		const storedName =
			playerName() || sessionStorage.getItem(`playerName_${props.roomCode}`);
		if (storedName) {
			setPlayerName(storedName);
			setIsNameSet(true);
		}
	});

	createEffect(() => {
		if (!isNameSet()) return;

		setIsLoading(true);
		let mounted = true;

		const setupWs = async () => {
			ws = await connectWs();

			ws.subscribe(({ data: rawData }) => {
				if (!mounted) return;
				const data =
					typeof rawData === "string" ? JSON.parse(rawData) : rawData;
				handleWsMessage(data);
			});
		};

		setupWs();

		onCleanup(() => {
			mounted = false;
			ws?.close();
			cleanup();
		});
	});

	const handleWsMessage = (data: Record<string, unknown>) => {
		switch (data.type) {
			case "connected":
				ws?.send({
					type: "joinRoom",
					roomCode: props.roomCode,
					playerName: playerName(),
					sessionCode:
						sessionStorage.getItem(`sessionCode_${props.roomCode}`) ||
						undefined,
				});
				break;

			case "waitingForOpponent":
				setSessionCode(data.sessionCode as string);
				sessionStorage.setItem(
					`sessionCode_${props.roomCode}`,
					data.sessionCode as string,
				);
				set("roomStatus", data.status === "waiting" ? "waiting" : "playing");
				setIsLoading(false);
				break;

			case "sessionCode":
				setSessionCode(data.sessionCode as string);
				sessionStorage.setItem(
					`sessionCode_${props.roomCode}`,
					data.sessionCode as string,
				);
				break;

			case "gameStart":
				set({
					game: data.game as typeof state.game,
					globalBoard: data.globalBoard as typeof state.globalBoard,
					currentBoard: data.currentBoard as typeof state.currentBoard,
					currentTurn: data.currentTurn as string,
					scores: data.scores as typeof state.scores,
					players: (data.players as Player[]).map((p) => ({
						...p,
						connected: true,
					})),
					gameStatus: "playing",
					roomStatus: data.status === "waiting" ? "waiting" : "playing",
				});
				setIsLoading(false);
				break;

			case "updateGame":
				set({
					game: data.game as typeof state.game,
					globalBoard: data.globalBoard as typeof state.globalBoard,
					currentBoard: data.currentBoard as typeof state.currentBoard,
					currentTurn: data.currentTurn as string,
					scores: data.scores as typeof state.scores,
					...(data.winner !== undefined && {
						winner: data.winner as string,
						gameStatus: data.winner ? "over" : "playing",
					}),
				});
				if (data.winner) triggerAnimation();
				break;

			case "playerDisconnected":
				set("players", (players) =>
					players.map((p) =>
						p.sessionCode === data.sessionCode ? { ...p, connected: false } : p,
					),
				);
				break;

			case "playerReconnected":
				set("players", (players) =>
					players.map((p) =>
						p.sessionCode === data.sessionCode ? { ...p, connected: true } : p,
					),
				);
				break;

			case "roomFull":
				if (!sessionStorage.getItem(`sessionCode_${props.roomCode}`)) {
					alert("Room is full. You can join as a spectator.");
					ws?.send({
						type: "joinRoom",
						roomCode: props.roomCode,
						playerName: playerName(),
						asSpectator: true,
					});
				}
				break;

			case "reconnected":
			case "joinedAsSpectator":
				if (data.type === "joinedAsSpectator") setIsSpectator(true);
				set({
					game: data.game as typeof state.game,
					globalBoard: data.globalBoard as typeof state.globalBoard,
					currentBoard: data.currentBoard as typeof state.currentBoard,
					currentTurn: data.currentTurn as string,
					players: (data.players as Player[]).map((p) => ({
						...p,
						connected: true,
					})),
					scores: data.scores as typeof state.scores,
					winner: data.winner as string | null,
					gameStatus: data.winner ? "over" : "playing",
					roomStatus: data.status === "waiting" ? "waiting" : "playing",
				});
				setSpectators(
					(data.spectators as { name: string }[])?.map((s) => s.name) || [],
				);
				setIsLoading(false);
				if (data.winner) triggerAnimation();
				break;

			case "roomNotFound":
				setRoomExists(false);
				setIsLoading(false);
				break;

			case "gameReset":
				set({
					game: data.game as typeof state.game,
					globalBoard: data.globalBoard as typeof state.globalBoard,
					currentBoard: data.currentBoard as typeof state.currentBoard,
					currentTurn: data.currentTurn as string,
					scores: data.scores as typeof state.scores,
					winner: data.winner as string | null,
					gameStatus: "playing",
					roomStatus: data.status === "waiting" ? "waiting" : "playing",
				});
				break;

			case "spectatorJoined":
			case "spectatorLeft":
				setSpectators(
					(data.spectators as { name: string }[])?.map((s) => s.name) || [],
				);
				break;
		}
	};

	const handleCellClick = (boardIndex: number, cellIndex: number) => {
		if (
			state.game[boardIndex][cellIndex] !== null ||
			state.currentTurn !== sessionCode() ||
			state.gameStatus !== "playing" ||
			state.winner ||
			isSpectator()
		)
			return;

		ws?.send({
			type: "makeMove",
			roomCode: props.roomCode,
			boardIndex,
			cellIndex,
			sessionCode: sessionCode() ?? "",
		});
	};

	const handleLeaveGame = () => navigate({ to: "/" });

	const handleRequestReset = () => {
		if (state.gameStatus === "over" && !isSpectator()) {
			ws?.send({ type: "requestGameReset", roomCode: props.roomCode });
		}
	};

	const handleNameSubmit = (e: Event) => {
		e.preventDefault();
		const name = playerName().trim();
		if (name) {
			sessionStorage.setItem(`playerName_${props.roomCode}`, name);
			setIsNameSet(true);
		}
	};

	return (
		<Show
			when={isNameSet()}
			fallback={
				<div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
					<div class="absolute inset-0 opacity-10 dark:opacity-5">
						<div class="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-size-[40px_40px]" />
					</div>
					<Motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						class="rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8 relative z-10 border border-border/40"
					>
						<div class="text-center space-y-2">
							<h1 class="text-3xl font-bold text-[#c1644d] dark:text-[#e07a5f]">
								Join Game
							</h1>
							<p class="text-muted-foreground">
								Enter your name to join the game
							</p>
						</div>

						<form onSubmit={handleNameSubmit} class="space-y-6">
							<div class="space-y-2">
								<label for="playerName" class="text-sm font-medium">
									Your Name
								</label>
								<Input
									id="playerName"
									type="text"
									value={playerName()}
									onInput={(e) => setPlayerName(e.currentTarget.value)}
									placeholder="Enter name"
									class="w-full rounded-md border-border/60 bg-input px-4 py-2 text-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#e07a5f]/50"
									required
								/>
							</div>
							<Button
								type="submit"
								class="w-full bg-[#c1644d] hover:bg-[#b15a44] dark:bg-[#e07a5f] dark:hover:bg-[#d0694e] text-white font-semibold py-3 px-4 rounded-md transition duration-200"
							>
								Set Name
							</Button>
						</form>
					</Motion.div>
				</div>
			}
		>
			<Show when={roomExists()} fallback={<RoomNotFound />}>
				<Show
					when={!isLoading()}
					fallback={
						<div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
							<div class="absolute inset-0 opacity-10 dark:opacity-5">
								<div class="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-size-[40px_40px]" />
							</div>
							<Motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
								class="rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8 relative z-10"
							>
								<div class="flex flex-col items-center justify-center space-y-4">
									<div class="w-12 h-12 border-t-2 border-b-2 border-[#c1644d] rounded-full animate-spin" />
									<p class="text-lg">Connecting to room...</p>
								</div>
							</Motion.div>
						</div>
					}
				>
					<Show
						when={state.roomStatus !== "waiting"}
						fallback={
							<WaitingRoom
								gameCode={props.roomCode}
								onCancel={handleLeaveGame}
							/>
						}
					>
						<div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
							<div class="absolute inset-0 opacity-5">
								<div class="absolute inset-0 bg-grid-slate-700/[0.1] bg-size-[40px_40px]" />
							</div>
							<div class="absolute top-4 right-4">
								<Button
									onClick={handleLeaveGame}
									variant="ghost"
									size="icon"
									class="text-white hover:text-red-500 transition-colors hover:bg-transparent"
								>
									<LogOut class="size-6" />
								</Button>
							</div>

							<div class="w-full max-w-7xl relative z-10">
								<h1 class="text-4xl font-bold mb-8 text-center">
									Ultimate Tic-Tac-Toe
								</h1>
								<Show when={isSpectator()}>
									<p class="text-center text-yellow-400 mb-4">
										You are spectating this game
									</p>
								</Show>
								<Show
									when={
										state.gameStatus === "playing" ||
										state.gameStatus === "over" ||
										isSpectator()
									}
								>
									<div class="flex flex-col xl:flex-row gap-8 items-start justify-center">
										<div class="w-full xl:w-3/4 flex justify-center order-2 xl:order-1">
											<div class="w-full max-w-[80vh] aspect-square">
												<UltimateBoard
													game={state.game}
													globalBoard={state.globalBoard}
													currentBoard={state.currentBoard}
													onCellClick={handleCellClick}
												/>
											</div>
										</div>
										<div class="w-full lg:w-1/4 lg:fixed lg:right-4 lg:top-1/2 lg:-translate-y-1/2 order-1 lg:order-2">
											<Scoreboard
												players={state.players}
												scores={state.scores}
												currentTurn={state.currentTurn}
												sessionCode={sessionCode()}
												ended={!!state.winner}
												onPlayAgain={handleRequestReset}
												spectatorCount={spectators().length}
												roomCode={props.roomCode}
											/>
										</div>
									</div>
								</Show>
								<Show when={state.gameStatus === "interrupted"}>
									<p class="text-red-500 mb-4 text-center">
										Your opponent has disconnected. You can leave the game or
										wait for a new opponent.
									</p>
								</Show>
								<Show
									when={state.gameStatus === "interrupted" && !isSpectator()}
								>
									<div class="flex justify-center mt-8">
										<Button
											onClick={handleRequestReset}
											class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
										>
											Play Again
										</Button>
									</div>
								</Show>
							</div>
							<WinnerAnimation
								isVisible={showAnimation()}
								winner={
									state.players.find((p) => p.sessionCode === state.winner)
										?.name || ""
								}
							/>
						</div>
					</Show>
				</Show>
			</Show>
		</Show>
	);
}
