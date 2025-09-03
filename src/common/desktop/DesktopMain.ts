import { mp } from "./DesktopMonkeyPatch"
import { err } from "./DesktopErrorHandler"
import { DesktopConfig } from "./config/DesktopConfig"
import * as electron from "electron"
import { app, type Session } from "electron"
import { DesktopUtils } from "./DesktopUtils"
import { setupAssetProtocol, WindowManager } from "./DesktopWindowManager"
import { DesktopNotifier } from "./notifications/DesktopNotifier"
import { ElectronUpdater } from "./ElectronUpdater.js"
import { Socketeer } from "./Socketeer"
import { DesktopAlarmStorage } from "./sse/DesktopAlarmStorage"
import { DesktopAlarmScheduler } from "./sse/DesktopAlarmScheduler"
import { InfoLink, lang } from "../misc/LanguageViewModel"
import { DesktopNetworkClient } from "./net/DesktopNetworkClient.js"
import { DesktopNativeCryptoFacade } from "./DesktopNativeCryptoFacade"
import { DesktopTray } from "./tray/DesktopTray"
import { log } from "./DesktopLog"
import { UpdaterWrapper } from "./UpdaterWrapper"
import { createNotificationFactory } from "./notifications/NotificationFactory"
import { preselectGnomeLibsecret, SafeStorageSecretStorage } from "./sse/SecretStorage"
import fs from "node:fs"
import { DesktopIntegrator, getDesktopIntegratorForPlatform } from "./integration/DesktopIntegrator"
import net from "node:net"
import child_process from "node:child_process"
import { LocalShortcutManager } from "./electron-localshortcut/LocalShortcut"
import { cryptoFns } from "./CryptoFns"
import { DesktopConfigMigrator } from "./config/migrations/DesktopConfigMigrator"
import { DesktopKeyStoreFacade } from "./DesktopKeyStoreFacade.js"
import { SchedulerImpl } from "../api/common/utils/Scheduler.js"
import { DesktopThemeFacade } from "./DesktopThemeFacade"
import { BuildConfigKey, DesktopConfigKey } from "./config/ConfigKeys"
import { DesktopNativeCredentialsFacade } from "./credentials/DesktopNativeCredentialsFacade.js"
import { WebDialogController } from "./WebDialog.js"
import path from "node:path"
import { DesktopContextMenu } from "./DesktopContextMenu.js"
import { DesktopNativePushFacade } from "./sse/DesktopNativePushFacade.js"
import { NativeCredentialsFacade } from "../native/common/generatedipc/NativeCredentialsFacade.js"
import { DispatcherFactory, FacadeHandler, RemoteBridge, WindowCleanup } from "./ipc/RemoteBridge.js"
import { DesktopSettingsFacade } from "./config/DesktopSettingsFacade.js"
import { ApplicationWindow } from "./ApplicationWindow.js"
import { DesktopCommonSystemFacade } from "./DesktopCommonSystemFacade.js"
import { DesktopGlobalDispatcher } from "../native/common/generatedipc/DesktopGlobalDispatcher.js"
import { DesktopDesktopSystemFacade } from "./DesktopDesktopSystemFacade.js"
import { DesktopExportFacade } from "./export/DesktopExportFacade.js"
import { DesktopFileFacade } from "./files/DesktopFileFacade.js"
import { DesktopSearchTextInAppFacade } from "./DesktopSearchTextInAppFacade.js"
import { DesktopWebauthnFacade } from "./2fa/DesktopWebauthnFacade.js"
import { DesktopPostLoginActions } from "./DesktopPostLoginActions.js"
import { DesktopInterWindowEventFacade } from "./ipc/DesktopInterWindowEventFacade.js"
import { OfflineDbFactory, PerWindowSqlCipherFacade } from "./db/PerWindowSqlCipherFacade.js"
import { LazyLoaded, lazyMemoized, noOp } from "@tutao/tutanota-utils"
import dns from "node:dns"
import { getConfigFile } from "./config/ConfigFile.js"
import { OfflineDbRefCounter } from "./db/OfflineDbRefCounter.js"
import { WorkerSqlCipher } from "./db/WorkerSqlCipher.js"
import { TempFs } from "./files/TempFs.js"
import { makeDbPath } from "./db/DbUtils.js"
import { DesktopCredentialsStorage } from "./db/DesktopCredentialsStorage.js"
import { AppPassHandler } from "./credentials/AppPassHandler.js"
import { SseClient } from "./sse/SseClient.js"
import { TutaNotificationHandler } from "./sse/TutaNotificationHandler.js"
import { TutaSseFacade } from "./sse/TutaSseFacade.js"
import { SseStorage } from "./sse/SseStorage.js"
import { DesktopSseDelay } from "./sse/reconnectDelay.js"
import { KeychainEncryption } from "./credentials/KeychainEncryption.js"
import { Argon2IDExports } from "@tutao/tutanota-crypto"
import { SqlCipherFacade } from "../native/common/generatedipc/SqlCipherFacade.js"
import { ExposedNativeInterface } from "../native/common/NativeInterface.js"
import { DelayedImpls, exposeLocalDelayed } from "../api/common/WorkerProxy.js"
import { DefaultDateProvider } from "../calendar/date/CalendarUtils.js"
import { AlarmScheduler } from "../calendar/date/AlarmScheduler.js"
import { DesktopExternalCalendarFacade } from "./ipc/DesktopExternalCalendarFacade.js"
import { customFetch } from "./net/NetAgent"
import { DesktopMailImportFacade } from "./mailimport/DesktopMailImportFacade.js"
import { MailboxExportPersistence } from "./export/MailboxExportPersistence.js"
import { DesktopExportLock } from "./export/DesktopExportLock"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import { InstancePipeline } from "../api/worker/crypto/InstancePipeline"
import { ClientModelInfo } from "../api/common/EntityFunctions"
import { CommandExecutor } from "./CommandExecutor"
import { makeSuspensionAwareFetch } from "./net/SuspensionAwareFetch"
import { SuspensionHandler } from "../api/worker/SuspensionHandler"

