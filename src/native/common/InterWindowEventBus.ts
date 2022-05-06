import {IInterWindowEventHandler, IInterWindowEventSender, InterWindowEvent} from "../../desktop/ipc/IInterWindowEventBus"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"

type Listener = (event: InterWindowEvent) => Promise<void>

/**
 * Communicates between different windows in a desktop app.
 *
 * Calls to `send` will resolve once all of the listeners have resolved or reject on the first rejection
 */
export class InterWindowEventBus implements IInterWindowEventHandler {
	private sender: IInterWindowEventSender | null = null
	private readonly listeners: Array<Listener> = []

	init(sender: IInterWindowEventSender) {
		this.sender = sender
	}

	addListener(listener: Listener) {
		this.listeners.push(listener)
	}

	async send(event: InterWindowEvent): Promise<void> {
		if (this.sender == null) {
			throw new ProgrammingError("Not initialized")
		}
		await this.sender.send(event)
	}

	async onEvent(event: InterWindowEvent) {
		await Promise.all(this.listeners.map(listener => listener(event)))
	}
}