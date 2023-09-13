import { Message } from "./MessageDispatcher.js"
import { downcast } from "@tutao/tutanota-utils"

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

/**
 * Queue transport for both WorkerClient and WorkerImpl
 */
export class WebWorkerTransport<OutgoingCommandType, IncomingCommandType> implements Transport<OutgoingCommandType, IncomingCommandType> {
	constructor(private readonly worker: Worker | DedicatedWorkerGlobalScope) {}

	postMessage(message: Message<OutgoingCommandType>): void {
		return downcast(this.worker).postMessage(message)
	}

	setMessageHandler(handler: (message: Message<IncomingCommandType>) => unknown) {
		this.worker.onmessage = (ev: any) => handler(downcast(ev.data))
	}
}

type NodeWorkerPort<O, I> = {
	postMessage: (msg: Message<O>) => void
	on: (channel: "message", listener: (ev: Message<I>) => unknown) => unknown
}

export class NodeWorkerTransport<OutgoingCommandType, IncomingCommandType> implements Transport<OutgoingCommandType, IncomingCommandType> {
	constructor(private readonly worker: NodeWorkerPort<OutgoingCommandType, IncomingCommandType>) {}

	postMessage(message: Message<OutgoingCommandType>): void {
		return this.worker.postMessage(message)
	}

	setMessageHandler(handler: (message: Message<IncomingCommandType>) => unknown) {
		this.worker.on("message", (ev: Message<IncomingCommandType>) => handler(ev))
	}
}