mp()

dns.setDefaultResultOrder("ipv4first")

setupAssetProtocol(electron)

const TAG = "[DesktopMain]"

type Components = {
	readonly wm: WindowManager
	readonly tfs: TempFs
	readonly sse: TutaSseFacade
	readonly conf: DesktopConfig
	readonly keyStoreFacade: DesktopKeyStoreFacade
	readonly notifier: DesktopNotifier
	readonly sock: Socketeer
	readonly updater: ElectronUpdater
	readonly integrator: DesktopIntegrator
	readonly tray: DesktopTray
	readonly desktopThemeFacade: DesktopThemeFacade
	readonly credentialsEncryption: NativeCredentialsFacade
}
const tfs = new TempFs(fs, electron, cryptoFns)
const desktopUtils = new DesktopUtils(process.argv, tfs, electron)
// Argon2 is already built for the web part, we don't need to have another copy.
const loadArgon2 = async () => {
	const wasmSourcePath = path.join(electron.app.getAppPath(), "argon2.wasm")
	const wasmSource: Buffer = await fs.promises.readFile(wasmSourcePath)
	const { exports } = (await WebAssembly.instantiate(wasmSource)).instance
	return exports as unknown as Argon2IDExports
}
const desktopCrypto = new DesktopNativeCryptoFacade(fs, cryptoFns, tfs, loadArgon2())
const opts = {
	registerAsMailHandler: process.argv.some((arg) => arg === "-r"),
	unregisterAsMailHandler: process.argv.some((arg) => arg === "-u"),
	wasAutoLaunched: process.platform !== "darwin" ? process.argv.some((arg) => arg === "-a") : app.getLoginItemSettings().wasOpenedAtLogin,
}

