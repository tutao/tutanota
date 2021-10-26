//@flow
/**
 * Worker-Protocol:
 * <ul>
 *   <li>The client sends {WorkerRequest}s to the worker and the worker answers with either an {WorkerResponse} or a {WorkerError}.
 *   <li>The worker sends {ClientCommands}s to the client. The commands are executed by the client (without any response to the worker).
 * </ul>
 */
import {downcast} from "@tutao/tutanota-utils"
import {objToError} from "./utils/Utils"
import {isWorker} from "./Env"

type Command = (msg: Request) => Promise<any>

export class Request {
	type: WorkerRequestType | MainRequestType | NativeRequestType | JsRequestType;
	id: string;
	args: any[];

	constructor(type: WorkerRequestType | MainRequestType | NativeRequestType | JsRequestType, args: $ReadOnlyArray<mixed>) {
		this.type = type
		this.id = _createRequestId()
		this.args = Array.from(args)
	}
}

export class Response {
	type: 'response';
	id: string;
	value: any;

	constructor(request: Request, value: any) {
		this.type = 'response'
		this.id = request.id
		this.value = value
	}
}

export class RequestError {
	type: 'requestError';
	id: string;
	error: Object;

	constructor(request: Request, error: Error) {
		this.type = 'requestError'
		this.id = request.id
		this.error = errorToObj(error) // the structured clone algorithm is not able to clone errors
	}
}

type QueuedMessageCallbacks = {resolve: (any) => void, reject: (any) => void}

/**
 * Queue for the remote invocations (e.g. worker or native calls).
 */
export class Queue {
	/**
	 * Map from request id that have been sent to the callback that will be
	 * executed on the results sent by the worker.
	 */
	_queue: {[key: string]: QueuedMessageCallbacks};
	_commands: {[key: WorkerRequestType | MainRequestType | NativeRequestType | JsRequestType]: Command};
	_transport: Worker | DedicatedWorkerGlobalScope;

	constructor(transport: ?Worker | ?DedicatedWorkerGlobalScope) {
		this._queue = {}
		this._transport = (transport: any)

		if (this._transport != null) { // only undefined in case of node unit tests (is overridden from WorkerClient, in this case)
			this._transport.onmessage = (msg: any) => this._handleMessage(msg.data)
		}
	}

	postMessage(msg: Request): Promise<any> {
		return new Promise((resolve, reject) => {
			this._queue[msg.id] = {resolve, reject}
			try {
				this._transport.postMessage(msg)
			} catch (e) {
				console.log("error payload:", msg.id, msg.type)
				throw e
			}
		})
	}

	_handleMessage(message: Response | Request | RequestError) {
		if (message.type === 'response') {
			this._queue[message.id].resolve(message.value)
			delete this._queue[message.id]
		} else if (message.type === 'requestError') {
			this._queue[message.id].reject(objToError(downcast(message).error))
			delete this._queue[message.id]
		} else {
			let command = this._commands[message.type]
			let request = (message: any)
			if (command != null) {
				const commandResult = command(request)
				// Every method exposed via worker protocol must return a promise. Failure to do so is a violation of contract so we
				// try to catch it early and throw an error.
				if (commandResult == null || typeof commandResult.then !== "function") {
					throw new Error(`Handler returned non-promise result: ${message.type}`)
				}
				commandResult.then(value => {
					this._transport.postMessage(new Response(request, value))
				}).catch(e => {
					this._transport.postMessage(new RequestError(request, e))
				})
			} else {
				let error = new Error(`unexpected request: ${message.id}, ${message.type}`)
				if (isWorker()) {
					this._transport.postMessage(new RequestError(request, error))
				} else {
					throw error
				}
			}
		}
	}

	setCommands(commands: {[key: WorkerRequestType | MainRequestType | NativeRequestType | JsRequestType]: Command}) {
		this._commands = commands
	}
}

let requestId = 0

function _createRequestId() {
	if (requestId >= Number.MAX_SAFE_INTEGER) {
		requestId = 0
	}
	let prefix = ""
	if (isWorker()) {
		prefix = "worker"
	} else {
		prefix = "main"
	}
	return prefix + requestId++
}

// Serialize error stack traces, when they are sent via the websocket.
export function errorToObj(error: Error): {|data: any, message: any, name: any, stack: any|} {
	return {
		name: (error: any)['name'],
		message: (error: any)['message'],
		stack: (error: any)['stack'],
		data: (error: any)['data']
	}
}

