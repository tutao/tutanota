import Stream from "mithril/stream"
import stream from "mithril/stream"
import {IInterWindowEventHandler, IInterWindowEventSender, InterWindowEvent} from "../../desktop/ipc/IInterWindowEventBus"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"

/** Communicates between different windows in a desktop app. */
export class InterWindowEventBus implements IInterWindowEventHandler {
	private sender: IInterWindowEventSender | null = null
	readonly events: Stream<InterWindowEvent> = stream()

	init(sender: IInterWindowEventSender) {
		this.sender = sender
	}

	async send<T extends InterWindowEvent>(event: T): Promise<void> {
		if (this.sender == null) {
			throw new ProgrammingError("Not initialized")
		}
		await this.sender.send(event)
	}

	async onEvent(event: InterWindowEvent) {
		this.events(event)
	}
}