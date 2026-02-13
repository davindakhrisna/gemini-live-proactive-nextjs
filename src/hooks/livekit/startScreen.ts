import { Track, type Room, type LocalTrackPublication } from "livekit-client";

export async function startScreenShare(
	room: Room,
): Promise<LocalTrackPublication> {
	const stream = await navigator.mediaDevices.getDisplayMedia({
		video: true,
		audio: false,
	});

	const screenTrack = stream.getVideoTracks()[0];

	const publication = await room.localParticipant.publishTrack(screenTrack, {
		source: Track.Source.ScreenShare,
		simulcast: false,
	});

	console.log("[client] screenshare published", publication.trackSid);

	console.log(
		"[client] local tracks",
		Array.from(room.localParticipant.trackPublications.values()).map((p) => ({
			sid: p.trackSid,
			source: p.source,
			kind: p.kind,
		})),
	);

	return publication;
}
