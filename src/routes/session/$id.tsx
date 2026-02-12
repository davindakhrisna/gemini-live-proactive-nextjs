import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Room } from "livekit-client";
import { connectLiveKit } from "@/hooks/livekit/connectLivekit";
import { startScreenShare } from "@/hooks/livekit/startScreen";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/session/$id")({
	component: SessionPage,
});

function SessionPage() {
	const { id } = Route.useParams();

	const [room, setRoom] = useState<Room | null>(null);
	const [status, setStatus] = useState<
		"idle" | "connecting" | "connected" | "error"
	>("idle");

	const [sharing, setSharing] = useState(false);
	const [aiLog, setAiLog] = useState<string[]>([]);

	async function handleConnect() {
		try {
			setStatus("connecting");

			const connectedRoom = await connectLiveKit(id);

			connectedRoom.on("dataReceived", (payload) => {
				const msg = new TextDecoder().decode(payload);
				setAiLog((prev) => [msg, ...prev]);
			});

			setRoom(connectedRoom);
			setStatus("connected");
		} catch (err) {
			console.error(err);
			setStatus("error");
		}
	}

	async function handleShareScreen() {
		if (!room) return;

		try {
			await startScreenShare(room);
			setSharing(true);
		} catch (err) {
			console.error(err);
			setSharing(false);
		}
	}

	async function handleDisconnect() {
		if (!room) return;

		room.disconnect();
		setRoom(null);
		setSharing(false);
		setStatus("idle");
	}

	useEffect(() => {
		return () => {
			room?.disconnect();
		};
	}, [room]);

	return (
		<div className="min-h-screen p-6 flex items-start justify-center bg-background">
			<div className="w-full max-w-3xl space-y-6">
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="text-xl font-semibold">
							Session: {id}
						</CardTitle>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="flex items-center gap-2">
							<Badge variant="outline">Status: {status.toUpperCase()}</Badge>

							{sharing && <Badge>SCREEN SHARING</Badge>}
						</div>

						<div className="flex gap-3 flex-wrap">
							<Button
								onClick={handleConnect}
								disabled={status === "connecting" || status === "connected"}
							>
								Connect
							</Button>

							<Button
								variant="secondary"
								onClick={handleShareScreen}
								disabled={!room || sharing}
							>
								Share Screen
							</Button>

							<Button
								variant="destructive"
								onClick={handleDisconnect}
								disabled={!room}
							>
								Disconnect
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="text-lg">AI Feedback</CardTitle>
					</CardHeader>

					<CardContent className="space-y-2">
						{aiLog.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No messages yet. Start screen share and wait for the bot to
								judge you.
							</p>
						) : (
							<div className="space-y-2">
								{aiLog.slice(0, 10).map((msg, idx) => (
									<div
										key={idx}
										className="p-3 border rounded-xl text-sm bg-muted/40"
									>
										{msg}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
