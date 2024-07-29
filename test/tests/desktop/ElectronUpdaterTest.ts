import o from "@tutao/otest"
import type { App } from "electron"
import type { DesktopNativeCryptoFacade } from "../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import { delay, downcast } from "@tutao/tutanota-utils"
import { ElectronUpdater } from "../../../src/common/desktop/ElectronUpdater.js"
import type { UpdaterWrapper } from "../../../src/common/desktop/UpdaterWrapper.js"
import n from "../nodemocker.js"
import type { DesktopConfig } from "../../../src/common/desktop/config/DesktopConfig.js"
import type { DesktopNotifier } from "../../../src/common/desktop/DesktopNotifier.js"
import { lang } from "../../../src/common/misc/LanguageViewModel.js"
import en from "../../../src/mail-app/translations/en.js"
import { matchers, object, verify, when } from "testdouble"
import { FsExports } from "../../../src/common/desktop/ElectronExportTypes.js"
import { spy } from "@tutao/tutanota-test-utils"

lang.init(en)

const sigB64 = "c2lnbmF0dXJlCg=="
const shaB64 = "c2hhNTEyCg=="
const data = Buffer.from([1, 2, 3])

o.spec("ElectronUpdater Test", function () {
	let electron: {
		app: App
	}
	let fs: FsExports
	let crypto: DesktopNativeCryptoFacade
	let autoUpdater
	let conf: DesktopConfig
	let notifier: DesktopNotifier
	let updaterImpl: UpdaterWrapper
	o.beforeEach(function () {
		fs = object()
		when(fs.promises.unlink("downloadedFile.AppImage")).thenResolve()
		when(fs.promises.readFile("downloadedFile.AppImage")).thenResolve(data)
		notifier = downcast({
			showOneShot: spy((prop: { title: string; body: string; icon: any }) => Promise.resolve("click")),
		})
		conf = downcast({
			removeListener: spy((key: string, cb: () => void) => conf),
			on: spy((key: string) => conf),
			setVar: spy(),
			getVar: (key: string) => {
				switch (key) {
					case "enableAutoUpdate":
						return true

					case "showAutoUpdateOption":
						return true

					default:
						throw new Error(`unexpected getVar key ${key}`)
				}
			},
			getConst: (key: string) => {
				switch (key) {
					case "checkUpdateSignature":
						return true

					case "pubKeys":
						return ["no", "yes"]

					case "pollingInterval":
						return 300

					case "iconName":
						return "iconName.name"

					default:
						throw new Error(`unexpected getConst key ${key}`)
				}
			},
		})
		const app: Electron.App = object()
		when(app.getVersion()).thenReturn("3.45.0")
		electron = { app }
		const pathCaptor = matchers.captor()
		when(app.getPath(pathCaptor.capture())).thenReturn(`/mock-${pathCaptor.value}/`)
		when(app.once(matchers.anything(), matchers.anything())).thenReturn(app)

		crypto = object()
		when(crypto.verifySignature("yes", data, Buffer.from(sigB64, "base64"))).thenReturn(true)
		when(crypto.verifySignature("no", matchers.anything(), matchers.anything())).thenReturn(false)

		autoUpdater = {
			callbacks: {},
			logger: undefined,
			on: spy(function (ev: string, cb: (arg0: any) => void) {
				if (!this.callbacks[ev]) this.callbacks[ev] = []
				this.callbacks[ev].push({
					fn: spy(cb),
					once: false,
				})
				return this
			}),
			once: function (ev: string, cb: (arg0: any) => void) {
				if (!this.callbacks[ev]) this.callbacks[ev] = []
				this.callbacks[ev].push({
					fn: spy(cb),
					once: true,
				})
				return this
			},
			removeListener: function (ev: string, cb: (arg0: any) => void) {
				if (!this.callbacks[ev]) return
				this.callbacks[ev] = this.callbacks[ev].filter((entry) => entry.fn !== cb)
			},
			removeAllListeners: spy(function (ev: string) {
				this.callbacks[ev] = []
				return this
			}),
			emit: function (ev: string, args: any) {
				const entries = this.callbacks[ev]
				for (const entry of entries) {
					setTimeout(() => entry.fn(args), 1)
				}
				this.callbacks[ev] = entries.filter((entry) => !entry.once)
			},
			checkForUpdates: spy(function () {
				this.emit("update-available", {
					downloadedFile: "downloadedFile.AppImage",
					sha512: shaB64,
					signature: sigB64,
					version: "4.5.0",
				})
				return Promise.resolve()
			}),
			downloadUpdate: spy(function () {
				this.emit("update-downloaded", {
					downloadedFile: "downloadedFile.AppImage",
					sha512: shaB64, // "sha512"
					signature: sigB64,
					version: "4.5.0",
				})
				return Promise.resolve()
			}),
			quitAndInstall: spy(),
		}

		updaterImpl = downcast({
			electronUpdater: autoUpdater,
			updatesEnabledInBuild: () => true,
		})
	})
	o("update is available", async function () {
		downcast(updaterImpl).updatesEnabledInBuild = () => true

		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, object(), updaterImpl, fs)
		upd.start()
		o(conf.setVar.callCount).equals(1)
		o(conf.setVar.args).deepEquals(["showAutoUpdateOption", true])
		// there is only one enableAutoUpdate listener
		o(conf.removeListener.callCount).equals(1)
		o(conf.removeListener.args[0]).equals("enableAutoUpdate")
		o(conf.on.callCount).equals(1)
		await updaterImpl.electronUpdater
		await delay(190)
		// show notification
		o(notifier.showOneShot.callCount).equals(1)
		verify(electron.app.emit("enable-force-quit"), { times: 1 })
		o(autoUpdater.quitAndInstall.callCount).equals(1)
		o(autoUpdater.quitAndInstall.args[0]).equals(false)
		o(autoUpdater.quitAndInstall.args[1]).equals(true)
	})
	o("update is not available", async function () {
		autoUpdater.checkForUpdates = spy(() => Promise.resolve())
		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, object(), updaterImpl, fs)
		upd.start()
		await delay(190)
		o(autoUpdater.checkForUpdates.callCount).equals(1)
		// don't check signature
		verify(crypto.verifySignature(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		// don't show notification
		o(notifier.showOneShot.callCount).equals(0)
		o(autoUpdater.quitAndInstall.callCount).equals(0)

		// @ts-ignore makes the test halt
		upd.stopPolling()
	})
	o("enable autoUpdate while running", async function () {
		//mock instances
		let enabled = false
		const oldConf = conf
		conf = n
			.mock<DesktopConfig>("__conf", oldConf)
			.with({
				removeListener: () => conf,
				on: (key: string, cb: any) => {
					if (!enabled) {
						setTimeout(() => {
							enabled = true
							cb()
						}, 25)
					}

					return conf
				},
				getVar: (key: string) => {
					switch (key) {
						case "enableAutoUpdate":
							return enabled

						case "showAutoUpdateOption":
							return true

						default:
							throw new Error(`unexpected getVar key ${key}`)
					}
				},
			})
			.set()
		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, object(), updaterImpl, fs)
		upd.start()
		await delay(100)
		// entered start() twice
		o(conf.removeListener.callCount).equals(2)
		o(conf.on.callCount).equals(2)
		// check signature
		verify(crypto.verifySignature("yes", data, Buffer.from(sigB64, "base64")))
		verify(crypto.verifySignature("no", data, Buffer.from(sigB64, "base64")))
		// show notification
		o(notifier.showOneShot.callCount).equals(1)
		verify(electron.app.emit("enable-force-quit"), { times: 1 })
		o(autoUpdater.quitAndInstall.callCount).equals(1)
		o(autoUpdater.quitAndInstall.args[0]).equals(false)
		o(autoUpdater.quitAndInstall.args[1]).equals(true)
	})
	o("retry after autoUpdater reports an error", async function () {
		o.timeout(500) // this is very slow for some reason

		let first = true

		autoUpdater.checkForUpdates = function () {
			if (first) {
				first = false
				this.emit("error", {
					message: "this is an autoUpdater error",
				})
				return Promise.reject("oops")
			} else {
				this.emit("update-available", {
					sha512: "sha512",
					signature: "signature",
				})
				return Promise.resolve()
			}
		}

		const scheduler = (fn, time) => setInterval(fn, 10)

		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		upd.start()
		// after the error
		await delay(2)
		o(autoUpdater.downloadUpdate.callCount).equals(0)("downloadUpdate after error")
		//after the download
		await delay(200)
		o(notifier.showOneShot.callCount).equals(1)("showOneShot")
		o(autoUpdater.downloadUpdate.callCount).equals(1)("downloadUpdate after download")
	})
	o("shut down autoUpdater after errors", async function () {
		autoUpdater.downloadUpdate = function () {
			autoUpdater.emit("error", {
				message: "this is an autoUpdater error",
			})
			return Promise.resolve()
		}

		const scheduler = (fn) => setInterval(fn, 5)

		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		upd.start()
		await delay(150)

		// @ts-ignore
		upd.stopPolling()

		o(notifier.showOneShot.callCount).equals(1)("showOneShot")
	})
	o("works if second key is right one", async function () {
		o.timeout(1000)
		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, object(), updaterImpl, fs)
		upd.start()
		// there is only one enableAutoUpdate listener
		o(conf.removeListener.callCount).equals(1)
		o(conf.removeListener.args[0]).equals("enableAutoUpdate")
		o(conf.on.callCount).equals(1)
		await delay(250)
		o(autoUpdater.checkForUpdates.callCount).equals(1)
		// check signature
		verify(crypto.verifySignature("no", data, Buffer.from(sigB64, "base64")))
		verify(crypto.verifySignature("yes", data, Buffer.from(sigB64, "base64")))
		// show notification
		o(notifier.showOneShot.callCount).equals(1)
		verify(electron.app.emit("enable-force-quit"), { times: 1 })
		o(autoUpdater.quitAndInstall.callCount).equals(1)
		o(autoUpdater.quitAndInstall.args[0]).equals(false)
		o(autoUpdater.quitAndInstall.args[1]).equals(true)

		// @ts-ignore
		upd.stopPolling()
	})
	o("updater disables itself if accessSync throws", async function () {
		downcast(updaterImpl).updatesEnabledInBuild = () => false

		const upd = new ElectronUpdater(conf, notifier, crypto, electron.app, object(), updaterImpl, fs)
		await updaterImpl.electronUpdater
		o(autoUpdater.on.callCount).equals(6)
		upd.start()
		o(conf.setVar.callCount).equals(1)
		o(conf.setVar.args).deepEquals(["showAutoUpdateOption", false])
		o(conf.removeListener.callCount).equals(0)
	})
})
