"use client";

import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useReducer, useState } from "react";
import { Scoreboard } from "@/components/game/scoreboard";
import UltimateBoard from "@/components/game/ultimate-board";
import { WinnerAnimation } from "@/components/game/winning-animation";
import { RoomNotFound } from "@/components/room-not-found";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WaitingRoom } from "@/components/waiting-screen";
import { useWinnerAnimation } from "@/hooks/useWinnerAnimation";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import { getSocket } from "@/lib/socket";
import type { Player } from "@/lib/types";

export default function GameComponent({ roomCode }: { roomCode: string }) {
	const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
	const [sessionCode, setSessionCode] = useState<string | null>(null);
	const [roomExists, setRoomExists] = useState(true);
	const [playerName, setPlayerName] = useState("");
	const [isNameSet, setIsNameSet] = useState(false);
	const [isSpectator, setIsSpectator] = useState(false);
	const [spectators, setSpectators] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const { showAnimation, triggerAnimation, cleanup } = useWinnerAnimation();

	useEffect(() => {
		const storedSessionCode = sessionStorage.getItem(`sessionCode_${roomCode}`);
		if (storedSessionCode) {
			setSessionCode(storedSessionCode);
		}

		const storedPlayerName =
			localStorage.getItem("name") ||
			sessionStorage.getItem(`playerName_${roomCode}`);
		if (storedPlayerName) {
			setPlayerName(storedPlayerName);
			setIsNameSet(true);
		}
	}, [roomCode]);

	useEffect(() => {
		if (!isNameSet) return;

		setIsLoading(true);
		const socket = getSocket();

		const joinRoom = () => {
			const storedSessionCode = sessionStorage.getItem(
				`sessionCode_${roomCode}`,
			);
			socket.emit("joinRoom", {
				roomCode,
				playerName,
				sessionCode: storedSessionCode,
			});
		};

		if (socket.connected) {
			joinRoom();
		}

		socket.on("connect", joinRoom);

		socket.on(
			"waitingForOpponent",
			({ sessionCode: newSessionCode, status }) => {
				setSessionCode(newSessionCode);
				sessionStorage.setItem(`sessionCode_${roomCode}`, newSessionCode);
				dispatch({
					type: "SET_ROOM_STATUS",
					status: status === "waiting" ? "waiting" : "playing",
				});
				setIsLoading(false);
			},
		);

		socket.on("sessionCode", (newSessionCode) => {
			setSessionCode(newSessionCode);
			sessionStorage.setItem(`sessionCode_${roomCode}`, newSessionCode);
		});

		socket.on(
			"gameStart",
			({
				players,
				game,
				globalBoard,
				currentBoard,
				currentTurn,
				scores,
				status,
			}) => {
				dispatch({
					type: "UPDATE_GAME",
					game,
					globalBoard,
					currentBoard,
					currentTurn,
					scores,
				});
				dispatch({
					type: "UPDATE_PLAYERS",
					players: players.map((player: Player) => ({
						...player,
						connected: true,
					})),
				});
				dispatch({ type: "SET_GAME_STATUS", status: "playing" });
				dispatch({
					type: "SET_ROOM_STATUS",
					status: status === "waiting" ? "waiting" : "playing",
				});
				setIsLoading(false);
			},
		);

		socket.on(
			"updateGame",
			({ game, globalBoard, currentBoard, currentTurn, scores, winner }) => {
				dispatch({
					type: "UPDATE_GAME",
					game,
					globalBoard,
					currentBoard,
					currentTurn,
					scores,
					winner,
				});
				if (winner) {
					triggerAnimation();
				}
			},
		);

		socket.on("playerDisconnected", (disconnectedSessionCode) => {
			dispatch({
				type: "PLAYER_DISCONNECTED",
				sessionCode: disconnectedSessionCode,
			});
		});

		socket.on("playerReconnected", (reconnectedSessionCode) => {
			dispatch({
				type: "PLAYER_RECONNECTED",
				sessionCode: reconnectedSessionCode,
			});
		});

		socket.on("roomFull", () => {
			if (!sessionStorage.getItem(`sessionCode_${roomCode}`)) {
				alert("Room is full. You can join as a spectator.");
				socket.emit("joinRoom", { roomCode, playerName, asSpectator: true });
			} else {
				console.log("Attempting to reconnect to the game...");
			}
		});

		socket.on(
			"reconnected",
			({
				game,
				globalBoard,
				currentBoard,
				currentTurn,
				players,
				scores,
				winner,
				status,
				spectators,
			}) => {
				dispatch({
					type: "RECONNECTED",
					game,
					globalBoard,
					currentBoard,
					currentTurn,
					players,
					scores,
					winner,
					status: winner ? "over" : "playing",
				});
				dispatch({
					type: "SET_ROOM_STATUS",
					status: status === "waiting" ? "waiting" : "playing",
				});
				setSpectators(spectators);
				setIsLoading(false);
				if (winner) {
					triggerAnimation();
				}
			},
		);

		socket.on("roomNotFound", () => {
			setRoomExists(false);
			setIsLoading(false);
		});

		socket.on(
			"gameReset",
			({
				game,
				globalBoard,
				currentBoard,
				currentTurn,
				scores,
				winner,
				status,
			}) => {
				dispatch({ type: "RESET_GAME" });
				dispatch({
					type: "UPDATE_GAME",
					game,
					globalBoard,
					currentBoard,
					currentTurn,
					scores,
					winner,
				});
				dispatch({
					type: "SET_ROOM_STATUS",
					status: status === "waiting" ? "waiting" : "playing",
				});
			},
		);

		socket.on("joinedAsSpectator", (data) => {
			setIsSpectator(true);
			dispatch({
				type: "UPDATE_GAME",
				game: data.game,
				globalBoard: data.globalBoard,
				currentBoard: data.currentBoard,
				currentTurn: data.currentTurn,
				scores: data.scores,
				winner: data.winner,
			});
			dispatch({ type: "UPDATE_PLAYERS", players: data.players });
			dispatch({
				type: "SET_GAME_STATUS",
				status: data.winner ? "over" : "playing",
			});
			dispatch({
				type: "SET_ROOM_STATUS",
				status: data.status === "waiting" ? "waiting" : "playing",
			});
			setSpectators(Array.isArray(data.spectators) ? data.spectators : []);
			setIsLoading(false);
			if (data.winner) {
				triggerAnimation();
			}
		});

		socket.on("spectatorJoined", ({ spectators: newSpectators }) => {
			setSpectators(Array.isArray(newSpectators) ? newSpectators : []);
		});

		socket.on("spectatorLeft", ({ spectators: newSpectators }) => {
			setSpectators(Array.isArray(newSpectators) ? newSpectators : []);
		});

		return () => {
			const events = [
				"connect",
				"waitingForOpponent",
				"sessionCode",
				"gameStart",
				"updateGame",
				"playerDisconnected",
				"playerReconnected",
				"roomFull",
				"reconnected",
				"roomNotFound",
				"gameReset",
				"joinedAsSpectator",
				"spectatorJoined",
				"spectatorLeft",
			];
			events.forEach((e) => socket.off(e));
			cleanup();
		};
	}, [roomCode, playerName, isNameSet, cleanup, triggerAnimation]);

	const handleCellClick = useCallback(
		(boardIndex: number, cellIndex: number) => {
			if (
				gameState.game[boardIndex][cellIndex] === null &&
				gameState.currentTurn === sessionCode &&
				gameState.gameStatus === "playing" &&
				!gameState.winner &&
				!isSpectator
			) {
				getSocket().emit("makeMove", {
					roomCode,
					boardIndex,
					cellIndex,
					sessionCode,
				});
			}
		},
		[
			gameState.game,
			gameState.currentTurn,
			sessionCode,
			gameState.gameStatus,
			gameState.winner,
			roomCode,
			isSpectator,
		],
	);

	const handleLeaveGame = useCallback(() => {
		router.push("/");
	}, [router]);

	const handleRequestReset = useCallback(() => {
		if (gameState.gameStatus === "over" && !isSpectator) {
			getSocket().emit("requestGameReset", roomCode);
		}
	}, [roomCode, gameState.gameStatus, isSpectator]);

	const handleNameSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (playerName.trim()) {
				localStorage.setItem("name", playerName);
				sessionStorage.setItem(`playerName_${roomCode}`, playerName);
				setIsNameSet(true);
			}
		},
		[playerName, roomCode],
	);

	if (!isNameSet) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
				<div className="absolute inset-0 opacity-10 dark:opacity-5">
					<div className="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
				</div>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8 relative z-10 border border-border/40"
				>
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-bold text-[#c1644d] dark:text-[#e07a5f]">
							Join Game
						</h1>
						<p className="text-muted-foreground">
							Enter your name to join the game
						</p>
					</div>

					<form onSubmit={handleNameSubmit} className="space-y-6">
						<div className="space-y-2">
							<label htmlFor="playerName" className="text-sm font-medium">
								Your Name
							</label>
							<Input
								id="playerName"
								type="text"
								value={playerName}
								onChange={(e) => setPlayerName(e.target.value)}
								placeholder="Enter name"
								className="w-full rounded-md border-border/60 bg-input px-4 py-2 text-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#e07a5f]/50"
								required
							/>
						</div>

						<Button
							type="submit"
							className="w-full bg-[#c1644d] hover:bg-[#b15a44] dark:bg-[#e07a5f] dark:hover:bg-[#d0694e] text-white font-semibold py-3 px-4 rounded-md transition duration-200"
						>
							Set Name
						</Button>
					</form>
				</motion.div>
			</div>
		);
	}

	if (!roomExists) {
		return <RoomNotFound />;
	}

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
				<div className="absolute inset-0 opacity-10 dark:opacity-5">
					<div className="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
				</div>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8 relative z-10"
				>
					<div className="flex flex-col items-center justify-center space-y-4">
						<div className="w-12 h-12 border-t-2 border-b-2 border-[#c1644d] rounded-full animate-spin"></div>
						<p className="text-lg">Connecting to room...</p>
					</div>
				</motion.div>
			</div>
		);
	}

	if (gameState.roomStatus === "waiting") {
		return <WaitingRoom gameCode={roomCode} onCancel={handleLeaveGame} />;
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
			<h1>{gameState.roomStatus}</h1>
			<div className="absolute inset-0 opacity-5">
				<div className="absolute inset-0 bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
			</div>
			<div className="absolute top-4 right-4">
				<Button
					onClick={handleLeaveGame}
					variant="ghost"
					size="icon"
					className="text-white hover:text-red-500 transition-colors hover:bg-transparent"
					data-umami-event="leave-game"
				>
					<LogOut className="size-6" />
				</Button>
			</div>

			<div className="w-full max-w-7xl relative z-10">
				<h1 className="text-4xl font-bold mb-8 text-center">
					Ultimate Tic-Tac-Toe
				</h1>
				{isSpectator && (
					<p className="text-center text-yellow-400 mb-4">
						You are spectating this game
					</p>
				)}
				{(gameState.gameStatus === "playing" ||
					gameState.gameStatus === "over" ||
					isSpectator) && (
					<div className="flex flex-col xl:flex-row gap-8 items-start justify-center">
						<div className="w-full xl:w-3/4 flex justify-center order-2 xl:order-1">
							<div className="w-full max-w-[80vh] aspect-square">
								<UltimateBoard
									game={gameState.game}
									globalBoard={gameState.globalBoard}
									currentBoard={gameState.currentBoard}
									onCellClick={handleCellClick}
								/>
							</div>
						</div>
						<div className="w-full lg:w-1/4 lg:fixed lg:right-4 lg:top-1/2 lg:-translate-y-1/2 order-1 lg:order-2">
							<Scoreboard
								players={gameState.players}
								scores={gameState.scores}
								currentTurn={gameState.currentTurn}
								sessionCode={sessionCode}
								ended={!!gameState.winner}
								onPlayAgain={handleRequestReset}
								spectatorCount={spectators.length | 0}
								roomCode={roomCode}
							/>
						</div>
					</div>
				)}
				{gameState.gameStatus === "interrupted" && (
					<p className="text-red-500 mb-4 text-center">
						Your opponent has disconnected. You can leave the game or wait for a
						new opponent.
					</p>
				)}
				{gameState.gameStatus === "interrupted" && !isSpectator && (
					<div className="flex justify-center mt-8">
						<Button
							onClick={handleRequestReset}
							className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
						>
							Play Again
						</Button>
					</div>
				)}
			</div>
			<WinnerAnimation
				isVisible={showAnimation}
				winner={
					gameState.players.find((p) => p.sessionCode === gameState.winner)
						?.name || ""
				}
			/>
		</div>
	);
}
