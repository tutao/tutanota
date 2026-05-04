import { WsConnectionState } from "./Constants.js"
import { WebsocketLeaderStatus } from "@tutao/entities/sys"

export interface WebsocketConnectivityListener {
	updateWebSocketState(wsConnectionState: WsConnectionState): Promise<void>
	onLeaderStatusMessageReceived(leaderStatus: WebsocketLeaderStatus): Promise<void>
}
