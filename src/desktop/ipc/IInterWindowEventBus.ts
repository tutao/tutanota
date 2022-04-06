/** Type of the event that can be sent over event bus. */
export interface InterWindowEvent {
	name: string,
}

/** Sends events to interwindow event bus. */
export interface IInterWindowEventSender {
	send(event: InterWindowEvent): Promise<void>
}

/** Receives events from interwindow event bus*/
export interface IInterWindowEventHandler {
	onEvent(event: InterWindowEvent): Promise<void>
}