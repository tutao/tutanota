import { MessagePortMain, MessageChannelMain } from "electron"

/**
 * Adapts Electron's Node.js-style MessagePortMain
 * to look like a standard Web MessagePort for capnweb
 */
export class WebMessagePortAdapter {
	public onmessage: ((ev: MessageEvent) => any) | null = null

	constructor(private electronPort: MessagePortMain) {
		// Listen to Electron's Node-style event and trigger the Web-style property
		this.electronPort.on("message", (event) => {
			if (this.onmessage) {
				// Construct a simple MessageEvent-like object
				this.onmessage({ data: event.data, ports: event.ports } as unknown as MessageEvent)
			}
		})
	}

	start() {
		this.electronPort.start()
	}

	close() {
		this.electronPort.close()
	}

	postMessage(message: unknown, transfer?: Transferable[]) {
		// Cast is safe here, standard MessagePorts and MessagePortMains
		// accept the same underlying data structures.
		this.electronPort.postMessage(message, transfer as any)
	}
}
