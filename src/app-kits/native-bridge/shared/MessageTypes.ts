import { errorToObj } from "../../../platform-kits/utils"

export type Command<T> = (msg: Request<T>) => Promise<any>
export type Commands<T extends string> = Record<T, Command<T>>
export type Message<Type> = Request<Type> | Response<Type> | RequestError<Type>

export class Request<T> {
	readonly type: "request"
	readonly requestType: T
	/** should be selected and assigned by the message dispatcher or on deserialization only. */
	id: string | null = null

	readonly args: any[]

	constructor(type: T, args: ReadonlyArray<unknown>) {
		this.type = "request"
		this.requestType = type
		this.id = null
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

export type MessageCallbacks = {
	resolve: (value: any) => void
	reject: (error: Error) => void
}

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
