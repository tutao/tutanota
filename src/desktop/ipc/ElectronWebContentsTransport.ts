import type {Message, Transport} from "../../api/common/MessageDispatcher.js"
import type {CentralIpcHandler, IpcConfig} from "./CentralIpcHandler.js"
import type {WebContents} from "electron"

/**
 * Implementation of Transport which delegates to CenterIpcHandler/WebContents.
 * Should be instantiated per WebContents.
 */
export class ElectronWebContentsTransport<IpcConfigType extends IpcConfig<string, string>,
	OutgoingRequestType extends string,
	IncomingRequestType extends string> implements Transport<OutgoingRequestType, IncomingRequestType> {

	constructor(
		private readonly webContents: WebContents,
		private readonly ipcHandler: CentralIpcHandler<IpcConfigType>,
	) {
	}

	postMessage(message: Message<OutgoingRequestType>): void {
		this.ipcHandler.sendTo(this.webContents.id, message)
	}

	setMessageHandler(handler: (message: Message<IncomingRequestType>) => unknown): void {
		this.ipcHandler.addHandler(this.webContents.id, handler)
	}
}