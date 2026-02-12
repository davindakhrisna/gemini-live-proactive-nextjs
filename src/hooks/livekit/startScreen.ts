import type { Room } from "livekit-client";

export async function startScreenShare(room: Room) {
	const stream = await navigator.mediaDevices.getDisplayMedia({
		video: true,
		audio: false,
	});

	await room.localParticipant.publishTrack(stream.getVideoTracks()[0]);

	return stream;
}
