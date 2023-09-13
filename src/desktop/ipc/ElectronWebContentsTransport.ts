import type { Message } from "../../api/common/threading/MessageDispatcher.js"
import type { Transport } from "../../api/common/threading/Transport.js"
import type { WebContents } from "electron"

export interface IpcConfig<RenderToMainEvent extends string, MainToRenderEvent extends string> {
	renderToMainEvent: RenderToMainEvent
	mainToRenderEvent: MainToRenderEvent
}

/**
 * Implementation of Transport which delegates to CenterIpcHandler/WebContents.
 * Should be instantiated per WebContents.
 */
export class ElectronWebContentsTransport<
	IpcConfigType extends IpcConfig<string, string>,
	OutgoingRequestType extends string,
	IncomingRequestType extends string,
> implements Transport<OutgoingRequestType, IncomingRequestType>
{
	constructor(private readonly webContents: WebContents, private readonly config: IpcConfigType) {}

	postMessage(message: Message<OutgoingRequestType>): void {
		if (this.webContents.isDestroyed()) return
		this.webContents.send(this.config.mainToRenderEvent, message)
	}

	setMessageHandler(handler: (message: Message<IncomingRequestType>) => unknown): void {
		if (this.webContents.isDestroyed()) return
		this.webContents.ipc.handle(this.config.renderToMainEvent, (ev, arg) => handler(arg))
	}
}