// In windows we require elevated permissions in order to be able to register/deregister as a mailto handler, since it requires registry
// modifications. If we don't have admin rights, apparently the easiest way to get them is just to spin up a new instance of the app
// with admin privileges, and then call DesktopUtils.[un]registerAsMailHandler from that instance.
// Tutanota isn't a CLI app, so while this functionality is technically available to users, we don't publicise it as such
if (opts.registerAsMailHandler && opts.unregisterAsMailHandler) {
	console.log("Incompatible options '-r' and '-u'")
	app.exit(1)
} else if (opts.registerAsMailHandler) {
	//register as mailto handler, then quit
	desktopUtils
		.doRegisterMailtoOnWin32WithCurrentUser()
		.then(() => app.exit(0))
		.catch((e) => {
			log.error("there was a problem with registering as default mail app:", e)
			app.exit(1)
		})
} else if (opts.unregisterAsMailHandler) {
	//unregister as mailto handler, then quit
	desktopUtils
		.doUnregisterMailtoOnWin32WithCurrentUser()
		.then(() => app.exit(0))
		.catch((e) => {
			log.error("there was a problem with unregistering as default mail app:", e)
			app.exit(1)
		})
} else {
	createComponents().then(startupInstance)
}

async function createComponents(): Promise<Components> {
	const en = (await import("../../mail-app/translations/en.js")).default
	lang.init(en)
	preselectGnomeLibsecret(electron)
	const secretStorage = new SafeStorageSecretStorage(electron, fs, path)
	const keyStoreFacade = new DesktopKeyStoreFacade(secretStorage, desktopCrypto)
	const configMigrator = new DesktopConfigMigrator(desktopCrypto, keyStoreFacade, electron)
	const conf = new DesktopConfig(configMigrator, keyStoreFacade, desktopCrypto)

	// Fire config loading, dont wait for it
	conf.init(getConfigFile(app.getAppPath(), "package.json", fs), getConfigFile(app.getPath("userData"), "conf.json", fs)).catch((e) => {
		console.error("Could not load config", e)
		process.exit(1)
	})

	// We will eventually need to get the app icon and make a notification factory, though.
	// LazyLoaded is fine for this, since it will likely be done loading by the time any of these need to be made.
	const appIcon = new LazyLoaded(async () => {
		const iconName = await conf.getConst(BuildConfigKey.iconName)
		return desktopUtils.getIconByName(iconName)
	})
	const notificationFactory = new LazyLoaded(() => createNotificationFactory(conf, app))

	const desktopNet = new DesktopNetworkClient()
	const sock = new Socketeer(net, app)
	const tray = new DesktopTray(conf)
	const notifier = new DesktopNotifier(tray, notificationFactory)

	console.log("registering for tuta protocol", process.execPath, app.getAppPath())
	app.setAsDefaultProtocolClient("tuta", process.execPath, [app.getAppPath()])

	const dateProvider = new DefaultDateProvider()
	const clientModelInfo = ClientModelInfo.getInstance()
	// We need a custom instance pipeline for everything native as we only process them with the client type model
	// When upgrading things in SseFacade and AlarmStorage, we need to deprecate the old clients potentially
	const nativeInstancePipeline = new InstancePipeline(
		clientModelInfo.resolveClientTypeReference.bind(clientModelInfo),
		clientModelInfo.resolveClientTypeReference.bind(clientModelInfo),
	)
	const sseStorage = new SseStorage(conf)
	const alarmStorage = new DesktopAlarmStorage(conf, desktopCrypto, keyStoreFacade, nativeInstancePipeline, clientModelInfo)
	const updater = new ElectronUpdater(conf, notifier, desktopCrypto, app, appIcon, new UpdaterWrapper(), fs)
	const shortcutManager = new LocalShortcutManager()
	const credentialsDb = new DesktopCredentialsStorage(makeDbPath("credentials"), app)
	const appPassHandler = new AppPassHandler(desktopCrypto, conf, loadArgon2(), lang, async () => {
		const last = await wm.getLastFocused(true)
		return last.commonNativeFacade
	})
	const keychainManager = new KeychainEncryption(appPassHandler, desktopCrypto, keyStoreFacade)
	const nativeCredentialsFacade = new DesktopNativeCredentialsFacade(desktopCrypto, credentialsDb, keychainManager)

	updater.setUpdateDownloadedListener(() => {
		for (let applicationWindow of wm.getAll()) {
			applicationWindow.desktopFacade.appUpdateDownloaded()
		}
	})

	/** functions to create and delete the physical db file on disk */
	const offlineDbFactory: OfflineDbFactory = {
		async create(userId: string, key: Uint8Array, retry: boolean = true): Promise<SqlCipherFacade> {
			const db = new WorkerSqlCipher(makeDbPath(`offline_${userId}`), true)
			try {
				await db.openDb(userId, key)
			} catch (e) {
				if (!retry) throw e
				log.warn("retrying to create db", userId, e)
				await this.delete(userId)
				return this.create(userId, key, false)
			}
			return db
		},
		async delete(userId: string): Promise<void> {
			log.debug("deleting db for", userId)
			const dbPath = makeDbPath(`offline_${userId}`)
			// force to suppress ENOENT which is not a problem.
			// maxRetries should reduce EBUSY
			await fs.promises.rm(dbPath, { maxRetries: 3, force: true })
		},
	}

	const offlineDbRefCounter = new OfflineDbRefCounter(offlineDbFactory)

	electron.app.on("session-created", async (session) => {
		const updateUrl = await conf.getConst(BuildConfigKey.updateUrl)
		const dictUrl = updateUrl ? updateUrl : "https://app.tuta.com/desktop/"
		manageDownloadsForSession(session, dictUrl)
	})

	const desktopExportLock = new DesktopExportLock()

	const wm = new WindowManager(conf, tray, notifier, electron, shortcutManager, appIcon)
	const themeFacade = new DesktopThemeFacade(conf, wm, electron.nativeTheme)
	const schedulerImpl = new SchedulerImpl(dateProvider, global, global)
	const alarmScheduler = new AlarmScheduler(dateProvider, schedulerImpl)
	const desktopAlarmScheduler = new DesktopAlarmScheduler(wm, notifier, alarmStorage, alarmScheduler)
	desktopAlarmScheduler.rescheduleAll().catch((e) => {
		log.error("Could not reschedule alarms", e)
		return pushFacade.resetStoredState()
	})
	const webDialogController = new WebDialogController()

	// Insert or remove the icon when the 'run in background' setting is changed
	conf.on(DesktopConfigKey.runAsTrayApp, async (value: boolean) => {
		if (value) {
			await tray.create()
			await tray.update(notifier)
		} else {
			tray.destroy()
		}
	})

	tray.setWindowManager(wm)

	const suspensionAwareFetch = makeSuspensionAwareFetch(new SuspensionHandler(globalThis, noOp))

	const notificationHandler = new TutaNotificationHandler(
		wm,
		nativeCredentialsFacade,
		sseStorage,
		notifier,
		desktopAlarmScheduler,
		alarmStorage,
		lang,
		suspensionAwareFetch,
		app.getVersion(),
		nativeInstancePipeline,
		clientModelInfo,
	)
	const sseClient = new SseClient(desktopNet, new DesktopSseDelay(), schedulerImpl)
	const sse = new TutaSseFacade(
		sseStorage,
		notificationHandler,
		sseClient,
		alarmStorage,
		desktopAlarmScheduler,
		app.getVersion(),
		suspensionAwareFetch,
		dateProvider,
		nativeInstancePipeline,
		clientModelInfo,
	)
	const commandExecutor = new CommandExecutor(child_process)

	// It should be ok to await this, all we are waiting for is dynamic imports
	const integrator = await getDesktopIntegratorForPlatform(
		electron,
		fs,
		child_process,
		new LazyLoaded(async () => {
			const { WindowsRegistryFacade } = await import("./integration/WindowsRegistryFacade.js")
			return new WindowsRegistryFacade(commandExecutor)
		}),
	)

	const dragIcons = {
		eml: desktopUtils.getIconByName("eml.png"),
		msg: desktopUtils.getIconByName("msg.png"),
	}
	const pushFacade = new DesktopNativePushFacade(sse, desktopAlarmScheduler, alarmStorage, sseStorage, nativeInstancePipeline)
	const settingsFacade = new DesktopSettingsFacade(conf, desktopUtils, integrator, updater, lang)
	const desktopImportFacade = new DesktopMailImportFacade(electron, notifier, lang)

	const dispatcherFactory: DispatcherFactory = (window: ApplicationWindow) => {
		// @ts-ignore
		const logger: Logger = global.logger
		const desktopCommonSystemFacade = new DesktopCommonSystemFacade(window, logger, desktopNet)
		const sqlCipherFacade = new PerWindowSqlCipherFacade(offlineDbRefCounter)
		const mailboxExportPersistence = new MailboxExportPersistence(conf)
		const windowCleanup: WindowCleanup = {
			async onCleanup(userId: Id): Promise<void> {
				desktopExportLock.unlock(userId)
				log.debug(TAG, `closing offline db for userId ${userId}`)
				await sqlCipherFacade.closeDb()
			},
		}
		const dispatcher = new DesktopGlobalDispatcher(
			desktopCommonSystemFacade,
			new DesktopDesktopSystemFacade(wm, window, sock),
			new DesktopExportFacade(tfs, electron, conf, window, dragIcons, mailboxExportPersistence, fs, dateProvider, desktopExportLock),
			new DesktopExternalCalendarFacade(electron.app.userAgentFallback),
			new DesktopFileFacade(window, conf, dateProvider, customFetch, electron, tfs, fs, path),
			new DesktopInterWindowEventFacade(window, wm),
			nativeCredentialsFacade,
			desktopCrypto,
			desktopImportFacade,
			pushFacade,
			new DesktopSearchTextInAppFacade(window),
			settingsFacade,
			sqlCipherFacade,
			themeFacade,
			new DesktopWebauthnFacade(window, webDialogController),
		)
		return { desktopCommonSystemFacade, windowCleanup, dispatcher }
	}

	const facadeHandlerFactory = (window: ApplicationWindow): FacadeHandler => {
		return exposeLocalDelayed<DelayedImpls<ExposedNativeInterface>, "facade">({
			postLoginActions: lazyMemoized(async () => new DesktopPostLoginActions(wm, err, notifier, window.id)),
		})
	}

	const remoteBridge = new RemoteBridge(dispatcherFactory, facadeHandlerFactory)

	const contextMenu = new DesktopContextMenu(electron, wm)
	wm.lateInit(contextMenu, themeFacade, remoteBridge)
	log.debug("version:  ", app.getVersion())
	return {
		wm,
		tfs,
		sse,
		conf,
		keyStoreFacade: keyStoreFacade,
		sock,
		notifier,
		updater,
		integrator,
		tray,
		desktopThemeFacade: themeFacade,
		credentialsEncryption: nativeCredentialsFacade,
	}
}

