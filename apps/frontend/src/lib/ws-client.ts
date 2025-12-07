import { treaty } from "@elysiajs/eden";
import type { App } from "../../../backend/index";

const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const client = treaty<App>(url);

export type WsSubscription = Awaited<
	ReturnType<(typeof client)["game"]["subscribe"]>
>;

export type QueueMessage =
	| { type: "connected"; sessionCode: string }
	| { type: "joinedQueue"; position: number }
	| { type: "queueUpdate"; position: number }
	| { type: "queueFull" }
	| { type: "alreadyInQueueOrGame" }
	| { type: "leftQueue" }
	| { type: "lobbyCreated"; roomCode: string; sessionCode: string };

export function connectWs(): WsSubscription {
	return client.game.subscribe();
}

export async function createRoom(): Promise<string | null> {
	const response = await client.api["create-room"].post().catch(() => null);
	return response?.data?.roomCode ?? null;
}
