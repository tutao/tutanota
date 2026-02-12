import { WsConnectionState } from "../api/main/WorkerClient.js"
import stream from "mithril/stream"
import { identity } from "@tutao/tutanota-utils"
import { CloseEventBusOption } from "../api/common/TutanotaConstants.js"
import { WebsocketLeaderStatus } from "../api/entities/sys/TypeRefs.js"
import { ExposedEventBus } from "../api/worker/workerInterfaces.js"

export interface WebsocketConnectivityListener {
	updateWebSocketState(wsConnectionState: WsConnectionState): Promise<void>
	onLeaderStatusMessageReceived(leaderStatus: WebsocketLeaderStatus): Promise<void>
}

const TAG = "[WebsocketConnectivityModel]"

export type LeaderStatusListener = (newLeaderStatus: boolean) => Promise<void>
/**
 * A model that observes the websocket and leader status state for the main thread.
 * Whenever the state changes the model propagates the new state to its listeners.
 * The actual source of the state is the EventBusClient that runs in the worker thread.
 * */
export class WebsocketConnectivityModel implements WebsocketConnectivityListener {
	private readonly wsState = stream<WsConnectionState>(WsConnectionState.terminated)
	private leaderStatus: boolean = false
	private leaderStatusListeners = new Set<LeaderStatusListener>()

	constructor(private readonly eventBus: ExposedEventBus) {}

	async updateWebSocketState(wsConnectionState: WsConnectionState): Promise<void> {
		this.wsState(wsConnectionState)
	}

	/**
	 * Handles leader status state messages and propagates them to all registered listeners.
	 * Gets invoked by the worker thread whenever there is a new leader status message received by the EventBus.
	 * @param wsLeaderStatus
	 */
	async onLeaderStatusMessageReceived(wsLeaderStatus: WebsocketLeaderStatus): Promise<void> {
		if (wsLeaderStatus.leaderStatus !== this.leaderStatus) {
			this.leaderStatus = wsLeaderStatus.leaderStatus
			await this.notifyListeners()
		}
	}

	private async notifyListeners(): Promise<void> {
		for (const listener of this.leaderStatusListeners) {
			await listener(this.leaderStatus)
		}
	}

	isLeader(): boolean {
		return this.leaderStatus
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
