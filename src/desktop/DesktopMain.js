// @flow
import {mp} from './DesktopMonkeyPatch.js'
import {err} from './DesktopErrorHandler.js'
import {DesktopConfig} from './config/DesktopConfig'
import * as electron from 'electron'
import {app} from 'electron'
import {DesktopUtils} from './DesktopUtils.js'
import {IPC} from './IPC.js'
import {WindowManager} from "./DesktopWindowManager"
import {DesktopNotifier} from "./DesktopNotifier"
import {ElectronUpdater} from "./ElectronUpdater"
import {DesktopSseClient} from "./sse/DesktopSseClient"
import {Socketeer} from "./Socketeer"
import {DesktopAlarmStorage} from "./sse/DesktopAlarmStorage"
import {DesktopAlarmScheduler} from "./sse/DesktopAlarmScheduler"
import {lang} from "../misc/LanguageViewModel"
// $FlowIgnore[untyped-import]
import en from "../translations/en"
import {DesktopNetworkClient} from "./DesktopNetworkClient"
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import {DesktopDownloadManager} from "./DesktopDownloadManager"
import {DesktopTray} from "./tray/DesktopTray"
import {log} from "./DesktopLog";
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
import type {DeviceKeyProvider} from "./DeviceKeyProviderImpl"
import {DeviceKeyProviderImpl} from "./DeviceKeyProviderImpl"
import {AlarmSchedulerImpl} from "../calendar/date/AlarmScheduler"
import {SchedulerImpl} from "../misc/Scheduler"
import {DateProviderImpl} from "../calendar/date/CalendarUtils"

mp()

type Components = {
	+wm: WindowManager,
	+ipc: IPC,
	+dl: DesktopDownloadManager,
	+sse: DesktopSseClient,
	+conf: DesktopConfig,
	+deviceKeyProvider: DeviceKeyProvider,
	+notifier: DesktopNotifier,
	+sock: Socketeer,
	+updater: ElectronUpdater,
	+integrator: DesktopIntegrator,
	+tray: DesktopTray,
}

const desktopCrypto = new DesktopCryptoFacade(fs, cryptoFns)
const desktopUtils = new DesktopUtils(fs, desktopCrypto)

const opts = {
	registerAsMailHandler: process.argv.some(arg => arg === "-r"),
	unregisterAsMailHandler: process.argv.some(arg => arg === "-u"),
	mailTo: findMailToUrlInArgv(process.argv),
	wasAutoLaunched: process.platform !== 'darwin'
		? process.argv.some(arg => arg === "-a")
		: app.getLoginItemSettings().wasOpenedAtLogin
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
	desktopUtils.registerAsMailtoHandler(false)
	            .then(() => app.exit(0))
	            .catch(e => {
		            log.error("there was a problem with registering as default mail app:", e)
		            app.exit(1)
	            })
} else if (opts.unregisterAsMailHandler) {
	//unregister as mailto handler, then quit
	desktopUtils.unregisterAsMailtoHandler(false)
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
	const deviceKeyProvider = new DeviceKeyProviderImpl(secretStorage, desktopCrypto)
	const configMigrator = new DesktopConfigMigrator(desktopCrypto, deviceKeyProvider, electron)
	const conf = new DesktopConfig(app, configMigrator, deviceKeyProvider, desktopCrypto)
	// Fire config loading, dont wait for it
	conf.init().catch((e) => {
		console.error("Could not load config", e)
		process.exit(1)
	})
	const desktopNet = new DesktopNetworkClient()
	const sock = new Socketeer(net, app)
	const tray = new DesktopTray(conf)
	const notifier = new DesktopNotifier(tray, new ElectronNotificationFactory())
	const dl = new DesktopDownloadManager(conf, desktopNet, desktopUtils, fs, electron)
	const alarmStorage = new DesktopAlarmStorage(conf, desktopCrypto, deviceKeyProvider)
	const updater = new ElectronUpdater(conf, notifier, desktopCrypto, app, tray, new UpdaterWrapperImpl())
	const shortcutManager = new LocalShortcutManager()
	const wm = new WindowManager(conf, tray, notifier, electron, shortcutManager, dl)
	const dateProvider = new DateProviderImpl()
	const alarmScheduler = new AlarmSchedulerImpl(dateProvider, new SchedulerImpl(dateProvider, global))
	const desktopAlarmScheduler = new DesktopAlarmScheduler(wm, notifier, alarmStorage, desktopCrypto, alarmScheduler)
	desktopAlarmScheduler.rescheduleAll()

	tray.setWindowManager(wm)
	const sse = new DesktopSseClient(app, conf, notifier, wm, desktopAlarmScheduler, desktopNet, desktopCrypto, alarmStorage, lang)
	// It should be ok to await this, all we are waiting for is dynamic imports
	const integrator = await getDesktopIntegratorForPlatform(electron, fs, child_process, () => import("winreg"))
	const ipc = new IPC(conf, notifier, sse, wm, sock, alarmStorage, desktopCrypto, dl, updater, electron, desktopUtils, err, integrator, desktopAlarmScheduler)
	wm.setIPC(ipc)

	conf.getConst("appUserModelId")
	    .then((appUserModelId) => {app.setAppUserModelId(appUserModelId)})
	log.debug("version:  ", app.getVersion())

	return {
		wm,
		ipc,
		dl,
		sse,
		conf,
		deviceKeyProvider,
		sock,
		notifier,
		updater,
		integrator,
		tray,
	}
}

