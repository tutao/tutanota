import o from "@tutao/otest"
import type { App } from "electron"
import type { DesktopNativeCryptoFacade } from "../../../src/applications/common/desktop/DesktopNativeCryptoFacade.js"
import { delay, lastThrow } from "../../../src/platform-kit/utils"
import { ElectronUpdater } from "../../../src/applications/common/desktop/ElectronUpdater.js"
import type { TutaAppDownloadedEvent, TutaAppUpdater, UpdaterWrapper } from "../../../src/applications/common/desktop/UpdaterWrapper.js"
import { AllConfigKeys, ConfigValue, DesktopConfig } from "../../../src/applications/common/desktop/config/DesktopConfig.js"
import type { DesktopNotifier } from "../../../src/applications/common/desktop/notifications/DesktopNotifier.js"
import { lang } from "../../../src/ui/utils/LanguageViewModel.js"
import en from "../../../src/ui/translations/en.js"
import { matchers, object, verify, when } from "testdouble"
import { FsExports } from "../../../src/applications/common/desktop/ElectronExportTypes.js"
import { WindowManager } from "../../../src/applications/common/desktop/DesktopWindowManager"
import EventEmitter from "node:events"
import { UpdateInfo } from "electron-updater"
import { BuildConfigKey, DesktopConfigEncKey, DesktopConfigKey } from "../../../src/platform-kit/app-env"
import { SchedulerMock } from "../TestUtils"

lang.init(en)

class DesktopConfigMock extends DesktopConfig {
	readonly vars = new Map<AllConfigKeys, any>()
	_buildConfig = new Map<BuildConfigKey, any>()

	constructor() {
		super(object(), object(), object())
	}

	async getVar<K extends AllConfigKeys>(key: K): Promise<any> {
		return this.vars.get(key)
	}

	async getConst(key?: BuildConfigKey): Promise<any> {
		const config = this._buildConfig
		return key ? config.get(key) : config
	}

	async setVar(key: DesktopConfigKey | DesktopConfigEncKey, value: ConfigValue | null): Promise<void> {
		this.vars.set(key, value)
		this._notifyChangeListeners(key, value)
	}

	private _notifyChangeListeners(key: AllConfigKeys, value: ConfigValue | null) {
		const listeners = this.onValueSetListeners[key]
		if (listeners == null) return
		for (const { cb } of listeners) cb(value)
		this.onValueSetListeners[key] = listeners.filter((listener) => !listener.once)
	}
}

const sigB64 = "c2lnbmF0dXJlCg=="
const shaB64 = "c2hhNTEyCg=="
const data = Buffer.from([1, 2, 3])

const UPDATE_INFO: Readonly<UpdateInfo> = {
	files: [],
	releaseDate: "",
	minimumSystemVersion: undefined,
	releaseName: undefined,
	releaseNotes: undefined,
	stagingPercentage: undefined,
	version: "4.5.0",
	path: "/path/to/update",
	sha512: "sha512-fake",
}

const DOWNLOAD_INFO: Readonly<TutaAppDownloadedEvent> = {
	files: [],
	releaseDate: "",
	minimumSystemVersion: undefined,
	releaseName: undefined,
	releaseNotes: undefined,
	stagingPercentage: undefined,
	version: "4.5.0",
	path: "/path/to/update",
	sha512: "sha512-fake",
	signature: sigB64,
	downloadedFile: "downloadedFile.AppImage",
}

