import { useNavigate } from "@tanstack/solid-router";
import { House, Loader, Wifi } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { toast } from "solid-sonner";
import { Button } from "@/components/ui/button";
import { createRoom } from "@/lib/ws-client";

export function RoomNotFound() {
	const [isLoading, setIsLoading] = createSignal(false);
	const navigate = useNavigate();

	const handleCreateRoom = async () => {
		setIsLoading(true);
		const roomCode = await createRoom();
		if (roomCode) {
			navigate({ to: `/game/${roomCode}` });
		} else {
			toast.error("Failed to create room");
		}
		setIsLoading(false);
	};

	return (
		<div class="h-screen w-full flex flex-col items-center justify-center p-4 bg-background text-foreground">
			<div class="w-full max-w-lg space-y-8">
				<div class="text-center space-y-4">
					<h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
						Room Not Found
					</h1>
					<p class="text-2xl font-serif text-muted-foreground">
						This room doesn't exist or has expired
					</p>
				</div>

				<div class="space-y-4">
					<Button
						onClick={() => navigate({ to: "/" })}
						class="w-full h-11 text-base"
					>
						<House class="mr-2 size-5" />
						Return to Home
					</Button>

					<Button
						onClick={handleCreateRoom}
						class="w-full h-11 text-base"
						variant="outline"
						disabled={isLoading()}
					>
						<Show
							when={isLoading()}
							fallback={
								<>
									<Wifi class="mr-2 size-5" />
									Create New Lobby
								</>
							}
						>
							<Loader class="size-5 animate-spin" />
						</Show>
					</Button>
				</div>

				<p class="text-center text-xs text-muted-foreground">
					Need help? Try refreshing or creating a new room.
				</p>
			</div>
		</div>
	);
}
