import o from "@tutao/otest"
import { DesktopOauthWindowFacade } from "../../../src/applications/common/desktop/DesktopOauthWindowFacade.js"
import { func, matchers, object, verify, when } from "testdouble"
import { BrowserWindow } from "electron"
import { LocalShortcutManager } from "../../../src/applications/common/desktop/electron-localshortcut/LocalShortcut"
import { noOp } from "../../../src/platform-kit/utils"

o.spec("DesktopOauthWindowFacade", () => {
	const redirectUrl = "https://myapp.com/callback"
	const authUrl = "https://auth.provider.com/oauth"

	let electronMock: any
	let pathMock: typeof import("node:path")
	let localShortcutMock: LocalShortcutManager
	let browserWindowInstanceMock: any
	let onBeforeRequestCallback: ((details: { url: string }) => void) | null = null
	let onClosedCallback: (() => void) | null = null

	o.beforeEach(() => {
		browserWindowInstanceMock = object<BrowserWindow>()

		when(browserWindowInstanceMock.on("closed", matchers.anything())).thenDo((event, handler) => {
			if (event === "closed") onClosedCallback = handler
		})

		const filter = { urls: [`${redirectUrl}*`] }
		when(browserWindowInstanceMock.webContents.session.webRequest.onBeforeRequest(filter, matchers.anything())).thenDo((_filter, handler) => {
			onBeforeRequestCallback = handler
		})

		const MockBrowserWindow = func()
		when(MockBrowserWindow(matchers.anything())).thenDo((opts) => {
			browserWindowInstanceMock.opts = opts
			return browserWindowInstanceMock
		})
		electronMock = object<typeof Electron.CrossProcessExports>()
		electronMock.BrowserWindow = MockBrowserWindow
		when(electronMock.app.getAppPath()).thenReturn("/fake/app/path")
		when(electronMock.shell.openExternal(matchers.anything())).thenDo(noOp)

		pathMock = object<typeof import("node:path")>()
		when(pathMock.join(matchers.anything(), "./desktop/preload-webdialog.js")).thenReturn("/fake/preload.js")

		localShortcutMock = object<LocalShortcutManager>()
	})

	o.test("openOauthWindow - creates window with correct options and loads URL", async () => {
		const facade = new DesktopOauthWindowFacade(electronMock, pathMock, localShortcutMock)
		const promise = facade.openOauthWindow(authUrl, redirectUrl)

		const expectedPrefs = {
			nodeIntegration: false,
			nodeIntegrationInWorker: false,
			nodeIntegrationInSubFrames: false,
			sandbox: true,
			contextIsolation: true,
			webSecurity: true,
			enableRemoteModule: false,
			allowRunningInsecureContent: false,
			preload: "/fake/preload.js",
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
		}
		o(browserWindowInstanceMock.opts).deepEquals({
			center: true,
			width: 600,
			height: 633,
			webPreferences: expectedPrefs,
		})

		verify(localShortcutMock.register(browserWindowInstanceMock, "F12", matchers.isA(Function)), { times: 1 })

		verify(browserWindowInstanceMock.loadURL(authUrl), { times: 1 })

		if (onBeforeRequestCallback) {
			onBeforeRequestCallback({ url: `${redirectUrl}?code=abc123` })
		}

		const result = await promise
		o(result).equals(`${redirectUrl}?code=abc123`)
		verify(browserWindowInstanceMock.close(), { times: 1 })
	})

	o.test("openOauthWindow - resolves with null when window is closed by user", async () => {
		const facade = new DesktopOauthWindowFacade(electronMock, pathMock, localShortcutMock)
		const promise = facade.openOauthWindow(authUrl, redirectUrl)

		if (onClosedCallback) {
			onClosedCallback()
		}

		const result = await promise
		o(result).equals(null)
		verify(browserWindowInstanceMock.close(), { times: 0 })
	})

	o.test("destroyAuthWin - closes and nullifies window", () => {
		const facade = new DesktopOauthWindowFacade(electronMock, pathMock, localShortcutMock)
		facade.win = browserWindowInstanceMock
		facade.destroyAuthWin()
		verify(browserWindowInstanceMock.close(), { times: 1 })
		o(facade.win).equals(null)
	})

	o.test("destroyAuthWin - does nothing if window already null", () => {
		const facade = new DesktopOauthWindowFacade(electronMock, pathMock, localShortcutMock)
		facade.win = null
		facade.destroyAuthWin()
		verify(browserWindowInstanceMock.close(), { times: 0 })
	})

	o.test("loadTokens - returns callbackURL", async () => {
		const facade = new DesktopOauthWindowFacade(electronMock, pathMock, localShortcutMock)
		const callbackURL = "https://example.com/callback?code=xyz"
		const result = await facade.loadTokens(callbackURL)
		o(result).equals(callbackURL)
	})
})
