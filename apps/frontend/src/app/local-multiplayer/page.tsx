"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UltimateBoard from "@/components/game/ultimate-board";
import { Scoreboard } from "@/components/game/scoreboard";
import type { CellValue, Game, LocalBoard, Player, Score } from "@/lib/types";
import { WinnerAnimation } from "@/components/game/winning-animation";
import { checkWinner } from "@/lib/game-utils";
import { ContinueGameDialog } from "@/components/game/continue-game-dialog";

export default function LocalMultiplayer() {
	const [players, setPlayers] = useState<Player[]>([]);
	const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
	const [game, setGame] = useState<Game>(Array(9).fill(Array(9).fill(null)));
	const [globalBoard, setGlobalBoard] = useState<LocalBoard>(
		Array(9).fill(null),
	);
	const [currentBoard, setCurrentBoard] = useState<number | null>(null);
	const [scores, setScores] = useState<Record<string, Score>>({});
	const [winner, setWinner] = useState<Player | "tie" | null>(null);
	const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
	const [isGameOverDialogOpen, setIsGameOverDialogOpen] =
		useState<boolean>(false);
	const [player1Name, setPlayer1Name] = useState<string>("");
	const [isContinueDialogOpen, setIsContinueDialogOpen] = useState(false);
	const [showAnimation, setShowAnimation] = useState(false);

	useEffect(() => {
		if (winner) {
			setShowAnimation(true);
		}
	}, [winner]);

	useEffect(() => {
		if (showAnimation) {
			const timer = setTimeout(() => {
				setShowAnimation(false);
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [showAnimation]);

	useEffect(() => {
		const storedName = localStorage.getItem("name");
		if (storedName) {
			setPlayer1Name(storedName);
		}

		const savedGame = sessionStorage.getItem("ticTacToeGame");
		if (savedGame) {
			setIsContinueDialogOpen(true);
			const parsedGame = JSON.parse(savedGame);
			setIsGameStarted(true);
			setPlayers(parsedGame.players);
			setCurrentPlayerIndex(parsedGame.currentPlayerIndex);
			setGame(parsedGame.game);
			setGlobalBoard(parsedGame.globalBoard);
			setCurrentBoard(parsedGame.currentBoard);
			setScores(parsedGame.scores);
		}
	}, []);

	const handleStartGame = useCallback((e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const player1Name = formData.get("player1") as string;
		const player2Name = formData.get("player2") as string;

		if (player1Name && player2Name) {
			const newPlayers: Player[] = [
				{ id: "X", name: player1Name, sessionCode: "", connected: true },
				{ id: "O", name: player2Name, sessionCode: "", connected: true },
			];
			setPlayers(newPlayers);
			setScores({
				X: { wins: 0, losses: 0, ties: 0 },
				O: { wins: 0, losses: 0, ties: 0 },
			});
			setIsGameStarted(true);
			localStorage.setItem("name", player1Name);
		}
	}, []);

	const saveGameState = useCallback(() => {
		const gameState = {
			players,
			currentPlayerIndex,
			game,
			globalBoard,
			currentBoard,
			scores,
			isGameStarted,
		};
		sessionStorage.setItem("ticTacToeGame", JSON.stringify(gameState));
	}, [
		players,
		currentPlayerIndex,
		game,
		globalBoard,
		currentBoard,
		scores,
		isGameStarted,
	]);

	const handleCellClick = useCallback(
		(boardIndex: number, cellIndex: number) => {
			const boardToCheck = game[boardIndex];
			if (!boardToCheck) return;

			const cellValue = boardToCheck[cellIndex];
			if (cellValue === undefined) return;

			if (
				cellValue === null &&
				(currentBoard === null ||
					currentBoard === boardIndex ||
					(currentBoard !== null &&
						game[currentBoard]?.every((cell) => cell !== null)))
			) {
				const newGame: Game = game.map((board, i) =>
					i === boardIndex
						? board.map((cell, j) =>
								j === cellIndex
									? (players[currentPlayerIndex]?.id as CellValue)
									: cell,
							)
						: board,
				);
				setGame(newGame);

				const boardToCheck = newGame[boardIndex];
				if (!boardToCheck) return;

				const localWinner = checkWinner(boardToCheck);
				const newGlobalBoard: LocalBoard = [...globalBoard];
				if (localWinner) {
					newGlobalBoard[boardIndex] =
						localWinner === "tie" ? null : localWinner;
				}
				setGlobalBoard(newGlobalBoard);

				const globalWinner = checkWinner(newGlobalBoard);
				if (globalWinner) {
					const currentPlayer = players[currentPlayerIndex];
					if (globalWinner === "tie") {
						setWinner("tie");
					} else if (currentPlayer) {
						setWinner(currentPlayer);
					} else {
						return;
					}

					setIsGameOverDialogOpen(true);

					const newScores: Record<string, Score> = { ...scores };
					if (globalWinner === "tie") {
						if (newScores.X) newScores.X.ties++;
						if (newScores.O) newScores.O.ties++;
					} else {
						if (newScores[globalWinner]) newScores[globalWinner].wins++;
						const otherPlayer = globalWinner === "X" ? "O" : "X";
						if (newScores[otherPlayer]) newScores[otherPlayer].losses++;
					}
					setScores(newScores);
				} else {
					setCurrentPlayerIndex(1 - currentPlayerIndex);

					const nextBoardCells = newGame[cellIndex];
					const isBoardFull =
						nextBoardCells?.every((cell) => cell !== null) || false;
					const isBoardWon = newGlobalBoard[cellIndex] !== null;

					setCurrentBoard(isBoardFull || isBoardWon ? null : cellIndex);
				}
			}
			saveGameState();
		},
		[
			game,
			globalBoard,
			currentBoard,
			players,
			currentPlayerIndex,
			scores,
			saveGameState,
		],
	);

	const handlePlayAgain = useCallback(() => {
		setGame(Array(9).fill(Array(9).fill(null)));
		setGlobalBoard(Array(9).fill(null));
		setCurrentBoard(null);
		setCurrentPlayerIndex(0);
		setWinner(null);
		setIsGameOverDialogOpen(false);
	}, []);

	const handleContinueGame = () => {
		setIsContinueDialogOpen(false);
	};

	const handleNewGame = () => {
		sessionStorage.removeItem("ticTacToeGame");
		setIsContinueDialogOpen(false);
		setIsGameStarted(false);
		setPlayers([]);
		setGame(Array(9).fill(Array(9).fill(null)));
		setGlobalBoard(Array(9).fill(null));
		setCurrentBoard(null);
		setCurrentPlayerIndex(0);
		setScores({});
		setWinner(null);
	};

	useEffect(() => {
		const handleBeforeUnload = () => {
			saveGameState();
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [saveGameState]);

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 text-foreground relative overflow-hidden">
			<div className="absolute inset-0 opacity-10 dark:opacity-5">
				<div className="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
			</div>
			{!isGameStarted ? (
				<div className="rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8 relative z-10 border border-border/40">
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-bold text-[#c1644d] dark:text-[#e07a5f]">
							Local Multiplayer
						</h1>
						<p className="text-muted-foreground">
							Enter player names to start the game
						</p>
					</div>

					<form onSubmit={handleStartGame} className="space-y-6">
						<div className="space-y-2">
							<label htmlFor="player1" className="text-sm font-medium">
								Player 1 (X)
							</label>
							<Input
								id="player1"
								type="text"
								name="player1"
								placeholder="Enter name"
								value={player1Name}
								onChange={(e) => setPlayer1Name(e.target.value)}
								className="w-full rounded-md border-border/60 bg-input px-4 py-2 text-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#e07a5f]/50"
								required
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="player2" className="text-sm font-medium">
								Player 2 (O)
							</label>
							<Input
								id="player2"
								type="text"
								name="player2"
								placeholder="Enter name"
								className="w-full rounded-md border-border/60 bg-input px-4 py-2 text-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#e07a5f]/50"
								required
							/>
						</div>

						<Button
							type="submit"
							className="w-full bg-[#c1644d] hover:bg-[#b15a44] dark:bg-[#e07a5f] dark:hover:bg-[#d0694e] text-white font-semibold py-3 px-4 rounded-md transition duration-200"
							data-umami-event="start-local-game"
						>
							Start Game
						</Button>
					</form>
				</div>
			) : (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="w-full max-w-7xl relative z-10"
				>
					<div className="flex flex-col xl:flex-row gap-8 items-start justify-center">
						<div className="w-full xl:w-3/4 flex justify-center order-2 xl:order-1">
							<div className="w-full max-w-[80vh] aspect-square">
								<UltimateBoard
									game={game}
									globalBoard={globalBoard}
									currentBoard={currentBoard}
									onCellClick={handleCellClick}
								/>
							</div>
						</div>
						<div className="w-full lg:w-1/4 lg:fixed lg:right-4 lg:top-1/2 lg:transform lg:-translate-y-1/2 order-1 lg:order-2">
							<Scoreboard
								localGame={true}
								players={players}
								scores={scores}
								currentTurn={players[currentPlayerIndex]?.id || "X"}
								onPlayAgain={handlePlayAgain}
								ended={isGameOverDialogOpen}
							/>
						</div>
					</div>
				</motion.div>
			)}
			<ContinueGameDialog
				isOpen={isContinueDialogOpen}
				onClose={() => setIsContinueDialogOpen(false)}
				onContinue={handleContinueGame}
				onNewGame={handleNewGame}
			/>
			<WinnerAnimation
				isVisible={showAnimation}
				winner={winner && winner !== "tie" ? winner.name : ""}
				onAnimationComplete={() => console.log("Animation completed")}
			/>
		</div>
	);
}
