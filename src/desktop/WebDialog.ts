import {app, BrowserWindow, ipcMain, WebContents} from "electron"
import path from "path"
import {defer} from "@tutao/tutanota-utils"
import {ElectronWebContentsTransport} from "./ipc/ElectronWebContentsTransport.js"
import {NativeToWebRequest, WebToNativeRequest} from "../native/main/WebauthnNativeBridge.js"
import {MessageDispatcher} from "../api/common/MessageDispatcher.js"
import {exposeRemote} from "../api/common/WorkerProxy.js"
import {CancelledError} from "../api/common/error/CancelledError.js"
import {CentralIpcHandler} from "./ipc/CentralIpcHandler.js"
import {register} from "./electron-localshortcut/LocalShortcut.js"

/**
 * a browserWindow wrapper that
 * * opens a specific website
 * * installs a nativeBrigde
 * * sends a request to the webContents
 * * returns the result of the call
 */

export interface IWebDialogController {
	create<FacadeType extends object>(parentWindowId: number, urlToOpen: URL): Promise<WebDialog<FacadeType>>
}

export const webauthnIpcConfig = Object.freeze({
	renderToMainEvent: "to-main-webdialog",
	mainToRenderEvent: "to-renderer-webdialog"
})

export type WebDialogIpcConfig = typeof webauthnIpcConfig
export type WebDialogIpcHandler = CentralIpcHandler<WebDialogIpcConfig>

// Singleton
export const webauthnIpcHandler: WebDialogIpcHandler = new CentralIpcHandler(ipcMain, webauthnIpcConfig)

/** A dialog which was already loaded. Allows sending one request or closing it. */
export class WebDialog<FacadeType extends object> {
	constructor(
		private facade: FacadeType,
		private closedPromise: Promise<never>,
		private browserWindow: BrowserWindow,
	) {
	}

	makeRequest<T>(requestSender: (facade: FacadeType) => Promise<T>): Promise<T> {
		return Promise
			.race([
				this.closedPromise,
				requestSender(this.facade)
			])
			.catch((e) => {
				console.log("web dialog error!", e)
				throw e
			})
			.finally(() => {
				if (!this.browserWindow.isDestroyed()) this.browserWindow.close()
			})
	}

	cancel() {
		this.browserWindow.close()
	}
}

export class WebDialogController implements IWebDialogController {
	constructor(
		private readonly ipcHandler: WebDialogIpcHandler
	) {
	}

	async create<FacadeType extends object>(parentWindowId: number, urlToOpen: URL): Promise<WebDialog<FacadeType>> {
		const bw = await this.createBrowserWindow(parentWindowId)
		const closeDefer = defer<never>()
		bw.on("closed", () => {
			console.log("web dialog window closed")
			closeDefer.reject(new CancelledError("Window closed"))
		})

		register(bw, "F12", () => {
			bw.webContents.openDevTools()
		})

		bw.once('ready-to-show', () => bw.show())
		bw.webContents.on("did-fail-load", () => closeDefer.reject(new Error(`Could not load web dialog at ${urlToOpen}`)))
		await bw.loadURL(urlToOpen.toString())

		const facade = await this.initRemoteWebauthn<FacadeType>(bw.webContents)

		bw.webContents.on("destroyed", () => this.uninitRemoteWebauthn(bw.webContents))

		return new WebDialog(facade, closeDefer.promise, bw)
	}

	private async createBrowserWindow(parentWindowId: number) {
		const active = BrowserWindow.fromId(parentWindowId)

		return new BrowserWindow({
			parent: active ?? undefined,
			modal: true,
			skipTaskbar: true,
			resizable: false,
			movable: false,
			alwaysOnTop: true,
			fullscreenable: false,
			frame: false,
			width: 400,
			height: 200,
			autoHideMenuBar: true,
			show: false,
			webPreferences: {
				nodeIntegration: false,
				nodeIntegrationInWorker: false,
				nodeIntegrationInSubFrames: false,
				sandbox: true,
				contextIsolation: true,
				webSecurity: true,
				// @ts-ignore see: https://github.com/electron/electron/issues/30789
				enableRemoteModule: false,
				allowRunningInsecureContent: false,
				preload: path.join(app.getAppPath(), "./desktop/preload-webdialog.js"),
				webgl: false,
				plugins: false,
				experimentalFeatures: false,
				webviewTag: false,
				disableDialogs: true,
				navigateOnDragDrop: false,
				autoplayPolicy: "user-gesture-required",
				enableWebSQL: false,
				spellcheck: false,
			},
		})
	}

	async initRemoteWebauthn<FacadeType>(webContents: WebContents): Promise<FacadeType> {
		const deferred = defer<void>()
		const transport = new ElectronWebContentsTransport<WebDialogIpcConfig, "facade", "init">(webContents, this.ipcHandler)
		const dispatcher = new MessageDispatcher<NativeToWebRequest, WebToNativeRequest>(transport, {
			"init": () => {
				deferred.resolve()
				return Promise.resolve()
			}
		})
		await deferred.promise
		return exposeRemote<FacadeType>(req => dispatcher.postRequest(req))
	}

	private async uninitRemoteWebauthn(webContents: WebContents) {
		this.ipcHandler.removeHandler(webContents.id)
	}
}