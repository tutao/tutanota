import stream from "mithril/stream"
import { identity } from "@tutao/utils"
import { ExposedEventBus } from "../api/worker/workerInterfaces.js"
import { CloseEventBusOption, WsConnectionState } from "../../../platform-kit/network/Constants"
import { WebsocketConnectivityListener } from "../../../platform-kit/network/WebsocketConnectivityListener"
import { WebsocketLeaderStatus } from "@tutao/entities/sys"
import { ListenerPriority } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

const TAG = "[WebsocketConnectivityModel]"

export type LeaderStatusListener = {
	id: string
	priority: ListenerPriority
	onLeaderStatusChanged: (newLeaderStatus: boolean) => Promise<void>
}

export type ConnectionStateListener = {
	id: string
	priority: ListenerPriority
	onConnectionStateChanged: (connectionState: WsConnectionState) => Promise<void>
}

/**
 * A model that observes the websocket and leader status state for the main thread.
 * Whenever the state changes the model propagates the new state to its listeners.
 * The actual source of the state is the EventBusClient that runs in the worker thread.
 * */
export class WebsocketConnectivityModel implements WebsocketConnectivityListener {
	private readonly wsState = stream<WsConnectionState>(WsConnectionState.terminated)
	private leaderStatus: boolean = false

	private leaderStatusListeners = new Map<string, LeaderStatusListener>()
	private connectionStateListeners = new Map<string, ConnectionStateListener>()

	constructor(private readonly eventBus: ExposedEventBus) {}

	isLeader(): boolean {
		return this.leaderStatus
	}

	/**
	 * Handles leader status state messages and propagates them to all registered listeners.
	 * Gets invoked by the worker thread whenever there is a new leader status message received by the EventBus.
	 * @param wsLeaderStatus
	 */
	async onLeaderStatusMessageReceived(wsLeaderStatus: WebsocketLeaderStatus): Promise<void> {
		if (wsLeaderStatus.leaderStatus !== this.leaderStatus) {
			this.leaderStatus = wsLeaderStatus.leaderStatus

			const listenersByPriorities = Array.from(this.leaderStatusListeners.values()).sort(
				(listenerA, listenerB) => listenerB.priority.valueOf() - listenerA.priority.valueOf(),
			)
			for (const listener of listenersByPriorities) {
				await listener.onLeaderStatusChanged(this.leaderStatus)
			}
		}
	}

	async isConnected(): Promise<boolean> {
		return this.wsState() === WsConnectionState.connected
	}

	async updateWebSocketState(wsConnectionState: WsConnectionState): Promise<void> {
		const previousWsState = this.wsState()
		this.wsState(wsConnectionState)
		if (previousWsState !== wsConnectionState) {
			const listenersByPriorities = Array.from(this.connectionStateListeners.values()).sort(
				(listenerA, listenerB) => listenerB.priority.valueOf() - listenerA.priority.valueOf(),
			)
			for (const listener of listenersByPriorities) {
				listener.onConnectionStateChanged(wsConnectionState)
			}
		}
	}

	addLeaderStatusListener(listener: LeaderStatusListener) {
		if (this.leaderStatusListeners.has(listener.id)) {
			console.warn(TAG, `Adding leaderStatusListener with id ${listener.id} twice!`)
		} else {
			this.leaderStatusListeners.set(listener.id, listener)
		}
	}

	removeLeaderStatusListener(listener: LeaderStatusListener) {
		const wasRemoved = this.leaderStatusListeners.delete(listener.id)
		if (!wasRemoved) {
			console.warn(TAG, `Could not remove leaderStatusListener with id ${listener.id}, possible leak?`)
		}
	}

	addConnectionStateListener(listener: ConnectionStateListener) {
		if (this.connectionStateListeners.has(listener.id)) {
			console.warn(TAG, `Adding connectionStateListener with id ${listener.id} twice!`)
		} else {
			this.connectionStateListeners.set(listener.id, listener)
		}
	}

	removeConnectionStateListener(listener: ConnectionStateListener) {
		const wasRemoved = this.connectionStateListeners.delete(listener.id)
		if (!wasRemoved) {
			console.warn(TAG, `Could not remove connectionStateListener with id ${listener.id}, possible leak?`)
		}
	}

	wsConnection(): stream<WsConnectionState> {
		// .map() to make a defensive copy
		return this.wsState.map(identity)
	}

	tryReconnect(closeIfOpen: boolean, enableAutomaticState: boolean, delay: number | null = null): Promise<void> {
		return this.eventBus.tryReconnect(closeIfOpen, enableAutomaticState, delay)
	}

	close(option: CloseEventBusOption) {
		return this.eventBus.close(option)
	}
}
