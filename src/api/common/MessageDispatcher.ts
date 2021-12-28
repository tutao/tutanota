/**
 * <ul>
 *   <li>The client sends {WorkerRequest}s to the worker and the worker answers with either an {WorkerResponse} or a {WorkerError}.
 *   <li>The worker sends {ClientCommands}s to the client. The commands are executed by the client (without any response to the worker).
 * </ul>
 */
import {downcast} from "@tutao/tutanota-utils"
import {objToError} from "./utils/Utils"
import {isWorker} from "./Env"
export type Command<T> = (msg: Request<T>) => Promise<any>
export type Commands<T extends string> = Record<T, Command<T>>
export type Message<Type> = Request<Type> | Response<Type> | RequestError<Type>
export interface Transport<RequestCommandType, ResponseCommandType> {
    /**
     * Post a message to the other side of the transport
     */
    postMessage(message: Message<RequestCommandType>): void

    /**
     * Set the handler for messages coming from the other end of the transport
     */
    setMessageHandler(message: (arg0: Message<ResponseCommandType>) => unknown): unknown
}

/**
 * Queue transport for both WorkerClient and WorkerImpl
 */
export class WorkerTransport<RequestType, ResponseType> implements Transport<RequestType, ResponseType> {
    _worker: Worker | DedicatedWorkerGlobalScope

    constructor(worker: Worker | DedicatedWorkerGlobalScope) {
        this._worker = worker
    }

    postMessage(message: Message<RequestType>): void {
        return this._worker.postMessage(message)
    }

    setMessageHandler(handler: (arg0: Message<ResponseType>) => unknown) {
        this._worker.onmessage = (ev: MessageEvent) => handler(downcast(ev.data))
    }
}
export class Request<T> {
    type: "request"
    readonly requestType: T
    id: string
    args: any[]

    constructor(type: T, args: ReadonlyArray<unknown>, requestId: string | null = null) {
        this.type = "request"
        this.requestType = type
        this.id = requestId ?? _createRequestId()
        this.args = Array.from(args)
    }
}
export class Response<T> {
    type: "response"
    id: string
    value: any

    constructor(request: Request<T>, value: any) {
        this.type = "response"
        this.id = request.id
        this.value = value
    }
}
export class RequestError<T> {
    type: "requestError"
    id: string
    error: Record<string, any>

    constructor(request: Request<T>, error: Error) {
        this.type = "requestError"
        this.id = request.id
        this.error = errorToObj(error) // the structured clone algorithm is not able to clone errors
    }
}
type MessageCallbacks = {
    resolve: (arg0: any) => void
    reject: (arg0: any) => void
}

/**
 * Handles remote invocations (e.g. worker or native calls).
 */
export class MessageDispatcher<OutgoingRequestType extends string, IncomingRequestType extends string> {
    /**
     * Map from request id that have been sent to the callback that will be
     * executed on the results sent by the worker.
     */
    _messages: Record<string, MessageCallbacks>
    _commands: Commands<IncomingRequestType>
    readonly _transport: Transport<OutgoingRequestType, IncomingRequestType>

    constructor(transport: Transport<OutgoingRequestType, IncomingRequestType> | null, commands: Commands<IncomingRequestType>) {
        this._messages = {}
        this._commands = commands
        this._transport = transport as any
        this._transport?.setMessageHandler(msg => this.handleMessage(msg))
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
                console.log("error payload:", msg.id, msg.type)
                throw e
            }
        })
    }

    handleMessage(message: Message<IncomingRequestType>) {
        if (message.type === "response") {
            this._messages[message.id].resolve(message.value)

            delete this._messages[message.id]
        } else if (message.type === "requestError") {
            this._messages[message.id].reject(objToError(downcast(message).error))

            delete this._messages[message.id]
        } else {
            let command = this._commands[message.requestType]
            let request = message as any

            if (command != null) {
                const commandResult = command(request)

                // Every method exposed via worker protocol must return a promise. Failure to do so is a violation of contract so we
                // try to catch it early and throw an error.
                if (commandResult == null || typeof commandResult.then !== "function") {
                    throw new Error(`Handler returned non-promise result: ${message.requestType}`)
                }

                commandResult
                    .then(value => {
                        this._transport.postMessage(new Response(request, value))
                    })
                    .catch(e => {
                        this._transport.postMessage(new RequestError(request, e))
                    })
            } else {
                let error = new Error(`unexpected request: ${message.id}, ${message.requestType}`)

                if (isWorker()) {
                    this._transport.postMessage(new RequestError(request, error))
                } else {
                    throw error
                }
            }
        }
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
export function errorToObj(
    error: Error,
): {
    data: any
    message: any
    name: any
    stack: any
} {
    return {
        name: (error as any)["name"],
        message: (error as any)["message"],
        stack: (error as any)["stack"],
        data: (error as any)["data"],
    }
}