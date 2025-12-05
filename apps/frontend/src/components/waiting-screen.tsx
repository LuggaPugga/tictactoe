import { CircleCheck, Copy, Loader, X } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { Button } from "@/components/ui/button";

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
		<div class="h-screen w-full flex flex-col items-center justify-center p-4 bg-background text-foreground">
			<div class="w-full max-w-lg space-y-8">
				<div class="text-center space-y-4">
					<h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
						Waiting for Opponent
					</h1>
					<p class="text-2xl font-serif text-muted-foreground">
						Share the code below to start playing
					</p>
				</div>

				<div class="space-y-6">
					<div class="space-y-3">
						<p class="text-sm font-medium text-muted-foreground text-center">
							Game Code
						</p>
						<button
							type="button"
							onClick={handleCopyGameCode}
							class="w-full flex items-center justify-center gap-3 bg-secondary/50 hover:bg-secondary rounded-lg p-4 transition-colors cursor-pointer group"
						>
							<span class="text-4xl font-mono font-bold tracking-widest text-primary">
								{props.gameCode}
							</span>
							<Show
								when={isCopied()}
								fallback={
									<Copy class="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
								}
							>
								<CircleCheck class="h-5 w-5 text-green-500" />
							</Show>
						</button>
						<p class="text-xs text-muted-foreground text-center">
							Click to copy
						</p>
					</div>

					<div class="flex items-center justify-center gap-2 text-muted-foreground">
						<Loader class="h-4 w-4 animate-spin" />
						<span class="text-sm">Waiting for opponent to join</span>
						<span class="dots-animation" />
					</div>

					<Button
						onClick={props.onCancel}
						variant="outline"
						class="w-full h-11 text-base"
					>
						<X class="mr-2 h-4 w-4" />
						Cancel Game
					</Button>
				</div>
			</div>
		</div>
	);
}
