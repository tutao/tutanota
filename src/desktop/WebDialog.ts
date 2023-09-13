import { app, BrowserWindow, WebContents } from "electron"
import path from "node:path"
import { defer } from "@tutao/tutanota-utils"
import { ElectronWebContentsTransport } from "./ipc/ElectronWebContentsTransport.js"
import { NativeToWebRequest, WebToNativeRequest } from "../native/main/WebauthnNativeBridge.js"
import { MessageDispatcher } from "../api/common/threading/MessageDispatcher.js"
import { exposeRemote } from "../api/common/WorkerProxy.js"
import { CancelledError } from "../api/common/error/CancelledError.js"
import { register } from "./electron-localshortcut/LocalShortcut.js"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"

export const webauthnIpcConfig = Object.freeze({
	renderToMainEvent: "to-main-webdialog",
	mainToRenderEvent: "to-renderer-webdialog",
})

export type WebDialogIpcConfig = typeof webauthnIpcConfig

/** A dialog which was already loaded. Allows sending one request or closing it. */
export class WebDialog<FacadeType extends object> {
	constructor(private facade: FacadeType, private closedPromise: Promise<never>, private browserWindow: BrowserWindow) {}

	makeRequest<T>(requestSender: (facade: FacadeType) => Promise<T>): Promise<T> {
		return Promise.race([this.closedPromise, requestSender(this.facade)])
			.catch((e) => {
				console.log("web dialog error!", e)
				throw e
			})
			.finally(() => {
				this.close()
			})
	}

	cancel() {
		this.close()
	}

	private close() {
		if (!this.browserWindow.isDestroyed()) this.browserWindow.close()
	}
}

/**
 * a browserWindow wrapper that
 * * opens a specific website
 * * installs a nativeBrigde
 * * sends a request to the webContents
 * * returns the result of the call
 */
export class WebDialogController {
	async create<FacadeType extends object>(parentWindowId: number, urlToOpen: URL): Promise<WebDialog<FacadeType>> {
		const bw = await this.createBrowserWindow(parentWindowId)
		// Holding a separate reference on purpose. When BrowserWindow is destroyed and WebContents fire "destroyed" event, we can't get WebContents from
		// BrowserWindow anymore.
		const { webContents } = bw
		const closeDefer = defer<never>()
		bw.on("closed", () => {
			console.log("web dialog window closed")
			closeDefer.reject(new CancelledError("Window closed"))
		})

		register(bw, "F12", () => {
			webContents.openDevTools()
		})

		bw.once("ready-to-show", () => bw.show())
		webContents.on("did-fail-load", () => closeDefer.reject(new Error(`Could not load web dialog at ${urlToOpen}`)))

		// Don't wait for the facade to init here, because that only happens after we call `bw.loadUrl`
		// But we need setup the listener beforehand in case the app in the webDialog loads too fast and we miss it
		const facadePromise = this.initRemoteFacade<FacadeType>(bw.webContents)
		await bw.loadURL(urlToOpen.toString())

		// We can confidently await here because we're sure that the bridge will be finished being setup in the webDialog
		const facade = await facadePromise
		return new WebDialog(facade, closeDefer.promise, bw)
	}

	private async createBrowserWindow(parentWindowId: number) {
		const active = BrowserWindow.fromId(parentWindowId)

		const window = new BrowserWindow({
			parent: active ?? undefined,
			modal: true,
			skipTaskbar: true,
			resizable: false,
			movable: false,
			alwaysOnTop: true,
			fullscreenable: false,
			roundedCorners: false,
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
				partition: "webdialog",
			},
		})
		const session = window.webContents.session
		// Intercepts all file:// requests and forbids them
		if (!session.protocol.isProtocolIntercepted("file")) {
			const intercepting = session.protocol.interceptFileProtocol("file", (request, cb) => {
				cb({ statusCode: 403 })
			})
			if (!intercepting) {
				throw new ProgrammingError("Cannot intercept file: protocol for WebDialog!")
			}
		}

		return window
	}

	/**
	 * initialize the facade impl that's displayed in the webContents
	 */
	private async initRemoteFacade<FacadeType>(webContents: WebContents): Promise<FacadeType> {
		const deferred = defer<void>()
		const transport = new ElectronWebContentsTransport<WebDialogIpcConfig, "facade", "init">(webContents, webauthnIpcConfig)
		const dispatcher = new MessageDispatcher<NativeToWebRequest, WebToNativeRequest>(
			transport,
			{
				init: () => {
					deferred.resolve()
					return Promise.resolve()
				},
			},
			"node-webauthn",
		)
		const facade = exposeRemote<FacadeType>((req) => dispatcher.postRequest(req))
		await deferred.promise
		return facade
	}
}
