/**
 * <ul>
 *   <li>The client sends {WorkerRequest}s to the worker and the worker answers with either an {WorkerResponse} or a {WorkerError}.
 *   <li>The worker sends {ClientCommands}s to the client. The commands are executed by the client (without any response to the worker).
 * </ul>
 */
import { isWorker } from "../../../platform-kits/app-env"
import { newPromise } from "../../../platform-kits/utils"
import type { Commands, Message, MessageCallbacks, Request, Transport } from "./MessageTypes.js"
import { RequestError, Response } from "./MessageTypes.js"

/**
 * Handles remote invocations (e.g. worker or native calls).
 */
export class MessageDispatcher<OutgoingRequestType extends string, IncomingRequestType extends string> {
	/**
	 * Map from request id that have been sent to the callback that will be
	 * executed on the results sent by the worker.
	 */
	private readonly _messages: Record<string, MessageCallbacks>
	private readonly nextId: () => string

	constructor(
		private readonly transport: Transport<OutgoingRequestType, IncomingRequestType>,
		private readonly commands: Commands<IncomingRequestType>,
		private idPrefix: string,
		private readonly objToError: (_: Record<string, any>) => Error,
	) {
		this._messages = {}
		this.nextId = makeRequestIdGenerator(idPrefix)
		this.transport.setMessageHandler((msg) => this.handleMessage(msg))
	}

	postRequest(msg: Request<OutgoingRequestType>): Promise<any> {
		msg.id = this.nextId()

		return newPromise((resolve, reject) => {
			this._messages[msg.id!] = {
				resolve,
				reject,
			}

			try {
				this.transport.postMessage(msg)
			} catch (e) {
				console.log("error payload:", msg)
				throw e
			}
		})
	}

	handleMessage(message: Message<IncomingRequestType>) {
		if (message.type === "response") {
			const pendingRequest = this._messages[message.id]
			if (pendingRequest != null) {
				pendingRequest.resolve(message.value)
				delete this._messages[message.id]
			} else {
				console.warn(`Unexpected response: ${message.id} (was the page reloaded?)`)
			}
		} else if (message.type === "requestError") {
			const pendingRequest = this._messages[message.id]
			if (pendingRequest != null) {
				pendingRequest.reject(this.objToError(message.error))
				delete this._messages[message.id]
			} else {
				console.warn(`Unexpected error response: ${message.id} (was the page reloaded?)`)
			}
		} else if (message.type === "request") {
			const command = this.commands[message.requestType]

			if (command != null) {
				const commandResult = command(message)

				// Every method exposed via worker protocol must return a promise. Failure to do so is a violation of contract so we
				// try to catch it early and throw an error.
				if (commandResult == null || typeof commandResult.then !== "function") {
					throw new Error(`Handler returned non-promise result: ${message.requestType}`)
				}

				commandResult.then(
					(value) => {
						this.transport.postMessage(new Response(message.id!, value))
					},
					(error) => {
						this.transport.postMessage(new RequestError(message.id!, error))
					},
				)
			} else {
				let error = new Error(`unexpected request: ${message.id}, ${message.requestType}`)

				if (isWorker()) {
					this.transport.postMessage(new RequestError(message.id!, error))
				} else {
					throw error
				}
			}
		} else {
			throw new Error(`Unexpected request type: ${JSON.stringify(message)}`)
		}
	}
}

export function makeRequestIdGenerator(prefix: string): () => string {
	let requestId = 0
	return () => {
		if (requestId >= Number.MAX_SAFE_INTEGER) {
			requestId = 0
		}
		return prefix + requestId++
	}
}
