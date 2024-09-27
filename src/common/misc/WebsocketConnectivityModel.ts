import { WsConnectionState } from "../api/main/WorkerClient.js"
import stream from "mithril/stream"
import { identity } from "@tutao/tutanota-utils"
import { CloseEventBusOption } from "../api/common/TutanotaConstants.js"
import { WebsocketLeaderStatus } from "../api/entities/sys/TypeRefs.js"
import { ExposedEventBus } from "../api/worker/workerInterfaces.js"

export interface WebsocketConnectivityListener {
	updateWebSocketState(wsConnectionState: WsConnectionState): Promise<void>
	onLeaderStatusChanged(leaderStatus: WebsocketLeaderStatus): Promise<void>
}

/** A web page thread view on websocket/event bus. */
export class WebsocketConnectivityModel implements WebsocketConnectivityListener {
	private readonly wsState = stream<WsConnectionState>(WsConnectionState.terminated)
	private leaderStatus: boolean = false

	constructor(private readonly eventBus: ExposedEventBus) {}

	async updateWebSocketState(wsConnectionState: WsConnectionState): Promise<void> {
		this.wsState(wsConnectionState)
	}

	async onLeaderStatusChanged(leaderStatus: WebsocketLeaderStatus): Promise<void> {
		this.leaderStatus = leaderStatus.leaderStatus
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
}
