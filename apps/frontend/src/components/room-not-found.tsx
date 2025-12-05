import { useNavigate } from "@tanstack/solid-router";
import { House, Loader, Wifi } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
			alert("Failed to create room");
		}
		setIsLoading(false);
	};

	return (
		<div class="min-h-screen flex flex-col items-center justify-center p-4 relative text-foreground">
			<div class="absolute inset-0">
				<div class="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-size-[40px_40px]" />
				<div class="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-secondary/5" />
			</div>

			<div class="rounded-2xl max-w-md w-full space-y-8 relative z-10">
				<h2 class="text-3xl font-bold text-center text-primary">
					Room Not Found
				</h2>

				<Card class="border shadow-lg backdrop-blur-sm">
					<CardContent class="space-y-4 pt-4">
						<p class="text-lg mb-2 font-medium">Oops!</p>
						<p class="text-base text-muted-foreground mb-4">
							The room you're looking for doesn't exist or has expired.
						</p>

						<Button
							onClick={() => navigate({ to: "/" })}
							class="w-full h-12 text-base"
						>
							<House class="mr-2 size-5" />
							Return to Home
						</Button>

						<Button
							onClick={handleCreateRoom}
							class="w-full h-12 text-base"
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
					</CardContent>
				</Card>

				<p class="text-center text-sm text-muted-foreground mt-2">
					Need help? Try refreshing or creating a new room.
				</p>
			</div>
		</div>
	);
}
