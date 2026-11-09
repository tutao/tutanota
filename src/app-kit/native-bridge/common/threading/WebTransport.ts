import { defer, downcast } from "../../../../platform-kit/utils"
import { Message, Transport } from "../../shared/MessageTypes"

/**
 * Queue transport for both WorkerClient and WorkerImpl
 */
export class WebWorkerTransport<OutgoingCommandType, IncomingCommandType> implements Transport<OutgoingCommandType, IncomingCommandType> {
	constructor(private readonly worker: Worker | DedicatedWorkerGlobalScope) {}

	// We have to wait for the worker to finish loading before we can send messages to it (specifically the setup message).
	// for this we send a "worker-ready" message from the worker to the main thread that gets awaited here
	async waitForReadyMessage(): Promise<this> {
		const waitUntilWorkerReadyMessage = defer<void>()
		this.worker.onmessage = (ev: any): void => {
			if (ev.data === "worker-ready") {
				waitUntilWorkerReadyMessage.resolve()
			}
		}
		await waitUntilWorkerReadyMessage.promise
		return this
	}

	postMessage(message: Message<OutgoingCommandType>): void {
		return this.worker.postMessage(message)
	}

	setMessageHandler(handler: (message: Message<IncomingCommandType>) => unknown) {
		this.worker.onmessage = (ev: any) => handler(downcast(ev.data))
	}
}
