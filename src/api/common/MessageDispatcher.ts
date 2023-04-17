/**
 * <ul>
 *   <li>The client sends {WorkerRequest}s to the worker and the worker answers with either an {WorkerResponse} or a {WorkerError}.
 *   <li>The worker sends {ClientCommands}s to the client. The commands are executed by the client (without any response to the worker).
 * </ul>
 */
import { downcast } from "@tutao/tutanota-utils"
import { objToError } from "./utils/Utils"
import { isWorker } from "./Env"

export type Command<T> = (msg: Request<T>) => Promise<any>
export type Commands<T extends string> = Record<T, Command<T>>
export type Message<Type> = Request<Type> | Response<Type> | RequestError<Type>

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

export class Request<T> {
	readonly type: "request"
	readonly requestType: T
	readonly id: string
	readonly args: any[]

	constructor(type: T, args: ReadonlyArray<unknown>, requestId: string | null = null) {
		this.type = "request"
		this.requestType = type
		this.id = requestId ?? _createRequestId()
		this.args = args.slice()
	}
}

export class Response<T> {
	readonly type: "response"
	readonly id: string
	readonly value: any

	constructor(id: string, value: any) {
		this.type = "response"
		this.id = id
		this.value = value
	}
}

export class RequestError<T> {
	readonly type: "requestError"
	readonly id: string
	readonly error: Record<string, any>

	constructor(id: string, error: Error) {
		this.type = "requestError"
		this.id = id
		this.error = errorToObj(error) // the structured clone algorithm is not able to clone errors
	}
}

type MessageCallbacks = {
	resolve: (value: any) => void
	reject: (error: Error) => void
}

/**
 * Handles remote invocations (e.g. worker or native calls).
 */
export class MessageDispatcher<OutgoingRequestType extends string, IncomingRequestType extends string> {
	/**
	 * Map from request id that have been sent to the callback that will be
	 * executed on the results sent by the worker.
	 */
	private readonly _messages: Record<string, MessageCallbacks>
	private readonly _commands: Commands<IncomingRequestType>
	readonly _transport: Transport<OutgoingRequestType, IncomingRequestType>

	constructor(transport: Transport<OutgoingRequestType, IncomingRequestType>, commands: Commands<IncomingRequestType>) {
		this._messages = {}
		this._commands = commands
		this._transport = transport
		this._transport.setMessageHandler((msg) => this.handleMessage(msg))
	}

	postRequest(msg: Request<OutgoingRequestType>): Promise<any> {
		return new Promise((resolve, reject) => {
			this._messages[msg.id] = {
				resolve,
				reject,
			}

			try {
				this._transport.postMessage(msg)
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
				pendingRequest.reject(objToError(message.error))
				delete this._messages[message.id]
			} else {
				console.warn(`Unexpected error response: ${message.id} (was the page reloaded?)`)
			}
		} else if (message.type === "request") {
			const command = this._commands[message.requestType]

			if (command != null) {
				const commandResult = command(message)

				// Every method exposed via worker protocol must return a promise. Failure to do so is a violation of contract so we
				// try to catch it early and throw an error.
				if (commandResult == null || typeof commandResult.then !== "function") {
					throw new Error(`Handler returned non-promise result: ${message.requestType}`)
				}

				commandResult.then(
					(value) => {
						this._transport.postMessage(new Response(message.id, value))
					},
					(error) => {
						this._transport.postMessage(new RequestError(message.id, error))
					},
				)
			} else {
				let error = new Error(`unexpected request: ${message.id}, ${message.requestType}`)

				if (isWorker()) {
					this._transport.postMessage(new RequestError(message.id, error))
				} else {
					throw error
				}
			}
		} else {
			throw new Error(`Unexpected request type: ${JSON.stringify(message)}`)
		}
	}
}

let requestId = 0

function _createRequestId() {
	if (requestId >= Number.MAX_SAFE_INTEGER) {
		requestId = 0
	}

	let prefix: string

	if (isWorker()) {
		prefix = "worker"
	} else if (typeof window != "undefined") {
		prefix = "main"
	} else {
		prefix = "desktop"
	}

	return prefix + requestId++
}

// Serialize error stack traces, when they are sent via the websocket.
export function errorToObj(error: Error): {
	data: any
	message: any
	name: any
	stack: any
} {
	const errorErased = error as any
	return {
		name: errorErased.name,
		message: errorErased.message,
		stack: errorErased.stack,
		data: errorErased.data,
	}
}
