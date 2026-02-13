import { screenJoinRoom } from "./livekit";

async function main() {
	const roomName = process.argv[2];

	if (!roomName) {
		throw new Error(
			"Missing room name. Usage: tsx agents/screen-bot/index.ts <room>",
		);
	}

	const room = await screenJoinRoom(roomName);

	room.on("trackPublished", async (pub, participant) => {
		console.log("[agent] trackPublished", {
			kind: pub.kind,
			source: pub.source,
			trackSid: pub.track?.sid,
			name: pub.track?.name,
			mimeType: pub.mimeType,
			from: participant.identity,
		});

		await pub.setSubscribed(true);
	});

	room.on("trackSubscribed", (track, pub, participant) => {
		console.log("[agent] trackSubscribed", {
			kind: track.kind,
			trackSid: pub.track?.sid,
			name: pub.track?.name,
			from: participant.identity,
		});
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
