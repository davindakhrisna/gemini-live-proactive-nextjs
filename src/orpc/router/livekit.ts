import { os } from "@orpc/server";
import { AccessToken } from "livekit-server-sdk";
import * as z from "zod";

export const livekitRouter = {
	getToken: os
		.input(z.object({ room: z.string() }))
		.handler(async ({ input }) => {
			const apiKey = process.env.LIVEKIT_API_KEY;
			const apiSecret = process.env.LIVEKIT_API_SECRET;

			if (!apiKey || !apiSecret) {
				throw new Error("Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET");
			}

			const token = new AccessToken(apiKey, apiSecret, {
				identity: `user-${crypto.randomUUID()}`,
			});

			token.addGrant({
				roomJoin: true,
				room: input.room,
				canPublish: true,
				canSubscribe: true,
			});

			return { token: await token.toJwt() };
		}),
};
