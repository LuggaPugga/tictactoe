import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { Loader, BotIcon as Robot, Users, Wifi, X } from "lucide-solid";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { connectWs, createRoom, type WsSubscription } from "@/lib/ws-client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const [roomCode, setRoomCode] = createSignal("");
	const [isJoining, setIsJoining] = createSignal(false);
	const [isLoading, setIsLoading] = createSignal(false);
	const [inQueue, setInQueue] = createSignal(false);
	const [queuePosition, setQueuePosition] = createSignal(0);
	const [activeTab, setActiveTab] = createSignal<"global" | "local">("global");
	const [name, setName] = createSignal("");

	const navigate = useNavigate();
	let ws: WsSubscription | null = null;
	let pendingName = "";

	onMount(() => {
		const stored = localStorage.getItem("playerName");
		if (stored) {
			try {
				setName(JSON.parse(stored));
			} catch {
				setName(stored);
			}
		}
	});

	const setPlayerName = (value: string) => {
		setName(value);
		localStorage.setItem("playerName", JSON.stringify(value));
	};

	const cleanupWs = () => {
		ws?.close();
		ws = null;
	};

	onCleanup(cleanupWs);

	const handleQueueJoin = async () => {
		const playerName = name().trim();
		if (!playerName) return;

		pendingName = playerName;
		setIsLoading(true);

		try {
			ws = await connectWs();
			ws.subscribe((msg) => {
				const data =
					typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
				console.log("WS message:", data);

				switch (data.type) {
					case "connected":
						console.log("Connected, sending joinQueue with name:", pendingName);
						ws?.send({ type: "joinQueue", playerName: pendingName });
						break;
					case "joinedQueue":
						console.log("Joined queue at position:", data.position);
						setInQueue(true);
						setQueuePosition(data.position);
						setIsLoading(false);
						break;
					case "queueUpdate":
						setQueuePosition(data.position);
						break;
					case "queueFull":
						setInQueue(false);
						setIsLoading(false);
						cleanupWs();
						alert("The queue is currently full. Please try again later.");
						break;
					case "alreadyInQueueOrGame":
						setInQueue(false);
						setIsLoading(false);
						cleanupWs();
						alert("You are already in a queue or game.");
						break;
					case "leftQueue":
						setInQueue(false);
						setQueuePosition(0);
						setIsLoading(false);
						break;
					case "lobbyCreated":
						console.log("Lobby created:", data.roomCode);
						sessionStorage.setItem(`playerName_${data.roomCode}`, pendingName);
						sessionStorage.setItem(
							`sessionCode_${data.roomCode}`,
							data.sessionCode,
						);
						cleanupWs();
						navigate({ to: `/game/${data.roomCode}` });
						break;
				}
			});
		} catch (e) {
			console.error("WS connection failed:", e);
			setInQueue(false);
			setIsLoading(false);
			alert("Failed to connect. Please try again.");
		}
	};

	const handleLeaveQueue = () => {
		if (!ws) return;
		setIsLoading(true);
		ws.send({ type: "leaveQueue" });
	};

	const handleCreateRoom = async () => {
		const playerName = name().trim();
		if (!playerName) return;

		setIsLoading(true);
		try {
			const code = await createRoom();
			if (code) {
				sessionStorage.setItem(`playerName_${code}`, playerName);
				navigate({ to: `/game/${code}` });
			} else {
				alert("Failed to create room. Please try again.");
			}
		} catch {
			alert("Failed to create room. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleJoinRoom = () => {
		const playerName = name().trim();
		const code = roomCode().trim().toUpperCase();
		if (playerName && code) {
			sessionStorage.setItem(`playerName_${code}`, playerName);
			navigate({ to: `/game/${code}` });
		}
	};

	const handleLocalMultiplayer = () => {
		if (name().trim()) {
			navigate({ to: "/local-multiplayer" });
		}
	};

	const hasName = () => name().trim().length > 0;

	return (
		<div class="h-screen w-full flex flex-col items-center justify-center p-4 bg-background text-foreground">
			<ThemeToggle />
			<div class="w-full max-w-lg space-y-8">
				<div class="text-center space-y-4">
					<h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
						Ultimate Tic Tac Toe
					</h1>
					<p class="text-2xl font-serif text-muted-foreground">
						Play online or locally
					</p>
					<p class="text-xs text-muted-foreground">
						<a
							href="/how-to-play"
							class="underline underline-offset-4 hover:text-primary"
						>
							How to play
						</a>
						<span class="mx-2">·</span>
						<a
							href="https://github.com/luggapugga/tictactoe"
							target="_blank"
							rel="noopener noreferrer"
							class="underline underline-offset-4 hover:text-primary"
						>
							GitHub
						</a>
					</p>
				</div>

				<Card class="border-none shadow-none">
					<CardHeader>
						<CardTitle>Let's Play!</CardTitle>
						<CardDescription>
							Choose how you want to play TicTacToe
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs
							value={activeTab()}
							onChange={(v) =>
								!inQueue() && setActiveTab(v as "global" | "local")
							}
							class="space-y-6"
						>
							<TabsList class="grid w-full grid-cols-2">
								<TabsTrigger value="global" disabled={inQueue()}>
									Global
								</TabsTrigger>
								<TabsTrigger value="local" disabled={inQueue()}>
									Local
								</TabsTrigger>
							</TabsList>

							<TabsContent value="global" class="space-y-6">
								<Input
									type="text"
									placeholder="Enter your name"
									value={name()}
									onInput={(e) => setPlayerName(e.currentTarget.value)}
									class="h-11"
									disabled={inQueue()}
								/>

								<div class="grid gap-4">
									<Button
										onClick={() =>
											inQueue() ? handleLeaveQueue() : handleQueueJoin()
										}
										class={`w-full h-11 text-base ${
											inQueue()
												? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
												: ""
										}`}
										disabled={!hasName() || isLoading()}
									>
										<Show
											when={inQueue()}
											fallback={
												<>
													<Users class="mr-2 h-5 w-5" />
													Quick Match
												</>
											}
										>
											<Loader class="mr-2 h-5 w-5 animate-spin" />
											In Queue ({queuePosition()}) - Click to Leave
										</Show>
									</Button>

									<Button
										onClick={handleCreateRoom}
										class="w-full h-11 text-base"
										variant="outline"
										disabled={!hasName() || isLoading() || inQueue()}
									>
										<Wifi class="mr-2 h-5 w-5" />
										Create Private Room
									</Button>

									<Button
										onClick={() => setIsJoining(true)}
										class="w-full h-11 text-base"
										variant="outline"
										disabled={!hasName() || inQueue()}
									>
										<Wifi class="mr-2 h-5 w-5" />
										Join Private Room
									</Button>
								</div>

								<Presence>
									<Show when={isJoining()}>
										<Motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: "auto" }}
											exit={{ opacity: 0, height: 0 }}
											class="space-y-4"
										>
											<div class="h-px bg-border my-4" />
											<div class="relative">
												<Input
													type="text"
													placeholder="Enter room code"
													value={roomCode()}
													onInput={(e) =>
														setRoomCode(e.currentTarget.value.toUpperCase())
													}
													class="h-11 pr-10"
													disabled={inQueue()}
												/>
												<Button
													variant="ghost"
													size="icon"
													class="absolute right-0 top-0 h-11 w-11"
													onClick={() => setIsJoining(false)}
													disabled={inQueue()}
												>
													<X class="h-4 w-4" />
												</Button>
											</div>
											<Button
												onClick={handleJoinRoom}
												class="w-full h-11 text-base"
												disabled={!hasName() || !roomCode() || inQueue()}
											>
												Join Room
											</Button>
										</Motion.div>
									</Show>
								</Presence>
							</TabsContent>

							<TabsContent value="local" class="space-y-6">
								<Input
									type="text"
									placeholder="Enter your name"
									value={name()}
									onInput={(e) => setPlayerName(e.currentTarget.value)}
									class="h-11"
									disabled={inQueue()}
								/>

								<div class="grid gap-4">
									<Button
										onClick={handleLocalMultiplayer}
										class="w-full h-11 text-base"
										disabled={!hasName() || inQueue()}
									>
										<Users class="mr-2 h-5 w-5" />
										Play with a Friend
									</Button>

									<Tooltip>
										<TooltipTrigger class="w-full">
											<Button
												class="w-full h-11 text-base pointer-events-none opacity-50"
												variant="outline"
												disabled
											>
												<Robot class="mr-2 h-5 w-5" />
												Play Against AI
											</Button>
										</TooltipTrigger>
										<TooltipContent class="bg-accent">
											<p>Still in development</p>
										</TooltipContent>
									</Tooltip>

									<div class="h-11" />
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
			<div class="w-full max-w-lg mx-auto mt-2 text-center text-xs text-muted-foreground">
				<a
					href="/how-to-play"
					class="underline underline-offset-4 hover:text-primary"
				>
					Rules
				</a>
				<span class="mx-2">·</span>
				<a
					href="https://github.com/luggapugga/tictactoe"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-4 hover:text-primary"
				>
					GitHub
				</a>
			</div>
		</div>
	);
}
