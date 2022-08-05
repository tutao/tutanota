import {WebContentsEvent} from "../ElectronExportTypes.js"
import {IpcMain, WebContents} from 'electron'
import {Message} from "../../api/common/MessageDispatcher.js"

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
	// using ref to webContents because webContents tend to get destroyed
	// and we don't know if ids get reused.
	private readonly webContentsToRequestHandler = new WeakMap<WebContents, RequestHandler>()

	constructor(
		ipcMain: IpcMain,
		private readonly config: IpcConfigType,
	) {
		ipcMain.handle(this.config.renderToMainEvent, (ev: WebContentsEvent, request) => {
			// either the WC is not set to be handled by us or it's already been GC'd
			this.webContentsToRequestHandler.get(ev.sender)?.(request)
		})
	}

	sendTo(webContents: WebContents, message: Message<unknown>): void {
		// if the wc is destroyed, it'll get GC'd soon and be removed
		// from the WeakMap
		if (webContents.isDestroyed()) return
		webContents.send(this.config.mainToRenderEvent, message)
	}

	addHandler(webContents: WebContents, handler: RequestHandler) {
		this.webContentsToRequestHandler.set(webContents, handler)
	}

	removeHandler(webContentsId: WebContents) {
		this.webContentsToRequestHandler.delete(webContentsId)
	}
}