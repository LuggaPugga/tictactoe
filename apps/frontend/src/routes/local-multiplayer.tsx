import { makePersisted } from "@solid-primitives/storage";
import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { ContinueGameDialog } from "@/components/game/continue-game-dialog";
import { Scoreboard } from "@/components/game/scoreboard";
import UltimateBoard from "@/components/game/ultimate-board";
import { WinnerAnimation } from "@/components/game/winning-animation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWinnerAnimation } from "@/hooks/use-winner-animation";
import { createLocalGameStore } from "@/lib/local-game-store";

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

function LocalMultiplayer() {
	const store = createLocalGameStore();
	const [showContinueDialog, setShowContinueDialog] = createSignal(false);
	const { showAnimation, triggerAnimation, cleanup } = useWinnerAnimation();

	const [playerName, setPlayerName] = makePersisted(createSignal(""), {
		name: "playerName",
	});

	onMount(() => {
		if (store.loadSavedGame()) {
			setShowContinueDialog(true);
		}
	});

	onCleanup(cleanup);

	const handleStartGame = (e: Event) => {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const p1 = formData.get("player1") as string;
		const p2 = formData.get("player2") as string;

		if (!p1 || !p2) return;

		setPlayerName(p1);
		store.startGame(p1, p2);
	};

	const handleCellClick = (boardIndex: number, cellIndex: number) => {
		if (store.makeMove(boardIndex, cellIndex)) {
			triggerAnimation();
		}
	};

	const handleNewGame = () => {
		store.reset();
		setShowContinueDialog(false);
	};

	return (
		<div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
			<div class="absolute inset-0 opacity-5">
				<div class="absolute inset-0 bg-grid-slate-700/[0.1] bg-size-[40px_40px]" />
			</div>

			<Show
				when={store.state.status !== "waiting"}
				fallback={
					<div class="w-full max-w-lg space-y-8 relative z-10">
						<div class="text-center space-y-4">
							<h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
								Local Multiplayer
							</h1>
							<p class="text-2xl font-serif text-muted-foreground">
								Play with a friend on one device
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
									class="h-11"
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
									class="h-11"
									required
								/>
							</div>

							<Button type="submit" class="w-full h-11 text-base">
								Start Game
							</Button>
						</form>
					</div>
				}
			>
				<div class="w-full max-w-7xl relative z-10">
					<div class="flex flex-col xl:flex-row gap-8 items-start justify-center">
						<div class="w-full xl:w-3/4 flex justify-center order-2 xl:order-1">
							<div class="w-full max-w-[80vh] aspect-square">
								<UltimateBoard
									game={store.state.game}
									globalBoard={store.state.globalBoard}
									currentBoard={store.state.currentBoard}
									onCellClick={handleCellClick}
								/>
							</div>
						</div>
						<div class="w-full lg:w-1/4 lg:fixed lg:right-4 lg:top-1/2 lg:-translate-y-1/2 order-1 lg:order-2">
							<Scoreboard
								localGame={true}
								players={store.state.players}
								scores={store.state.scores}
								currentTurn={store.state.currentTurn}
								onPlayAgain={store.playAgain}
								ended={store.state.status === "over"}
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

			<WinnerAnimation
				isVisible={showAnimation()}
				winner={store.getWinnerName()}
			/>
		</div>
	);
}
