import { use } from "react";
import GameComponent from "@/components/game/game";

export default function GamePage({
	params,
}: {
	params: Promise<{ roomCode: string }>;
}) {
	const { roomCode } = use(params);
	return <GameComponent roomCode={roomCode} />;
}
