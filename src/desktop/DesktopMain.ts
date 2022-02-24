import {mp} from "./DesktopMonkeyPatch"
import {err} from "./DesktopErrorHandler"
import {DesktopConfig} from "./config/DesktopConfig"
import * as electron from "electron"
import {app} from "electron"
import {DesktopUtils} from "./DesktopUtils"
import {IPC} from "./IPC"
import {WindowManager} from "./DesktopWindowManager"
import {DesktopNotifier} from "./DesktopNotifier"
import {ElectronUpdater} from "./ElectronUpdater"
import {DesktopSseClient} from "./sse/DesktopSseClient"
import {Socketeer} from "./Socketeer"
import {DesktopAlarmStorage} from "./sse/DesktopAlarmStorage"
import {DesktopAlarmScheduler} from "./sse/DesktopAlarmScheduler"
import {lang} from "../misc/LanguageViewModel"
import en from "../translations/en"
import {DesktopNetworkClient} from "./DesktopNetworkClient"
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import {DesktopDownloadManager} from "./DesktopDownloadManager"
import {DesktopTray} from "./tray/DesktopTray"
import {log} from "./DesktopLog"
import {UpdaterWrapperImpl} from "./UpdaterWrapper"
import {ElectronNotificationFactory} from "./NotificatonFactory"
import {KeytarSecretStorage} from "./sse/SecretStorage"
import fs from "fs"
import {DesktopIntegrator, getDesktopIntegratorForPlatform} from "./integration/DesktopIntegrator"
import net from "net"
import child_process from "child_process"
import {LocalShortcutManager} from "./electron-localshortcut/LocalShortcut"
import {cryptoFns} from "./CryptoFns"
import {DesktopConfigMigrator} from "./config/migrations/DesktopConfigMigrator"
import type {DesktopKeyStoreFacade} from "./KeyStoreFacadeImpl"
import {KeyStoreFacadeImpl} from "./KeyStoreFacadeImpl"
import {AlarmSchedulerImpl} from "../calendar/date/AlarmScheduler"
import {SchedulerImpl} from "../misc/Scheduler"
import {DateProviderImpl} from "../calendar/date/CalendarUtils"
import {ThemeManager} from "./ThemeManager"
import {BuildConfigKey, DesktopConfigKey} from "./config/ConfigKeys";
import {DektopCredentialsEncryption, DesktopCredentialsEncryptionImpl} from "./credentials/DektopCredentialsEncryption"
import {DesktopWebauthn} from "./2fa/DesktopWebauthn.js"
import {webauthnIpcHandler, WebDialogController} from "./WebDialog.js"
import {ExposedNativeInterface} from "../native/common/NativeInterface.js"
import path from "path"
import {OfflineDbFacade} from "./db/OfflineDbFacade"
import {OfflineDb} from "./db/OfflineDb"

/**
 * Should be injected during build time.
 * See sqliteNativeBannerPlugin.
 */
declare const buildOptions: {
	readonly sqliteNativePath: string
}

mp()
type Components = {
	readonly wm: WindowManager
	readonly ipc: IPC
	readonly dl: DesktopDownloadManager
	readonly sse: DesktopSseClient
	readonly conf: DesktopConfig
	readonly keyStoreFacade: DesktopKeyStoreFacade
	readonly notifier: DesktopNotifier
	readonly sock: Socketeer
	readonly updater: ElectronUpdater
	readonly integrator: DesktopIntegrator
	readonly tray: DesktopTray
	readonly themeManager: ThemeManager
	readonly credentialsEncryption: DektopCredentialsEncryption
}
const desktopCrypto = new DesktopCryptoFacade(fs, cryptoFns)
const desktopUtils = new DesktopUtils(fs, electron, desktopCrypto)
const opts = {
	registerAsMailHandler: process.argv.some(arg => arg === "-r"),
	unregisterAsMailHandler: process.argv.some(arg => arg === "-u"),
	mailTo: findMailToUrlInArgv(process.argv),
	wasAutoLaunched: process.platform !== "darwin" ? process.argv.some(arg => arg === "-a") : app.getLoginItemSettings().wasOpenedAtLogin,
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
	desktopUtils.doRegisterMailtoOnWin32WithCurrentUser()
				.then(() => app.exit(0))
				.catch(e => {
					log.error("there was a problem with registering as default mail app:", e)
					app.exit(1)
				})
} else if (opts.unregisterAsMailHandler) {
	//unregister as mailto handler, then quit
	desktopUtils.doUnregisterMailtoOnWin32WithCurrentUser()
				.then(() => app.exit(0))
				.catch(e => {
					log.error("there was a problem with unregistering as default mail app:", e)
					app.exit(1)
				})
} else {
	createComponents().then(startupInstance)
}

