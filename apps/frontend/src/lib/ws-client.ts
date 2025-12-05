import { treaty } from "@elysiajs/eden";
import type { App } from "../../../backend/index";

const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const client = treaty<App>(url);

export type WsSubscription = Awaited<
	ReturnType<(typeof client)["game"]["subscribe"]>
>;

export async function connectWs(): Promise<WsSubscription> {
	return client.game.subscribe();
}

export async function createRoom(): Promise<string | null> {
	try {
		const response = await client.api["create-room"].post();
		return response?.data?.roomCode ?? null;
	} catch {
		return null;
	}
}
