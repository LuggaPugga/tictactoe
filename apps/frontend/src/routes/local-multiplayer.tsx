import { makePersisted } from "@solid-primitives/storage";
import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, onCleanup, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { ContinueGameDialog } from "@/components/game/continue-game-dialog";
import { Scoreboard } from "@/components/game/scoreboard";
import UltimateBoard from "@/components/game/ultimate-board";
import { WinnerAnimation } from "@/components/game/winning-animation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWinnerAnimation } from "@/hooks/use-winner-animation";
import { checkWinner } from "@/lib/game-utils";
import type { CellValue, Game, LocalBoard, Player, Score } from "@/lib/types";

export const Route = createFileRoute("/local-multiplayer")({
	component: LocalMultiplayer,
	head: () => ({
		meta: [
			{ title: "Local Multiplayer — Ultimate Tic Tac Toe" },
			{
				name: "description",
				content:
					"Play Ultimate Tic Tac Toe with a friend on one device. Track wins, ties, and enjoy quick rematches.",
			},
		],
	}),
});

interface GameState {
	players: Player[];
	currentTurn: string | null;
	game: Game;
	globalBoard: LocalBoard;
	currentBoard: number | null;
	scores: Record<string, Score>;
	winner: string | null;
	status: "waiting" | "playing" | "over";
}

const createInitialGame = (): Game =>
	Array.from({ length: 9 }, () => Array(9).fill(null));

const createInitialState = (): GameState => ({
	players: [],
	currentTurn: null,
	game: createInitialGame(),
	globalBoard: Array(9).fill(null),
	currentBoard: null,
	scores: {},
	winner: null,
	status: "waiting",
});