o.spec("ElectronUpdater", function () {
	let electron: {
		app: App
	}
	let fs: FsExports
	let wm: WindowManager
	let crypto: DesktopNativeCryptoFacade
	let autoUpdater: TutaAppUpdater
	let conf: DesktopConfigMock
	let notifier: DesktopNotifier
	let updaterImpl: UpdaterWrapper
	let scheduler: SchedulerMock

	let updatesEnabledInBuild = true
	o.beforeEach(function () {
		updatesEnabledInBuild = true
		fs = object()
		wm = object()
		when(fs.promises.unlink("downloadedFile.AppImage")).thenResolve()
		when(fs.promises.readFile("downloadedFile.AppImage")).thenResolve(data)
		when(wm.getAll()).thenReturn([])
		notifier = object()
		when(notifier.showOneShot(matchers.anything())).thenDo((props: { title: string; body: string; icon: any; onClick?: () => unknown }) => {
			Promise.resolve().then(() => props.onClick?.())
		})
		conf = new DesktopConfigMock()
		conf._buildConfig.set(BuildConfigKey.checkUpdateSignature, true)
		conf._buildConfig.set(BuildConfigKey.pubKeys, ["no", "yes"])
		conf._buildConfig.set(BuildConfigKey.pollingInterval, 100)
		conf._buildConfig.set(BuildConfigKey.iconName, "iconName.name")

		conf.setVar(DesktopConfigKey.enableAutoUpdate, true)
		conf.setVar(DesktopConfigKey.showAutoUpdateOption, true)
		const app: Electron.App = object()
		when(app.getVersion()).thenReturn("3.45.0")
		electron = { app }
		const pathCaptor = matchers.captor()
		when(app.getPath(pathCaptor.capture())).thenReturn(`/mock-${pathCaptor.value}/`)
		when(app.once(matchers.anything(), matchers.anything())).thenReturn(app)

		crypto = object()
		when(crypto.verifySignature("yes", data, Buffer.from(sigB64, "base64"))).thenReturn(true)
		when(crypto.verifySignature("no", matchers.anything(), matchers.anything())).thenReturn(false)

		const autoUpdaterEmitter = new EventEmitter()
		autoUpdater = object()
		when(autoUpdater.on(matchers.anything(), matchers.anything())).thenDo((event, cb) => {
			autoUpdaterEmitter.on(event, cb)
			return autoUpdater
		})
		when(autoUpdater.once(matchers.anything(), matchers.anything())).thenDo((event, cb) => {
			autoUpdaterEmitter.once(event, cb)
			return autoUpdater
		})
		when(autoUpdater.removeListener(matchers.anything(), matchers.anything())).thenDo((event, cb) => {
			autoUpdaterEmitter.removeListener(event, cb)
			return autoUpdater
		})
		when(autoUpdater.removeAllListeners(matchers.anything())).thenDo((event) => {
			autoUpdaterEmitter.removeAllListeners(event)
			return autoUpdater
		})
		when(autoUpdater.emit(matchers.anything(), matchers.anything())).thenDo((event, args) => {
			autoUpdaterEmitter.emit(event, args)
			return autoUpdater
		})

		updaterImpl = {
			electronUpdater: autoUpdater,
			updatesEnabledInBuild: () => updatesEnabledInBuild,
		}
		scheduler = new SchedulerMock()
	})

	function waitForInstall(): Promise<void> {
		return new Promise<void>((resolve) => {
			when(autoUpdater.quitAndInstall(false, true)).thenDo(() => resolve())
		})
	}

	o.test("update is available", async function () {
		when(autoUpdater.checkForUpdates()).thenDo(async () => {
			autoUpdater.emit("update-available", UPDATE_INFO)
		})
		when(autoUpdater.downloadUpdate()).thenDo(async () => {
			autoUpdater.emit("update-downloaded", DOWNLOAD_INFO)
		})
		const upd = new ElectronUpdater(conf, wm, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		const installPromise = waitForInstall()
		await upd.start()
		o.check(await conf.getVar(DesktopConfigKey.showAutoUpdateOption)).equals(true)
		await installPromise
		// show notification
		verify(notifier.showOneShot(matchers.anything()), { times: 1 })
		verify(electron.app.emit("enable-force-quit"), { times: 1 })
		o.check(upd.updateInfo).equals(null)("no update info")
	})
	o.test("update is not available", async function () {
		const upd = new ElectronUpdater(conf, wm, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		when(autoUpdater.checkForUpdates()).thenDo(async () => {
			autoUpdater.emit("update-not-available", UPDATE_INFO)
			return null
		})

		await upd.start()
		// don't check signature
		verify(crypto.verifySignature(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		// don't show notification
		verify(notifier.showOneShot(matchers.anything()), { times: 0 })
		verify(autoUpdater.quitAndInstall(), { times: 0 })
		o.check(upd.updateInfo).equals(null)("no update info")
	})
	o.test("enable autoUpdate while running", async function () {
		await conf.setVar(DesktopConfigKey.enableAutoUpdate, false)
		when(autoUpdater.checkForUpdates()).thenDo(async () => {
			autoUpdater.emit("update-available", UPDATE_INFO)
		})
		when(autoUpdater.downloadUpdate()).thenDo(async () => {
			autoUpdater.emit("update-downloaded", DOWNLOAD_INFO)
		})

		const upd = new ElectronUpdater(conf, wm, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		const installPromise = waitForInstall()
		await upd.start()
		// this should trigger the update
		await conf.setVar(DesktopConfigKey.enableAutoUpdate, true)
		await installPromise
		// check signature
		verify(crypto.verifySignature("yes", data, Buffer.from(sigB64, "base64")))
		verify(crypto.verifySignature("no", data, Buffer.from(sigB64, "base64")))
		// show notification
		verify(notifier.showOneShot(matchers.anything()), { times: 1 })
		verify(electron.app.emit("enable-force-quit"), { times: 1 })
	})

	o.test("retry after autoUpdater reports an error", async function () {
		let first = true
		when(autoUpdater.checkForUpdates()).thenDo(() => {
			if (first) {
				first = false
				autoUpdater.emit("error", new Error("this is an autoUpdater error"))
				return Promise.reject("oops")
			} else {
				autoUpdater.emit("update-available", UPDATE_INFO)
				return Promise.resolve()
			}
		})
		when(autoUpdater.downloadUpdate()).thenDo(async () => {
			autoUpdater.emit("update-downloaded", DOWNLOAD_INFO)
		})

		const installPromise = waitForInstall()
		const upd = new ElectronUpdater(conf, wm, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		await upd.start()
		// retry once
		scheduler.getAllPeriodThunks()[0]()
		await installPromise
		verify(notifier.showOneShot(matchers.anything()))
		o.check(upd.updateInfo).equals(null)("no update info")
	})

	o.test("shut down autoUpdater after errors", async function () {
		when(autoUpdater.checkForUpdates()).thenDo(async () => {
			autoUpdater.emit("update-available", UPDATE_INFO)
		})
		when(autoUpdater.downloadUpdate()).thenDo(() => {
			autoUpdater.emit("error", new Error("this is an autoUpdater error"))
			return Promise.resolve()
		})

		const upd = new ElectronUpdater(conf, wm, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		// a bit cursed
		// notifier will reschedule periodic check and show a notification after multiple failures
		// we don't have any observable event other than notification so we just wait for it
		let shownNotification = false
		when(notifier.showOneShot(matchers.anything())).thenDo(() => (shownNotification = true))
		await upd.start()
		while (!shownNotification) {
			const scheduledCheck = lastThrow(scheduler.getAllPeriodThunks())
			scheduledCheck()
			await delay(1)
		}

		o.check(scheduler.allPeriodicCanceled()).equals(true)("update check wasn't rescheduled")
		o.check(upd.updateInfo).equals(null)("no update info")
	})
	o.test("when updates are disabled in build it doesn't check for updates", async function () {
		updatesEnabledInBuild = false

		const upd = new ElectronUpdater(conf, wm, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		await upd.start()
		o.check(upd.updateInfo).equals(null)("no update info")
		verify(autoUpdater.checkForUpdates(), { times: 0 })
		o.check(scheduler.getAllPeriodThunks().length).equals(0)("nothing is scheduled")
	})

	o.test("when all signature checks fail, nothing is installed", async function () {
		conf._buildConfig.set(BuildConfigKey.pubKeys, ["no", "yes"])
		when(autoUpdater.checkForUpdates()).thenDo(async () => {
			autoUpdater.emit("update-available", UPDATE_INFO)
		})
		when(autoUpdater.downloadUpdate()).thenDo(async () => {
			autoUpdater.emit("update-downloaded", { ...DOWNLOAD_INFO, signature: "bogus!" })
		})
		const upd = new ElectronUpdater(conf, wm, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		const deletePromise = new Promise((resolve) => {
			when(fs.promises.unlink("downloadedFile.AppImage")).thenDo(resolve)
		})
		await upd.start()
		await deletePromise
		o.check(upd.updateInfo).equals(null)("no update info")
		verify(notifier.showOneShot(matchers.anything()), { times: 0 })
		verify(electron.app.emit("enable-force-quit"), { times: 0 })
		verify(autoUpdater.quitAndInstall(matchers.anything(), matchers.anything()), { times: 0 })
	})

	o.test("when auto updates are disabled manual update fails on invalid signature", async function () {
		await conf.setVar(DesktopConfigKey.enableAutoUpdate, false)
		conf._buildConfig.set(BuildConfigKey.pubKeys, ["no", "yes"])
		const upd = new ElectronUpdater(conf, wm, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		await upd.start()

		when(autoUpdater.checkForUpdates()).thenDo(async () => {
			autoUpdater.emit("update-available", UPDATE_INFO)
		})
		when(autoUpdater.downloadUpdate()).thenDo(async () => {
			autoUpdater.emit("update-downloaded", { ...DOWNLOAD_INFO, signature: "bogus!" })
		})
		const deletePromise = new Promise((resolve) => {
			when(fs.promises.unlink("downloadedFile.AppImage")).thenDo(resolve)
		})

		await upd.manualUpdate()
		await deletePromise
		await upd.manualUpdate() // check again just to be sure nothing gets installed
		o.check(upd.updateInfo).equals(null)("no update info")
		verify(notifier.showOneShot(matchers.anything()), { times: 0 })
		verify(electron.app.emit("enable-force-quit"), { times: 0 })
		verify(autoUpdater.quitAndInstall(matchers.anything(), matchers.anything()), { times: 0 })
	})

	o.test("if the update verification fails due to fs error, no update is possible", async function () {
		conf._buildConfig.set(BuildConfigKey.pubKeys, ["no", "yes"])
		when(autoUpdater.checkForUpdates()).thenDo(async () => {
			autoUpdater.emit("update-available", UPDATE_INFO)
		})
		when(autoUpdater.downloadUpdate()).thenDo(async () => {
			autoUpdater.emit("update-downloaded", { ...DOWNLOAD_INFO, signature: "bogus!" })
		})
		when(fs.promises.readFile(DOWNLOAD_INFO.downloadedFile)).thenReject(new Error("too big"))
		const upd = new ElectronUpdater(conf, wm, notifier, crypto, electron.app, object(), updaterImpl, fs, scheduler)
		const deletePromise = new Promise((resolve) => when(fs.promises.unlink(DOWNLOAD_INFO.downloadedFile)).thenDo(resolve))

		await upd.start()
		await deletePromise
		o.check(upd.updateInfo).equals(null)("no update info")
		verify(notifier.showOneShot(matchers.anything()), { times: 0 })
		verify(electron.app.emit("enable-force-quit"), { times: 0 })
		verify(autoUpdater.quitAndInstall(matchers.anything(), matchers.anything()), { times: 0 })
	})
})