async function startupInstance(components: Components) {
	const { wm, sse, tfs, notifier } = components
	if (!(await desktopUtils.cleanupOldInstance())) return
	sse.connect().catch((e) => log.warn("unable to start sse client", e))
	// The second-instance event fires when we call app.requestSingleInstanceLock inside DesktopUtils.makeSingleInstance
	app.on("second-instance", async (_ev, args) => {
		desktopUtils.handleSecondInstance(wm, notifier, args)
	})
	app.on("open-url", (e, url) => {
		// MacOS mailto handling
		e.preventDefault()

		if (url.startsWith("mailto:")) {
			app.whenReady().then(() => desktopUtils.handleMailto(wm, url))
		}
	})
	app.on("will-quit", () => tfs.clear())
	await app.whenReady()
	await onAppReady(components)
}

async function onAppReady(components: Components) {
	const { wm, keyStoreFacade, conf } = components
	// We await for it to not open any windows on top of keychain dialogs
	await unlockDeviceKeychain(keyStoreFacade, wm, conf)
	app.on("window-all-closed", async () => {
		if (!(await conf.getVar(DesktopConfigKey.runAsTrayApp))) {
			app.quit()
		}
	})
	err.init(wm)
	// only create a window if there are none (may already have created one, e.g. for mailto handling)
	// also don't show the window when we're an autolaunched tray app
	const w = await wm.getLastFocused(!((await conf.getVar(DesktopConfigKey.runAsTrayApp)) && opts.wasAutoLaunched))
	log.debug("default mailto handler:", app.isDefaultProtocolClient("mailto"))
	if (process.env.ELECTRON_START_WITH_DEV_TOOLS === "true") {
		w._browserWindow.webContents.openDevTools({ mode: "detach" })
	}
	await main(components)
}

