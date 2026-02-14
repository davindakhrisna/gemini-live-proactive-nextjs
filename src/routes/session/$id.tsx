import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { liveKitStore, liveKitActions } from "@/stores/livekit-store";
import { connectLivekitClient, connectLivekitAgent } from "@/hooks/livekit/connectLivekit";
import { startScreenShare } from "@/hooks/livekit/startScreen";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/session/$id")({
	component: SessionPage,
	parseParams: (params) => ({ id: params.id }),
	stringifyParams: (params) => ({ id: params.id }),
});

function SessionPage() {
	const { id } = Route.useParams();

	const state = useStore(liveKitStore);

	async function handleConnect() {
		try {
			liveKitActions.connect(id);

			const connectedRoom = await connectLivekitClient(id);

			const agentResult = await connectLivekitAgent(id);

			connectedRoom.on("dataReceived", (payload) => {
				const msg = new TextDecoder().decode(payload);
				liveKitActions.addAiLog(msg);
			});

			liveKitActions.setRoom(connectedRoom);
			liveKitActions.setStatus("connected");
		} catch (err) {
			console.error(err);
			liveKitActions.setStatus("error");
		}
	}

	async function handleShareScreen() {
		if (!state.room) return;

		try {
			await startScreenShare(state.room);
			liveKitActions.setSharing(true);
		} catch (err) {
			console.error(err);
			liveKitActions.setSharing(false);
		}
	}

	async function handleDisconnect() {
		if (!state.room) return;

		state.room.disconnect();
		liveKitActions.reset();
	}

	useEffect(() => {
		return () => {
			state.room?.disconnect();
		};
	}, [state.room]);

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
							<Badge variant="outline">Status: {state.status.toUpperCase()}</Badge>

							{state.sharing && <Badge>SCREEN SHARING</Badge>}
						</div>

						<div className="flex gap-3 flex-wrap">
							<Button
								onClick={handleConnect}
								disabled={state.status === "connecting" || state.status === "connected"}
							>
								Connect
							</Button>

							<Button
								variant="secondary"
								onClick={handleShareScreen}
								disabled={!state.room || state.sharing}
							>
								Share Screen
							</Button>

							<Button
								variant="destructive"
								onClick={handleDisconnect}
								disabled={!state.room}
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
						{state.aiLog.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No messages yet. Start screen share and wait for the bot to
								judge you.
							</p>
						) : (
							<div className="space-y-2">
								{state.aiLog.slice(0, 10).map((msg, idx) => (
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