import { ConnectMode } from "./Constants"
import { CloseEventBusOption } from "@tutao/app-env"

export interface EventBusClientInterface {
	/**
	 * Opens a WebSocket connection to receive server events.
	 * @param connectMode
	 */
	connect(connectMode: ConnectMode): Promise<void>

	/**
	 * Sends a close event to the server and finally closes the connection.
	 * The state of this event bus client is reset and the client is terminated (does not automatically reconnect) except reconnect == true
	 */
	close(closeOption: CloseEventBusOption): void
}
