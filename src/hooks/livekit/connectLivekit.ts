import type { RoomConnectOptions } from "livekit-client";
import { Room } from "livekit-client";
import { orpc } from "@/orpc/client";

export async function connectLivekitClient(roomName: string) {
	const addGrant = {
		roomJoin: true,
		room: roomName,
		canPublish: true,
		canSubscribe: true,
	}

	const { token } = await orpc.livekit.getToken.call({ room: roomName, identity: `user-${crypto.randomUUID()}`, addGrant: addGrant});

	const connectOpts: RoomConnectOptions = {
		autoSubscribe: true,
	};

	const room = new Room({
		adaptiveStream: true,
	});

	try {
		await room.connect(import.meta.env.VITE_LIVEKIT_URL, token, connectOpts);
		return room;
	} catch (error) {
		console.error("Failed to connect to LiveKit:", error);
		throw error;
	}
}

export async function connectLivekitAgent(roomName: string) {
	const addGrant = {
		roomJoin: true,
		room: roomName,
		canPublish: false,
		canSubscribe: true,
	};

	const { token } = await orpc.livekit.getToken.call({ room: roomName, identity: `agent-${crypto.randomUUID()}`, addGrant: addGrant});

	const agentResult = await orpc.agent.start.call({ token });
	
	return agentResult;
}