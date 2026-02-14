import { os } from "@orpc/server";
import { AccessToken } from "livekit-server-sdk";
import * as z from "zod";
import { connectGeminiSession } from "@/lib/gemini";
import { env } from "@/env";

export const livekitRouter = {
	getToken: os
		.input(z.object({ room: z.string(), identity: z.string(), addGrant: z.any() }))
		.handler(async ({ input }) => {
			const apiKey = env.LIVEKIT_API_KEY;
			const apiSecret = env.LIVEKIT_API_SECRET;

			if (!apiKey || !apiSecret) {
				throw new Error("Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET");
			}

			const token = new AccessToken(apiKey, apiSecret, {
				identity: input.identity,
			});

			token.addGrant(input.addGrant);

			return { token: await token.toJwt() };
		}),
};

export const agentRouter = {
  start: os
    .input(z.object({ token: z.string() }))
    .handler(async ({ input }) => {
      try {
        const url = env.VITE_LIVEKIT_URL;
        const token = input.token;

        console.log("[agent] Starting agent check URL:", url);
      
        if (!url || !token) throw new Error("Missing LiveKit URL or Token");
      
		const { Room, RoomEvent, TrackKind, TrackSource, VideoStream } = await import("@livekit/rtc-node");
        const room = new Room();

        console.log("[agent] connecting...");
        await room.connect(url, token);
        console.log("[agent] connected!");

		const local = room.localParticipant;
		const encoder = new TextEncoder();

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
      } catch (err) {
        console.error("[agent] FATAL ERROR:", err);
        throw err;
      }
	}),
};
