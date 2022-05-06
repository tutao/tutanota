import {ProgrammingError} from "../../api/common/error/ProgrammingError"
import {getFromMap} from "@tutao/tutanota-utils"
import {TutanotaError} from "../../api/common/error/TutanotaError"

/** Sends events to interwindow event bus. */
export interface InterWindowEventSender<Events> {
	send<E extends keyof Events>(event: E, data: Events[E]): Promise<void>
}

/** Receives events from interwindow event bus*/
export interface InterWindowEventHandler<Events> {
	onEvent<E extends keyof Events>(event: E, data: Events[E]): Promise<void>
}

export class InterWindowEventBusError extends TutanotaError {
	constructor(event: string, readonly cause: Error) {
		super("InterWindowEventBusError", `Error on "${event}" event from other window: ${cause.message}`)
	}
}

type Listener<T> = (data: T) => Promise<void>

/**
 * Communicates between different windows in a desktop app.
 *
 * Calls to `send` will resolve once all of the listeners have resolved or reject on the first rejection
 */
export class InterWindowEventBus<Events> implements InterWindowEventHandler<Events> {
	private sender: InterWindowEventSender<Events> | null = null
	private readonly listeners: Map<keyof Events, Array<Listener<Events[keyof Events]>>> = new Map()

	init(sender: InterWindowEventSender<Events>) {
		this.sender = sender
	}

	addListener<E extends keyof Events>(event: E, listener: Listener<Events[E]>) {
		getFromMap(this.listeners, event, () => []).push(listener)
	}

	/**
	 * Send a message to all other windows. Resolves once each window has handled the message
	 * @throws InterWindowEventBusError if any of the handlers from other windows throws, containing that caused it
	 */
	async send<E extends keyof Events>(event: E, data: Events[E]): Promise<void> {
		if (this.sender == null) {
			throw new ProgrammingError("Not initialized")
		}
		await this.sender.send(event, data).catch(e => {
			throw new InterWindowEventBusError(`${event}`, e)
		})
	}

	async onEvent<E extends keyof Events>(event: E, data: Events[E]) {
		const listeners = getFromMap(this.listeners, event, () => [])
		await Promise.all(listeners.map(listener => listener(data)))
	}
}