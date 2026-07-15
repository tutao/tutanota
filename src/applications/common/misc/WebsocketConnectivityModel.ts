import stream from "mithril/stream"
import { identity } from "@tutao/utils"
import { ExposedEventBus } from "../api/worker/workerInterfaces.js"
import { CloseEventBusOption, WsConnectionState } from "../../../platform-kit/network/Constants"
import { WebsocketConnectivityListener } from "../../../platform-kit/network/WebsocketConnectivityListener"
import { WebsocketLeaderStatus } from "@tutao/entities/sys"

const TAG = "[WebsocketConnectivityModel]"

export type LeaderStatusListener = (newLeaderStatus: boolean) => Promise<void>

export type ConnectionStateListener = (connectionState: WsConnectionState) => Promise<void>
/**
 * A model that observes the websocket and leader status state for the main thread.
 * Whenever the state changes the model propagates the new state to its listeners.
 * The actual source of the state is the EventBusClient that runs in the worker thread.
 * */
export class WebsocketConnectivityModel implements WebsocketConnectivityListener {
	private readonly wsState = stream<WsConnectionState>(WsConnectionState.terminated)
	private leaderStatus: boolean = false
	private leaderStatusListeners = new Set<LeaderStatusListener>()
	private connectionStateListeners = new Set<ConnectionStateListener>()

	constructor(private readonly eventBus: ExposedEventBus) {}

	async updateWebSocketState(wsConnectionState: WsConnectionState): Promise<void> {
		const previousWsState = this.wsState()
		this.wsState(wsConnectionState)
		if (previousWsState !== wsConnectionState) {
			await this.notifyConnectionStateListeners(wsConnectionState)
		}
	}

	private async notifyConnectionStateListeners(wsConnectionState: WsConnectionState) {
		for (const listener of this.connectionStateListeners) {
			await listener(wsConnectionState)
		}
	}

	/**
	 * Handles leader status state messages and propagates them to all registered listeners.
	 * Gets invoked by the worker thread whenever there is a new leader status message received by the EventBus.
	 * @param wsLeaderStatus
	 */
	async onLeaderStatusMessageReceived(wsLeaderStatus: WebsocketLeaderStatus): Promise<void> {
		if (wsLeaderStatus.leaderStatus !== this.leaderStatus) {
			this.leaderStatus = wsLeaderStatus.leaderStatus
			await this.notifyLeaderStatusListeners()
		}
	}

	private async notifyLeaderStatusListeners(): Promise<void> {
		for (const listener of this.leaderStatusListeners) {
			await listener(this.leaderStatus)
		}
	}

	isLeader(): boolean {
		return this.leaderStatus
	}

	async isConnected(): Promise<boolean> {
		return this.wsState() === WsConnectionState.connected
	}

	addConnectionStateListener(listener: ConnectionStateListener) {
		if (this.connectionStateListeners.has(listener)) {
			console.warn(TAG, "Adding the same listener twice!")
		} else {
			this.connectionStateListeners.add(listener)
		}
	}

	removeConnectionStateListener(listener: ConnectionStateListener) {
		const wasRemoved = this.connectionStateListeners.delete(listener)
		if (!wasRemoved) {
			console.warn(TAG, "Could not remove listener, possible leak?", listener)
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

	addLeaderStatusListener(listener: LeaderStatusListener) {
		if (this.leaderStatusListeners.has(listener)) {
			console.warn(TAG, "Adding the same listener twice!")
		} else {
			this.leaderStatusListeners.add(listener)
		}
	}
}
