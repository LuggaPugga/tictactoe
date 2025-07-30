export async function createRoom(): Promise<string | null> {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/create-room`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
		const data = await response.json();
		if (data.roomCode) {
			return data.roomCode;
		} else {
			console.error("Failed to create room:", data.error);
			return null;
		}
	} catch (error) {
		console.error("Failed to create room:", error);
		return null;
	}
}