async function startupInstance(components: Components) {
	const {dl, wm, sse} = components
	// Delete the temp directory on startup, because we may not always be able to do it on shutdown
	dl.deleteTutanotaTempDirectory()

	if (!await desktopUtils.makeSingleInstance()) return

	sse.start().catch(e => log.warn("unable to start sse client", e))

	app.on('second-instance', async (ev, args) => {
		if (await desktopUtils.singleInstanceLockOverridden()) {
			app.quit()
		} else {
			if (wm.getAll().length === 0) {
				wm.newWindow(true)
			} else {
				wm.getAll().forEach(w => w.show())
			}
			handleMailto(findMailToUrlInArgv(args), components)
		}
	}).on('open-url', (e, url) => {
		// MacOS mailto handling
		e.preventDefault()
		if (url.startsWith('mailto:')) {
			desktopUtils.callWhenReady(() => handleMailto(url, components))
		}
	}).on('will-quit', (e) => {
		dl.deleteTutanotaTempDirectory()
	})
	// it takes a short while to get here,
	// the event may already have fired
	desktopUtils.callWhenReady(() => onAppReady(components))
}

async function onAppReady(components: Components) {
	const {ipc, wm, deviceKeyProvider, conf} = components
	deviceKeyProvider.getDeviceKey().catch(() => {
		electron.dialog.showErrorBox("Could not access secret storage", "Please see the FAQ at tutanota.com/faq/#secretstorage")
	})

	app.on('window-all-closed', async () => {
		if (!(await conf.getVar('runAsTrayApp'))) {
			app.quit()
		}
	})

	err.init(wm, ipc)
	// only create a window if there are none (may already have created one, e.g. for mailto handling)
	// also don't show the window when we're an autolaunched tray app
	const w = await wm.getLastFocused(!(await conf.getVar('runAsTrayApp') && opts.wasAutoLaunched))
	log.debug("default mailto handler:", app.isDefaultProtocolClient("mailto"))
	ipc.initialized(w.id).then(() => main(components))
}

function main(components: Components) {
	const {tray, notifier, sock, wm, updater, integrator} = components
	tray.update(notifier)
	if (process.argv.indexOf('-s') !== -1) {
		sock.startServer()
	}
	log.debug("Webapp ready")
	app.on('activate', () => {
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
		handleMailto(opts.mailTo, components)
	}
}

function findMailToUrlInArgv(argv: string[]): ?string {
	return argv.find((arg) => arg.startsWith('mailto'))
}

async function handleMailto(mailtoArg: ?string, {wm, ipc}: Components) {
	if (mailtoArg) {
		/*[filesUris, text, addresses, subject, mailToUrl]*/
		const w = await wm.getLastFocused(true)
		return ipc.sendRequest(w.id, 'createMailEditor', [[], "", "", "", mailtoArg])
	}
}
