import { CircleCheck, Copy } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WaitingRoomProps {
	gameCode: string;
	onCancel: () => void;
}

export function WaitingRoom(props: WaitingRoomProps) {
	const [isCopied, setIsCopied] = createSignal(false);

	const handleCopyGameCode = () => {
		navigator.clipboard.writeText(props.gameCode).then(() => {
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		});
	};

	return (
		<div class="min-h-screen flex flex-col items-center justify-center p-4 relative">
			<div class="absolute inset-0">
				<div class="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-size-[40px_40px]" />
				<div class="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-secondary/5" />
			</div>

			<div class="rounded-2xl max-w-md w-full space-y-8 relative z-10">
				<h2 class="text-3xl font-bold text-center text-primary">
					Waiting for opponent
					<span class="dots-animation" />
				</h2>

				<Card class="border shadow-lg backdrop-blur-sm">
					<CardContent class="space-y-4 pt-4">
						<p class="text-lg mb-2 font-medium">Game Code:</p>
						<div class="flex items-center justify-between bg-background rounded-lg p-3 mb-4 border-2 border-primary/30 shadow-sm hover:border-primary/50 transition-colors">
							<p class="text-3xl font-mono font-bold text-primary">
								{props.gameCode}
							</p>
							<Button
								onClick={handleCopyGameCode}
								variant="ghost"
								size="icon"
								class="hover:bg-[#c1644d]/10 dark:hover:bg-[#e07a5f]/10"
							>
								<Show
									when={isCopied()}
									fallback={<Copy class="h-5 w-5 text-muted-foreground" />}
								>
									<CircleCheck class="h-5 w-5 text-green-500" />
								</Show>
							</Button>
						</div>
						<p class="text-base text-muted-foreground mb-4">
							Share this code with your opponent to start the game
						</p>

						<Button
							onClick={props.onCancel}
							variant="outline"
							class="w-full h-12 text-base"
						>
							Cancel Game
						</Button>
					</CardContent>
				</Card>

				<p class="text-center text-sm text-muted-foreground mt-2">
					Your opponent will join soon. Get ready to play!
				</p>
			</div>
		</div>
	);
}