async function createComponents(): Promise<Components> {
	lang.init(en)
	const secretStorage = new KeytarSecretStorage()
	const keyStoreFacade = new KeyStoreFacadeImpl(secretStorage, desktopCrypto)
	const configMigrator = new DesktopConfigMigrator(desktopCrypto, keyStoreFacade, electron)
	const conf = new DesktopConfig(app, configMigrator, keyStoreFacade, desktopCrypto)
	// Fire config loading, dont wait for it
	conf.init().catch(e => {
		console.error("Could not load config", e)
		process.exit(1)
	})
	const desktopNet = new DesktopNetworkClient()
	const sock = new Socketeer(net, app)
	const tray = new DesktopTray(conf)
	const notifier = new DesktopNotifier(tray, new ElectronNotificationFactory())
	const dateProvider = new DateProviderImpl()
	const dl = new DesktopDownloadManager(conf, desktopNet, desktopUtils, dateProvider, fs, electron)
	const alarmStorage = new DesktopAlarmStorage(conf, desktopCrypto, keyStoreFacade)
	const updater = new ElectronUpdater(conf, notifier, desktopCrypto, app, tray, new UpdaterWrapperImpl())
	const shortcutManager = new LocalShortcutManager()
	const themeManager = new ThemeManager(conf)
	const credentialsEncryption = new DesktopCredentialsEncryptionImpl(keyStoreFacade, desktopCrypto)
	const wm = new WindowManager(conf, tray, notifier, electron, shortcutManager, dl, themeManager)
	const alarmScheduler = new AlarmSchedulerImpl(dateProvider, new SchedulerImpl(dateProvider, global))
	const desktopAlarmScheduler = new DesktopAlarmScheduler(wm, notifier, alarmStorage, desktopCrypto, alarmScheduler)
	desktopAlarmScheduler.rescheduleAll().catch(e => {
		log.error("Could not reschedule alarms", e)
		return sse.resetStoredState()
	})
	const webDialogController = new WebDialogController(webauthnIpcHandler)

	tray.setWindowManager(wm)
	const sse = new DesktopSseClient(app, conf, notifier, wm, desktopAlarmScheduler, desktopNet, desktopCrypto, alarmStorage, lang)
	// It should be ok to await this, all we are waiting for is dynamic imports
	const integrator = await getDesktopIntegratorForPlatform(electron, fs, child_process, () => import("winreg"))

	const offlineDbFactory = async (userId: Id) => {
		const db = new OfflineDb(buildOptions.sqliteNativePath)
		const dbPath = path.join(app.getPath("userData"), `offline_${userId}.sqlite`)
		await db.init(dbPath)
		return db
	}

	const offlineDbFacade = new OfflineDbFacade(offlineDbFactory)

	const exposedInterfaceFactory = (windowId: number): ExposedNativeInterface => {
		return {
			webauthn: new DesktopWebauthn(windowId, webDialogController),
			offlineDbFacade: offlineDbFacade
		}
	}

	const ipc = new IPC(
		conf,
		notifier,
		sse,
		wm,
		sock,
		alarmStorage,
		desktopCrypto,
		dl,
		updater,
		electron,
		desktopUtils,
		err,
		integrator,
		desktopAlarmScheduler,
		themeManager,
		credentialsEncryption,
		exposedInterfaceFactory
	)
	wm.setIPC(ipc)
	conf.getConst(BuildConfigKey.appUserModelId).then(appUserModelId => {
		app.setAppUserModelId(appUserModelId)
	})
	log.debug("version:  ", app.getVersion())
	return {
		wm,
		ipc,
		dl,
		sse,
		conf,
		keyStoreFacade: keyStoreFacade,
		sock,
		notifier,
		updater,
		integrator,
		tray,
		themeManager,
		credentialsEncryption
	}
}

async function startupInstance(components: Components) {
	const {dl, wm, sse} = components
	if (!(await desktopUtils.makeSingleInstance())) return
	// Delete the temp directory on startup because we may not always be able to do it on shutdown.
	//
	// don't do it if:
	// * we're a second instance, the main instance may be using the tmp
	// * there's a mailto link, attachments may be located in the tmp
	if (opts.mailTo == null) dl.deleteTutanotaTempDirectory()
	sse.start().catch(e => log.warn("unable to start sse client", e))
	// The second-instance event fires when we call app.requestSingleInstanceLock inside of DesktopUtils.makeSingleInstance
	app.on("second-instance", async (ev, args) => {
		if (await desktopUtils.singleInstanceLockOverridden()) {
			app.quit()
		} else {
			if (wm.getAll().length === 0) {
				await wm.newWindow(true)
			} else {
				wm.getAll().forEach(w => w.show())
			}

			await handleMailto(findMailToUrlInArgv(args), components)
		}
	})
	   .on("open-url", (e, url) => {
		   // MacOS mailto handling
		   e.preventDefault()

		   if (url.startsWith("mailto:")) {
			   app.whenReady().then(() => handleMailto(url, components))
		   }
	   })
	   .on("will-quit", e => {
		   dl.deleteTutanotaTempDirectory()
	   })
	app.whenReady().then(() => onAppReady(components))
}

async function onAppReady(components: Components) {
	const {ipc, wm, keyStoreFacade, conf} = components
	keyStoreFacade.getDeviceKey().catch(() => {
		electron.dialog.showErrorBox("Could not access secret storage", "Please see the FAQ at tutanota.com/faq/#secretstorage")
	})
	app.on("window-all-closed", async () => {
		if (!(await conf.getVar(DesktopConfigKey.runAsTrayApp))) {
			app.quit()
		}
	})
	err.init(wm, ipc)
	// only create a window if there are none (may already have created one, e.g. for mailto handling)
	// also don't show the window when we're an autolaunched tray app
	const w = await wm.getLastFocused(!((await conf.getVar(DesktopConfigKey.runAsTrayApp)) && opts.wasAutoLaunched))
	log.debug("default mailto handler:", app.isDefaultProtocolClient("mailto"))
	ipc.initialized(w.id).then(() => main(components))
}

async function main(components: Components) {
	const {tray, notifier, sock, wm, updater, integrator} = components
	tray.update(notifier)

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

	if (opts.mailTo) {
		await handleMailto(opts.mailTo, components)
	}
}

function findMailToUrlInArgv(argv: string[]): string | null {
	return argv.find(arg => arg.startsWith("mailto")) ?? null
}

async function handleMailto(mailtoArg: string | null, {wm, ipc}: Components) {
	if (mailtoArg) {
		/*[filesUris, text, addresses, subject, mailToUrl]*/
		const w = await wm.getLastFocused(true)
		return ipc.sendRequest(w.id, "createMailEditor", [[], "", "", "", mailtoArg])
	}
}