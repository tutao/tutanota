import { WsConnectionState } from "../api/main/WorkerClient.js"
import stream from "mithril/stream"
import { identity } from "@tutao/tutanota-utils"
import { CloseEventBusOption } from "../api/common/TutanotaConstants.js"
import { ExposedEventBus } from "../api/worker/WorkerImpl.js"
import {WebsocketLeaderStatus} from "../api/entities/sys/TypeRefs.js"

export interface WebsocketConnectivityListener {
	updateWebSocketState(wsConnectionState: WsConnectionState): Promise<void>
	updateLeaderStatus(leaderStatus: WebsocketLeaderStatus): Promise<void>
}

/** A web page thread view on websocket/event bus. */
export class WebsocketConnectivityModel implements WebsocketConnectivityListener {
	private readonly _wsConnection = stream<WsConnectionState>(WsConnectionState.terminated)
	private _leaderStatus: boolean = false

	constructor(private readonly eventBus: ExposedEventBus) {}

	async updateWebSocketState(wsConnectionState: WsConnectionState): Promise<void> {
		this._wsConnection(wsConnectionState)
	}

	async updateLeaderStatus(leaderStatus: WebsocketLeaderStatus): Promise<void> {
		this._leaderStatus = leaderStatus.leaderStatus
	}

	isLeader(): boolean {
		return this._leaderStatus
	}

	wsConnection(): stream<WsConnectionState> {
		return this._wsConnection.map(identity)
	}

	tryReconnect(closeIfOpen: boolean, enableAutomaticState: boolean, delay: number | null = null): Promise<void> {
		return this.eventBus.tryReconnect(closeIfOpen, enableAutomaticState, delay)
	}

	close(option: CloseEventBusOption) {
		return this.eventBus.close(option)
	}
}
