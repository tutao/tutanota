import type { BrowserWindow } from "electron"
import type { LocalShortcutManager } from "./electron-localshortcut/LocalShortcut"
import { OauthFacade } from "@tutao/native-bridge/generatedIpc/types"

export class DesktopOauthWindowFacade implements OauthFacade {
	// Visible for testing
	win: BrowserWindow | null = null

	constructor(
		private readonly electron: typeof Electron.CrossProcessExports,
		private readonly path: typeof import("node:path"),
		private readonly localShortcut: LocalShortcutManager,
	) {}

	async openOauthWindow(url: string, redirectUrl: string): Promise<string | null> {
		this.destroyAuthWin()

		return new Promise((resolve) => {
			this.win = new this.electron.BrowserWindow({
				height: 800,
				width: 600,
				center: true,
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
					preload: this.path.join(this.electron.app.getAppPath(), "./desktop/preload-webdialog.js"),
					webgl: false,
					plugins: false,
					experimentalFeatures: false,
					webviewTag: false,
					disableDialogs: true,
					navigateOnDragDrop: false,
					autoplayPolicy: "user-gesture-required",
					enableWebSQL: false,
					spellcheck: false,
					partition: "oauthdialog",
				},
			})

			this.localShortcut.register(this.win, "F12", () => {
				this.win?.webContents.openDevTools()
			})

			const {
				session: { webRequest },
			} = this.win.webContents

			const filter = { urls: [`${redirectUrl}*`] }

			webRequest.onBeforeRequest(filter, async ({ url }) => {
				if (url.startsWith(redirectUrl)) {
					this.destroyAuthWin()
					resolve(url)
				}
			})

			this.win.on("closed", () => {
				this.win = null
				resolve(null)
			})

			this.win.loadURL(url)
		})
	}

	async loadTokens(callbackURL: any) {
		return callbackURL
	}

	destroyAuthWin() {
		if (!this.win) return
		this.win.close()
		this.win = null
	}
}
