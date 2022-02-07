import {WebContentsEvent} from "../ElectronExportTypes.js"
import {Message} from "../../api/common/MessageDispatcher.js"
import {IpcMain, webContents} from "electron"

export interface IpcConfig<RenderToMainEvent extends string, MainToRenderEvent extends string> {
	renderToMainEvent: RenderToMainEvent
	mainToRenderEvent: MainToRenderEvent
}

type RequestHandler = (message: Message<unknown>) => unknown

/**
 * Low-level transport which will dispatch commands to renderer and receive responses back.
 *
 * A bit of a clutch which exists because we add listener to the central ipcMain object and then dispatch it based on the sender. This handler can only be
 * registered once per event name so this must be a singleton per event name!
 */
export class CentralIpcHandler<IpcConfigType extends IpcConfig<string, string>> {
	private readonly webContentsIdToRequestHandler = new Map<number, RequestHandler>()

	constructor(
		ipcMain: IpcMain,
		private readonly config: IpcConfigType,
	) {
		ipcMain.handle(this.config.renderToMainEvent, (ev: WebContentsEvent, request) => {
			this.webContentsIdToRequestHandler.get(ev.sender.id)?.(request)
		})
	}

	sendTo(webContentsId: number, message: Message<unknown>): void {
		webContents.fromId(webContentsId).send(this.config.mainToRenderEvent, message)
	}

	addHandler(webContentsId: number, handler: RequestHandler) {
		this.webContentsIdToRequestHandler.set(webContentsId, handler)
	}

	removeHandler(webContentsId: number) {
		this.webContentsIdToRequestHandler.delete(webContentsId)
	}
}