import type { Message } from "./MessageTypes.js"

export interface Transport<OutgoingCommandType, IncomingCommandType> {
	/**
	 * Post a message to the other side of the transport
	 */
	postMessage(message: Message<OutgoingCommandType>): void

	/**
	 * Set the handler for messages coming from the other end of the transport
	 */
	setMessageHandler(handler: (message: Message<IncomingCommandType>) => unknown): unknown
}
