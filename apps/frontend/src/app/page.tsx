"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { BotIcon as Robot, Loader2, Users, Wifi, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { createRoom } from "@/utils/create-room";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export default function Home() {
	const [playerName, setPlayerName] = useState("");
	const [roomCode, setRoomCode] = useState("");
	const [isJoining, setIsJoining] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [inQueue, setInQueue] = useState(false);
	const [queuePosition, setQueuePosition] = useState(0);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [activeTab, setActiveTab] = useState("global");
	const router = useRouter();

	useEffect(() => {
		const newSocket = io(BACKEND_URL);
		setSocket(newSocket);

		return () => {
			newSocket.disconnect();
		};
	}, []);

	useEffect(() => {
		const storedName = localStorage.getItem("name");
		if (storedName) {
			setPlayerName(storedName);
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("name", playerName);
	}, [playerName]);

	useEffect(() => {
		if (!socket) return;

		const eventHandlers = {
			joinedQueue: ({ position }: { position: number }) => {
				setInQueue(true);
				setQueuePosition(position);
			},
			queueUpdate: ({ position }: { position: number }) => {
				setQueuePosition(position);
			},
			queueFull: () => {
				alert("The queue is currently full. Please try again later.");
			},
			alreadyInQueueOrGame: () => {
				alert("You are already in a queue or game.");
			},
			leftQueue: () => {
				setInQueue(false);
				setQueuePosition(0);
				setIsLoading(false);
			},
			lobbyCreated: ({
				roomCode,
				sessionCode,
			}: {
				roomCode: string;
				sessionCode: string;
			}) => {
				sessionStorage.setItem(`playerName_${roomCode}`, playerName);
				sessionStorage.setItem(`sessionCode_${roomCode}`, sessionCode);
				router.push(`/${roomCode}`);
			},
		};

		Object.entries(eventHandlers).forEach(([event, handler]) => {
			socket.on(event, handler);
		});

		return () => {
			Object.keys(eventHandlers).forEach((event) => {
				socket.off(event);
			});
		};
	}, [socket, playerName, router]);

	const handleQueueJoin = useCallback(() => {
		setInQueue(true);
		if (playerName && socket) {
			socket.emit("joinQueue", { playerName });
		}
	}, [playerName, socket]);

	const handleLeaveQueue = useCallback(() => {
		setInQueue(false);
		if (socket) {
			setIsLoading(true);
			socket.emit("leaveQueue");
		}
	}, [socket]);

	const handleCreateRoom = useCallback(async () => {
		if (playerName) {
			setIsLoading(true);
			const roomCode = await createRoom();
			if (roomCode) {
				sessionStorage.setItem(`playerName_${roomCode}`, playerName);
				router.push(`/${roomCode}`);
			} else {
				alert("Failed to create room. Please try again.");
			}
			setIsLoading(false);
		}
	}, [playerName, router]);

	const handleJoinRoom = useCallback(() => {
		if (playerName && roomCode) {
			sessionStorage.setItem(`playerName_${roomCode}`, playerName);
			router.push(`/${roomCode}`);
		}
	}, [playerName, roomCode, router]);

	const handleLocalMultiplayer = useCallback(() => {
		if (playerName) {
			router.push("/local-multiplayer");
		}
	}, [playerName, router]);

	const handlePlayAgainstBots = useCallback(() => {
		if (playerName) {
			router.push("/play-against-bots");
		}
	}, [playerName, router]);

	return (
		<div>
			<div className="h-[80vh] w-full flex flex-col items-center justify-center p-4 bg-background text-foreground">
				<ThemeToggle />
				<div className="w-full max-w-lg space-y-8">
					<div className="text-center space-y-4">
						<h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
							TicTacToe
						</h1>
						<p className="text-2xl font-serif text-muted-foreground">
							Play anywhere, anytime
						</p>
						<a
							href="https://github.com/luggapugga/tictactoe"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
							data-umami-event="visit-github"
						>
							View on GitHub
						</a>
					</div>

					<Card className="border-none shadow-none">
						<CardHeader>
							<CardTitle>Let&apos;s Play!</CardTitle>
							<CardDescription>
								Choose how you want to play TicTacToe
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs
								value={activeTab}
								onValueChange={setActiveTab}
								className="space-y-6"
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger
										value="global"
										disabled={inQueue}
										data-umami-event="select-global-tab"
									>
										Global
									</TabsTrigger>
									<TabsTrigger
										value="local"
										disabled={inQueue}
										data-umami-event="select-local-tab"
									>
										Local
									</TabsTrigger>
								</TabsList>

								<div className="relative">
									<TabsContent
										value="global"
										className="space-y-6 absolute top-0 left-0 w-full transition-opacity duration-300 ease-in-out"
									>
										<Input
											type="text"
											placeholder="Enter your name"
											value={playerName}
											onChange={(e) => setPlayerName(e.target.value)}
											className="h-11"
											disabled={inQueue}
										/>

										<div className="grid gap-4">
											<Button
												onClick={() =>
													inQueue ? handleLeaveQueue() : handleQueueJoin()
												}
												className={`w-full h-11 text-base ${
													inQueue ??
													"bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
												}`}
												disabled={!playerName || isLoading}
												data-umami-event={
													inQueue ? "leave-queue" : "join-queue"
												}
											>
												{inQueue ? (
													<>
														<Loader2 className="mr-2 h-5 w-5 animate-spin" />
														In Queue ({queuePosition}) - Click to Leave
													</>
												) : (
													<>
														<Users className="mr-2 h-5 w-5" />
														Quick Match
													</>
												)}
											</Button>

											<Button
												onClick={handleCreateRoom}
												className="w-full h-11 text-base"
												variant="outline"
												disabled={!playerName || isLoading || inQueue}
												data-umami-event="create-private-room"
											>
												<Wifi className="mr-2 h-5 w-5" />
												Create Private Room
											</Button>

											<Button
												onClick={() => setIsJoining(true)}
												className="w-full h-11 text-base"
												variant="outline"
												disabled={!playerName || inQueue}
												data-umami-event="open-join-room"
											>
												<Wifi className="mr-2 h-5 w-5" />
												Join Private Room
											</Button>
										</div>

										<AnimatePresence>
											{isJoining && (
												<motion.div
													initial={{ opacity: 0, height: 0 }}
													animate={{ opacity: 1, height: "auto" }}
													exit={{ opacity: 0, height: 0 }}
													className="space-y-4"
												>
													<Separator />
													<div className="relative">
														<Input
															type="text"
															placeholder="Enter room code"
															value={roomCode}
															onChange={(e) =>
																setRoomCode(e.target.value.toUpperCase())
															}
															className="h-11 pr-10"
															disabled={inQueue}
														/>
														<Button
															variant="ghost"
															size="icon"
															className="absolute right-0 top-0 h-11 w-11"
															onClick={() => setIsJoining(false)}
															disabled={inQueue}
															data-umami-event="close-join-room"
														>
															<X className="h-4 w-4" />
														</Button>
													</div>
													<Button
														onClick={handleJoinRoom}
														className="w-full h-11 text-base"
														disabled={!playerName || !roomCode || inQueue}
														data-umami-event="join-private-room"
													>
														Join Room
													</Button>
												</motion.div>
											)}
										</AnimatePresence>
									</TabsContent>

									<TabsContent
										value="local"
										className="space-y-6 absolute top-0 left-0 w-full transition-opacity duration-300 ease-in-out"
									>
										<Input
											type="text"
											placeholder="Enter your name"
											value={playerName}
											onChange={(e) => setPlayerName(e.target.value)}
											className="h-11"
											disabled={inQueue}
										/>

										<div className="grid gap-4">
											<Button
												onClick={handleLocalMultiplayer}
												className="w-full h-11 text-base"
												disabled={!playerName || inQueue}
												data-umami-event="play-local-multiplayer"
											>
												<Users className="mr-2 h-5 w-5" />
												Play with a Friend
											</Button>

											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<span className="w-full inline-block">
															<Button
																onClick={handlePlayAgainstBots}
																className="w-full h-11 text-base pointer-events-none opacity-50"
																variant="outline"
																aria-disabled="true"
																data-umami-event="play-against-ai"
															>
																<Robot className="mr-2 h-5 w-5" />
																Play Against AI
															</Button>
														</span>
													</TooltipTrigger>
													<TooltipContent className="bg-accent" side="right">
														<p>Still in development</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
									</TabsContent>
								</div>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
