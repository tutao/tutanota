import { downcast } from "@tutao/utils"
import { Message, Transport } from "@tutao/native-bridge/shared"

/**
 * Queue transport for both WorkerClient and WorkerImpl
 */
export class WebWorkerTransport<OutgoingCommandType, IncomingCommandType> implements Transport<OutgoingCommandType, IncomingCommandType> {
	constructor(private readonly worker: Worker | DedicatedWorkerGlobalScope) {}

	postMessage(message: Message<OutgoingCommandType>): void {
		return this.worker.postMessage(message)
	}

	setMessageHandler(handler: (message: Message<IncomingCommandType>) => unknown) {
		this.worker.onmessage = (ev: any) => handler(downcast(ev.data))
	}
}
