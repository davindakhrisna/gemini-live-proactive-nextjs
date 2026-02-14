import { Store } from '@tanstack/store'
import type { Room } from 'livekit-client'

export interface LiveKitState {
	room: Room | null
	status: 'idle' | 'connecting' | 'connected' | 'error'
	sharing: boolean
	aiLog: string[]
	sessionId: string | null
}

export const liveKitStore = new Store<LiveKitState>({
	room: null,
	status: 'idle',
	sharing: false,
	aiLog: [],
	sessionId: null,
})

// Store actions
export const liveKitActions = {
	setStatus: (status: LiveKitState['status']) =>
		liveKitStore.setState((state) => ({ ...state, status })),

	setRoom: (room: Room | null) =>
		liveKitStore.setState((state) => ({ ...state, room })),

	setSharing: (sharing: boolean) =>
		liveKitStore.setState((state) => ({ ...state, sharing })),

	addAiLog: (message: string) =>
		liveKitStore.setState((state) => ({
			...state,
			aiLog: [message, ...state.aiLog],
		})),

	clearAiLog: () =>
		liveKitStore.setState((state) => ({ ...state, aiLog: [] })),

	reset: () =>
		liveKitStore.setState(() => ({
			room: null,
			status: 'idle',
			sharing: false,
			aiLog: [],
			sessionId: null,
		})),

	connect: (sessionId: string) =>
		liveKitStore.setState((state) => ({
			...state,
			sessionId,
			status: 'connecting',
			aiLog: [], // Clear logs on new connection
		})),
}
