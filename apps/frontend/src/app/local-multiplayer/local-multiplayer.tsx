"use client";

import { motion } from "framer-motion";
import type React from "react";
import { useCallback, useEffect, useReducer, useState } from "react";
import { ContinueGameDialog } from "@/components/game/continue-game-dialog";
import { Scoreboard } from "@/components/game/scoreboard";
import UltimateBoard from "@/components/game/ultimate-board";
import { WinnerAnimation } from "@/components/game/winning-animation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWinnerAnimation } from "@/hooks/useWinnerAnimation";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import { checkWinner } from "@/lib/game-utils";
import type { CellValue, Game, LocalBoard, Player, Score } from "@/lib/types";

export default function LocalMultiplayer() {
	const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
	const [player1Name, setPlayer1Name] = useState<string>("");
	const [isContinueDialogOpen, setIsContinueDialogOpen] = useState(false);
	const { showAnimation, triggerAnimation, cleanup } = useWinnerAnimation();

	useEffect(() => {
		const storedName = localStorage.getItem("name");
		if (storedName) {
			setPlayer1Name(storedName);
		}

		const savedGame = sessionStorage.getItem("ticTacToeGame");
		if (savedGame) {
			setIsContinueDialogOpen(true);
			const parsedGame = JSON.parse(savedGame);
			dispatch({
				type: "UPDATE_GAME",
				game: parsedGame.game,
				globalBoard: parsedGame.globalBoard,
				currentBoard: parsedGame.currentBoard,
				currentTurn: parsedGame.currentTurn,
				scores: parsedGame.scores,
				winner: parsedGame.winner,
			});
			dispatch({
				type: "UPDATE_PLAYERS",
				players: parsedGame.players,
			});
			dispatch({
				type: "SET_GAME_STATUS",
				status: parsedGame.winner ? "over" : "playing",
			});
		}
	}, []);

	const handleStartGame = useCallback((e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const player1Name = formData.get("player1") as string;
		const player2Name = formData.get("player2") as string;

		if (player1Name && player2Name) {
			const newPlayers: Player[] = [
				{ id: "X", name: player1Name, sessionCode: "player1", connected: true },
				{ id: "O", name: player2Name, sessionCode: "player2", connected: true },
			];
			const initialScores = {
				player1: { wins: 0, losses: 0, ties: 0 },
				player2: { wins: 0, losses: 0, ties: 0 },
			};
			dispatch({ type: "UPDATE_PLAYERS", players: newPlayers });
			dispatch({
				type: "GAME_START",
				players: newPlayers,
				currentTurn: "player1",
			});
			dispatch({
				type: "UPDATE_GAME",
				game: Array(9).fill(Array(9).fill(null)),
				globalBoard: Array(9).fill(null),
				currentBoard: null,
				currentTurn: "player1",
				scores: initialScores,
			});
			localStorage.setItem("name", player1Name);
		}
	}, []);

	const saveGameState = useCallback(() => {
		const stateToSave = {
			players: gameState.players,
			currentTurn: gameState.currentTurn,
			game: gameState.game,
			globalBoard: gameState.globalBoard,
			currentBoard: gameState.currentBoard,
			scores: gameState.scores,
			winner: gameState.winner,
		};
		sessionStorage.setItem("ticTacToeGame", JSON.stringify(stateToSave));
	}, [gameState]);

	const handleCellClick = useCallback(
		(boardIndex: number, cellIndex: number) => {
			const boardToCheck = gameState.game[boardIndex];
			if (!boardToCheck) return;

			const cellValue = boardToCheck[cellIndex];
			if (cellValue === undefined) return;

			if (gameState.gameStatus !== "playing" || gameState.winner) return;

			const currentPlayer = gameState.players.find(
				(p) => p.sessionCode === gameState.currentTurn,
			);
			if (!currentPlayer) return;

			if (
				cellValue === null &&
				(gameState.currentBoard === null ||
					gameState.currentBoard === boardIndex ||
					(gameState.currentBoard !== null &&
						gameState.game[gameState.currentBoard]?.every(
							(cell) => cell !== null,
						)))
			) {
				const newGame: Game = gameState.game.map((board, i) =>
					i === boardIndex
						? board.map((cell, j) =>
								j === cellIndex ? (currentPlayer.id as CellValue) : cell,
							)
						: board,
				);

				const boardToCheck = newGame[boardIndex];
				if (!boardToCheck) return;

				const localWinner = checkWinner(boardToCheck);
				const newGlobalBoard: LocalBoard = [...gameState.globalBoard];
				if (localWinner) {
					newGlobalBoard[boardIndex] =
						localWinner === "tie" ? null : localWinner;
				}

				const nextBoardCells = newGame[cellIndex];
				const isBoardFull =
					nextBoardCells?.every((cell) => cell !== null) || false;
				const isBoardWon = newGlobalBoard[cellIndex] !== null;
				const newCurrentBoard = isBoardFull || isBoardWon ? null : cellIndex;

				const globalWinner = checkWinner(newGlobalBoard);
				if (globalWinner) {
					const winnerSessionCode =
						globalWinner === "tie" ? null : currentPlayer.sessionCode;

					const newScores: Record<string, Score> = { ...gameState.scores };
					if (globalWinner === "tie") {
						if (newScores.player1) newScores.player1.ties++;
						if (newScores.player2) newScores.player2.ties++;
					} else {
						if (newScores[currentPlayer.sessionCode])
							newScores[currentPlayer.sessionCode].wins++;
						const otherPlayerCode =
							currentPlayer.sessionCode === "player1" ? "player2" : "player1";
						if (newScores[otherPlayerCode]) newScores[otherPlayerCode].losses++;
					}

					dispatch({
						type: "UPDATE_GAME",
						game: newGame,
						globalBoard: newGlobalBoard,
						currentBoard: newCurrentBoard,
						currentTurn: gameState.currentTurn,
						scores: newScores,
						winner: winnerSessionCode,
					});
					triggerAnimation();
				} else {
					const nextPlayerCode =
						currentPlayer.sessionCode === "player1" ? "player2" : "player1";

					dispatch({
						type: "UPDATE_GAME",
						game: newGame,
						globalBoard: newGlobalBoard,
						currentBoard: newCurrentBoard,
						currentTurn: nextPlayerCode,
						scores: gameState.scores,
					});
				}
			}
			saveGameState();
		},
		[gameState, saveGameState, triggerAnimation],
	);

	const handlePlayAgain = useCallback(() => {
		dispatch({ type: "RESET_GAME" });
		dispatch({
			type: "GAME_START",
			players: gameState.players,
			currentTurn: "player1",
		});
	}, [gameState.players]);

	const handleContinueGame = () => {
		setIsContinueDialogOpen(false);
	};

	const handleNewGame = () => {
		sessionStorage.removeItem("ticTacToeGame");
		setIsContinueDialogOpen(false);
		dispatch({ type: "RESET_GAME" });
		dispatch({ type: "SET_GAME_STATUS", status: "waiting" });
	};

	useEffect(() => {
		const handleBeforeUnload = () => {
			saveGameState();
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			cleanup();
		};
	}, [saveGameState, cleanup]);

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
			<div className="absolute inset-0 opacity-5">
				<div className="absolute inset-0 bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
			</div>
			{gameState.gameStatus === "waiting" ? (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8 relative z-10 border border-border/40"
				>
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
				</motion.div>
			) : (
				<div className="w-full max-w-7xl relative z-10">
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
								localGame={true}
								players={gameState.players}
								scores={gameState.scores}
								currentTurn={gameState.currentTurn}
								onPlayAgain={handlePlayAgain}
								ended={gameState.gameStatus === "over"}
							/>
						</div>
					</div>
				</div>
			)}
			<ContinueGameDialog
				isOpen={isContinueDialogOpen}
				onClose={() => setIsContinueDialogOpen(false)}
				onContinue={handleContinueGame}
				onNewGame={handleNewGame}
			/>
			<WinnerAnimation
				isVisible={showAnimation}
				winner={
					gameState.winner
						? gameState.players.find((p) => p.sessionCode === gameState.winner)
								?.name || ""
						: ""
				}
				onAnimationComplete={() => console.log("Animation completed")}
			/>
		</div>
	);
}