function LocalMultiplayer() {
	const [state, setState] = createSignal<GameState>(createInitialState());
	const [showContinueDialog, setShowContinueDialog] = createSignal(false);
	const { showAnimation, triggerAnimation, cleanup } = useWinnerAnimation();

	const [playerName, setPlayerName] = makePersisted(createSignal(""), {
		name: "playerName",
	});

	const [savedGame, setSavedGame] = makePersisted(
		createSignal<GameState | null>(null),
		{
			name: "ticTacToeGame",
			storage:
				typeof sessionStorage !== "undefined" ? sessionStorage : undefined,
		},
	);

	const saved = savedGame();
	if (saved && state().status === "waiting") {
		setState(saved);
		setShowContinueDialog(true);
	}

	onCleanup(cleanup);

	const handleStartGame = (e: Event) => {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const p1 = formData.get("player1") as string;
		const p2 = formData.get("player2") as string;

		if (!p1 || !p2) return;

		setPlayerName(p1);
		setState({
			players: [
				{ id: "X", name: p1, sessionCode: "player1", connected: true },
				{ id: "O", name: p2, sessionCode: "player2", connected: true },
			],
			currentTurn: "player1",
			game: createInitialGame(),
			globalBoard: Array(9).fill(null),
			currentBoard: null,
			scores: {
				player1: { wins: 0, losses: 0, ties: 0 },
				player2: { wins: 0, losses: 0, ties: 0 },
			},
			winner: null,
			status: "playing",
		});
	};

	const handleCellClick = (boardIndex: number, cellIndex: number) => {
		const current = state();
		if (current.status !== "playing" || current.winner) return;

		const board = current.game[boardIndex];
		if (!board || board[cellIndex] !== null) return;

		const isValidBoard =
			current.currentBoard === null ||
			current.currentBoard === boardIndex ||
			current.game[current.currentBoard]?.every((c) => c !== null);
		if (!isValidBoard) return;

		const currentPlayer = current.players.find(
			(p) => p.sessionCode === current.currentTurn,
		);
		if (!currentPlayer) return;

		const newGame: Game = current.game.map((b, i) =>
			i === boardIndex
				? b.map((c, j) =>
						j === cellIndex ? (currentPlayer.id as CellValue) : c,
					)
				: b,
		);

		const newGlobalBoard: LocalBoard = [...current.globalBoard];
		const updatedBoard = newGame[boardIndex];
		if (!updatedBoard) return;
		const localWinner = checkWinner(updatedBoard);
		if (localWinner && localWinner !== "tie") {
			newGlobalBoard[boardIndex] = localWinner;
		}

		const nextBoard = newGame[cellIndex];
		const isBoardUnavailable =
			nextBoard?.every((c) => c !== null) || newGlobalBoard[cellIndex] !== null;
		const newCurrentBoard = isBoardUnavailable ? null : cellIndex;

		const globalWinner = checkWinner(newGlobalBoard);
		const otherPlayer =
			current.currentTurn === "player1" ? "player2" : "player1";

		if (globalWinner) {
			const newScores = { ...current.scores };
			const p1Score = newScores.player1 ?? { wins: 0, losses: 0, ties: 0 };
			const p2Score = newScores.player2 ?? { wins: 0, losses: 0, ties: 0 };

			if (globalWinner === "tie") {
				newScores.player1 = { ...p1Score, ties: p1Score.ties + 1 };
				newScores.player2 = { ...p2Score, ties: p2Score.ties + 1 };
			} else {
				const winnerCode = currentPlayer.sessionCode;
				const winnerScore = newScores[winnerCode] ?? {
					wins: 0,
					losses: 0,
					ties: 0,
				};
				const loserScore = newScores[otherPlayer] ?? {
					wins: 0,
					losses: 0,
					ties: 0,
				};
				newScores[winnerCode] = { ...winnerScore, wins: winnerScore.wins + 1 };
				newScores[otherPlayer] = {
					...loserScore,
					losses: loserScore.losses + 1,
				};
			}

			const newState: GameState = {
				...current,
				game: newGame,
				globalBoard: newGlobalBoard,
				currentBoard: newCurrentBoard,
				scores: newScores,
				winner: globalWinner === "tie" ? null : currentPlayer.sessionCode,
				status: "over",
			};
			setState(newState);
			setSavedGame(newState);
			triggerAnimation();
		} else {
			const newState: GameState = {
				...current,
				game: newGame,
				globalBoard: newGlobalBoard,
				currentBoard: newCurrentBoard,
				currentTurn: otherPlayer,
			};
			setState(newState);
			setSavedGame(newState);
		}
	};

	const handlePlayAgain = () => {
		setState((prev) => ({
			...prev,
			game: createInitialGame(),
			globalBoard: Array(9).fill(null),
			currentBoard: null,
			winner: null,
			status: "playing",
			currentTurn: "player1",
		}));
	};

	const handleNewGame = () => {
		setSavedGame(null);
		setShowContinueDialog(false);
		setState(createInitialState());
	};

	const current = () => state();
	const winnerName = () =>
		current().winner
			? (current().players.find((p) => p.sessionCode === current().winner)
					?.name ?? "")
			: "";

	return (
		<div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
			<div class="absolute inset-0 opacity-5">
				<div class="absolute inset-0 bg-grid-slate-700/[0.1] bg-size-[40px_40px]" />
			</div>

			<Show
				when={current().status !== "waiting"}
				fallback={
					<Motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						class="rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8 relative z-10 border border-border/40"
					>
						<div class="text-center space-y-2">
							<h1 class="text-3xl font-bold text-[#c1644d] dark:text-[#e07a5f]">
								Local Multiplayer
							</h1>
							<p class="text-muted-foreground">
								Enter player names to start the game
							</p>
						</div>

						<form onSubmit={handleStartGame} class="space-y-6">
							<div class="space-y-2">
								<label for="player1" class="text-sm font-medium">
									Player 1 (X)
								</label>
								<Input
									id="player1"
									type="text"
									name="player1"
									placeholder="Enter name"
									value={playerName()}
									onInput={(e) => setPlayerName(e.currentTarget.value)}
									class="w-full rounded-md border-border/60 bg-input px-4 py-2 text-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#e07a5f]/50"
									required
								/>
							</div>

							<div class="space-y-2">
								<label for="player2" class="text-sm font-medium">
									Player 2 (O)
								</label>
								<Input
									id="player2"
									type="text"
									name="player2"
									placeholder="Enter name"
									class="w-full rounded-md border-border/60 bg-input px-4 py-2 text-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#e07a5f]/50"
									required
								/>
							</div>

							<Button
								type="submit"
								class="w-full bg-[#c1644d] hover:bg-[#b15a44] dark:bg-[#e07a5f] dark:hover:bg-[#d0694e] text-white font-semibold py-3 px-4 rounded-md transition duration-200"
							>
								Start Game
							</Button>
						</form>
					</Motion.div>
				}
			>
				<div class="w-full max-w-7xl relative z-10">
					<div class="flex flex-col xl:flex-row gap-8 items-start justify-center">
						<div class="w-full xl:w-3/4 flex justify-center order-2 xl:order-1">
							<div class="w-full max-w-[80vh] aspect-square">
								<UltimateBoard
									game={current().game}
									globalBoard={current().globalBoard}
									currentBoard={current().currentBoard}
									onCellClick={handleCellClick}
								/>
							</div>
						</div>
						<div class="w-full lg:w-1/4 lg:fixed lg:right-4 lg:top-1/2 lg:-translate-y-1/2 order-1 lg:order-2">
							<Scoreboard
								localGame={true}
								players={current().players}
								scores={current().scores}
								currentTurn={current().currentTurn}
								onPlayAgain={handlePlayAgain}
								ended={current().status === "over"}
							/>
						</div>
					</div>
				</div>
			</Show>

			<ContinueGameDialog
				isOpen={showContinueDialog()}
				onClose={() => setShowContinueDialog(false)}
				onContinue={() => setShowContinueDialog(false)}
				onNewGame={handleNewGame}
			/>

			<WinnerAnimation isVisible={showAnimation()} winner={winnerName()} />
		</div>
	);
}