async function main(components: Components) {
	const { tray, notifier, sock, wm, updater, integrator, desktopThemeFacade } = components
	tray.update(notifier)

	desktopThemeFacade.init()

	if (process.argv.indexOf("-s") !== -1) {
		sock.startServer()
	}

	log.debug("Webapp ready")
	app.on("activate", () => {
		// MacOs
		// this is fired for almost every interaction and on launch
		// so set listener later to avoid the call on launch
		wm.getLastFocused(true)
		tray.clearBadge()
	})
	notifier.start(2000)
	updater.start()
	integrator.runIntegration(wm)
	await desktopUtils.handleMailto(components.wm)
}

function manageDownloadsForSession(session: Session, dictUrl: string) {
	dictUrl = dictUrl + "/dictionaries/"
	log.debug(TAG, "getting dictionaries from:", dictUrl)
	session.setSpellCheckerDictionaryDownloadURL(dictUrl)
	session
		.removeAllListeners("spellcheck-dictionary-download-failure")
		.on("spellcheck-dictionary-initialized", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-initialized", lcode))
		.on("spellcheck-dictionary-download-begin", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-download-begin", lcode))
		.on("spellcheck-dictionary-download-success", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-download-success", lcode))
		.on("spellcheck-dictionary-download-failure", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-download-failure", lcode))
}

async function unlockDeviceKeychain(keyStoreFacade: DesktopKeyStoreFacade, wm: WindowManager, conf: DesktopConfig) {
	await keyStoreFacade.getDeviceKey().catch(async () => {
		const { response } = await electron.dialog.showMessageBox({
			type: "error",
			title: "Tuta Mail",
			message: lang.getTranslation("secretStorageError_msg", { "{url}": InfoLink.SecretStorage }).text,
			buttons: [
				lang.getTranslation("continue_action").text,
				lang.getTranslation("clearLocalData_action").text,
				lang.getTranslation("restart_action").text,
			],
			defaultId: 2,
			cancelId: 0,
		})
		switch (response) {
			case 0:
				break
			case 1:
				app.relaunch()
				for (const window of wm.getAll()) {
					log.debug("Closing window ", window.id)
					// ideally we would destroy the window but it leads to obscure segfaults
					await window.close()
				}

				log.debug("Deleting conf")
				await conf.delete()
				log.debug("Invalidating keychain")
				await keyStoreFacade.invalidateKeychain()
				log.debug("Quitting app")
				app.quit()
				log.debug("App exited")
				break
			case 2:
				app.relaunch()
				app.quit()
				break
			default:
				throw new ProgrammingError("Invalid choice")
		}
	})
}
