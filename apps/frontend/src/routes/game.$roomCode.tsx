import { createFileRoute } from "@tanstack/solid-router";
import GameComponent from "@/components/game/game";

export const Route = createFileRoute("/game/$roomCode")({
	component: GamePage,
});

function GamePage() {
	const params = Route.useParams();
	return <GameComponent roomCode={params().roomCode} />;
}
