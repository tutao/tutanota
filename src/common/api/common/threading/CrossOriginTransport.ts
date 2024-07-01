import { Message } from "./MessageDispatcher.js"

/** transport impl for communication between the main thread and another browsing context opened in an iframe or another tab */
export class CrossOriginTransport<OutgoingCommandType, IncomingCommandType> {
	private handler?: (message: Message<IncomingCommandType>) => unknown

	/**
	 * @param targetWindow the window object to post / receive messages to, obtained from iframe.contentWindow or window.opener
	 * @param targetOrigin the exact origin of targetWindow
	 * */
	constructor(private readonly targetWindow: Window, private readonly targetOrigin: string) {}

	private readonly handleMessage = (event: MessageEvent<Message<IncomingCommandType>>) => {
		if (event.source !== this.targetWindow) {
			console.log("got message not from expected thing?")
			return
		}
		if (event.origin != this.targetOrigin) {
			console.log("got message not from expected origin?")
			return
		}
		this.handler?.(event.data)
	}

	postMessage(message: Message<OutgoingCommandType>): void {
		return this.targetWindow.postMessage(message, this.targetOrigin)
	}

	setMessageHandler(handler: (message: Message<IncomingCommandType>) => unknown) {
		this.handler = handler
		window.addEventListener("message", this.handleMessage)
	}

	dispose() {
		window.removeEventListener("message", this.handleMessage)
	}
}
