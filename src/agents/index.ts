import {
	VideoStream,
	Room,
	RoomEvent,
	TrackKind,
	TrackSource,
} from "@livekit/rtc-node";

import { connectGeminiSession } from "./gemini";
import { agentJoinRoom } from "./livekit";
import { env } from "./env";

export default async function main() {
	const url = env.VITE_LIVEKIT_URL;
	const token = await agentJoinRoom("10");

	if (!url || !token) throw new Error("Missing LiveKit URL or Token");

	const room = new Room();

	console.log("[agent] connecting...");
	await room.connect(url, token);
	console.log("[agent] connected!");

	const local = room.localParticipant;
	const encoder = new TextEncoder();

	// Helper to send data messages back to the UI
	const sendFeedback = async (message: string) => {
		if (!local) return;
		await local.publishData(encoder.encode(message), {
			reliable: true,
			topic: "ai-feedback",
		});
	};

	await connectGeminiSession(async (text) => {
		console.log("[gemini]", text);
		await sendFeedback(text);
	});

	room.on(RoomEvent.TrackSubscribed, async (track, pub) => {
		console.log("[agent] subscribed:", pub.source, pub.kind);

		if (pub.kind !== TrackKind.KIND_VIDEO) return;
		if (pub.source !== TrackSource.SOURCE_SCREENSHARE) return;

		console.log("[agent] GOT SCREEN TRACK - Starting VideoStream");

		const videoStream = new VideoStream(track);

		(async () => {
			try {
				for await (const frameEvent of videoStream) {
					const { frame } = frameEvent;
					console.log("[agent] frame rx:", frame.width, "x", frame.height);
				}
			} catch (err) {
				console.error("[agent] video stream error:", err);
			}
		})();

		await sendFeedback("✅ Bot is watching your screen.");
	});
}
