"use client";

import { io, type Socket } from "socket.io-client";

let singletonSocket: Socket | null = null;

export function getSocket(): Socket {
	if (typeof window === "undefined") {
		throw new Error("getSocket must be called on the client");
	}
	if (singletonSocket) return singletonSocket;

	const url = process.env.NEXT_PUBLIC_BACKEND_URL;
	if (!url) {
		throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
	}

	singletonSocket = io(url, {
		transports: ["websocket", "polling"],
		autoConnect: true,
		withCredentials: true,
		timeout: 20000,
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionAttempts: 5,
	});

	singletonSocket.on("connect", () => {
		console.log("Socket connected:", singletonSocket?.id);
	});

	singletonSocket.on("disconnect", (reason) => {
		console.log("Socket disconnected:", reason);
	});

	return singletonSocket;
}

export function disconnectSocket(): void {
	if (singletonSocket) {
		singletonSocket.disconnect();
		singletonSocket = null;
	}
}
