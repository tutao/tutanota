import { Message } from "./MessageDispatcher.js"
import { isMainThread, parentPort, Worker as NodeWorker } from "node:worker_threads"
import { Transport } from "./Transport.js"

/** transport impl for the node main thread */
export class NodeWorkerTransport<OutgoingCommandType, IncomingCommandType> implements Transport<OutgoingCommandType, IncomingCommandType> {
	/** typed for the main thread that creates the worker and for the thread itself that gets a parentPort instance */
	constructor(private readonly worker: NodeWorker | NonNullable<typeof parentPort>) {}

	postMessage(message: Message<OutgoingCommandType>): void {
		return this.worker.postMessage(message)
	}

	setMessageHandler(handler: (message: Message<IncomingCommandType>) => unknown) {
		this.worker.on("message", (ev: Message<IncomingCommandType>) => handler(ev))
	}
}
