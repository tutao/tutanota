// @flow
import {mp} from './DesktopMonkeyPatch.js'
import {err} from './DesktopErrorHandler.js'
import {DesktopConfig} from './config/DesktopConfig'
import * as electron from 'electron'
import {app} from 'electron'
import DesktopUtils from './DesktopUtils.js'
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
import desktopUtils from "./DesktopUtils"
import fs from "fs"
import {DesktopIntegrator} from "./integration/DesktopIntegrator"
import net from "net"
import child_process from "child_process"
import {LocalShortcutManager} from "./electron-localshortcut/LocalShortcut"
import {cryptoFns} from "./CryptoFns"
import {DesktopConfigMigrator} from "./config/migrations/DesktopConfigMigrator"
import {DeviceKeyProviderImpl} from "./DeviceKeyProviderImpl"
import {AlarmSchedulerImpl} from "../calendar/date/AlarmScheduler"
import {SchedulerImpl} from "../misc/Scheduler"
import {DateProviderImpl} from "../calendar/date/CalendarUtils"

mp()

lang.init(en)
const secretStorage = new KeytarSecretStorage()
const desktopCrypto = new DesktopCryptoFacade(fs, cryptoFns)
const deviceKeyProvider = new DeviceKeyProviderImpl(secretStorage, desktopCrypto)
const configMigrator = new DesktopConfigMigrator(desktopCrypto, deviceKeyProvider)
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
const integrator = new DesktopIntegrator(electron, fs, child_process, () => import("winreg"))
const ipc = new IPC(conf, notifier, sse, wm, sock, alarmStorage, desktopCrypto, dl, updater, electron, desktopUtils, err, integrator, desktopAlarmScheduler)
wm.setIPC(ipc)

conf.getConst("appUserModelId")
    .then((appUserModelId) => {app.setAppUserModelId(appUserModelId)})
log.debug("version:  ", app.getVersion())

let wasAutolaunched = process.platform !== 'darwin'
	? process.argv.indexOf("-a") !== -1
	: app.getLoginItemSettings().wasOpenedAtLogin


//check if there are any cli parameters that should be handled without a window
if (process.argv.indexOf("-r") !== -1) {
	//register as mailto handler, then quit
	DesktopUtils.registerAsMailtoHandler(false)
	            .then(() => app.exit(0))
	            .catch(() => app.exit(1))
} else if (process.argv.indexOf("-u") !== -1) {
	//unregister as mailto handler, then quit
	DesktopUtils.unregisterAsMailtoHandler(false)
	            .then(() => app.exit(0))
	            .catch(() => app.exit(1))
} else {
	startupInstance()
}

function startupInstance() {
	// Delete the temp directory on startup, because we may not always be able to do it on shutdown
	dl.deleteTutanotaTempDirectory()

	DesktopUtils.makeSingleInstance().then(willStay => {
		if (!willStay) return
		sse.start().catch(e => log.warn("unable to start sse client", e))

		app.on('second-instance', (ev, args) => {
			DesktopUtils.singleInstanceLockOverridden().then(overridden => {
				if (overridden) {
					app.quit()
				} else {
					if (wm.getAll().length === 0) {
						wm.newWindow(true)
					} else {
						wm.getAll().forEach(w => w.show())
					}
					handleArgv(args)
				}
			})
		}).on('open-url', (e, url) => {
			// MacOS mailto handling
			e.preventDefault()
			if (!url.startsWith('mailto:')) {
				// do nothing if this is not a mailto: url
			} else {
				DesktopUtils.callWhenReady(() => handleMailto(url))
			}
		}).on('will-quit', (e) => {
			dl.deleteTutanotaTempDirectory()
		})
		// it takes a short while to get here,
		// the event may already have fired
		DesktopUtils.callWhenReady(() => {onAppReady()})
	})
}

async function onAppReady() {
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
	const w = await wm.getLastFocused(!(await conf.getVar('runAsTrayApp') && wasAutolaunched))
	log.debug("default mailto handler:", app.isDefaultProtocolClient("mailto"))
	ipc.initialized(w.id)
	   .then(main)
}

function main() {
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
	handleArgv(process.argv)
}

function handleArgv(argv: string[]) {
	const mailtoUrl = argv.find((arg) => arg.startsWith('mailto'))
	if (mailtoUrl) {
		argv.splice(argv.indexOf(mailtoUrl), 1)
		handleMailto(mailtoUrl)
	}
}

async function handleMailto(mailtoArg?: string) {
	if (mailtoArg) {
		/*[filesUris, text, addresses, subject, mailToUrl]*/
		const w = await wm.getLastFocused(true)
		ipc.sendRequest(w.id, 'createMailEditor', [[], "", "", "", mailtoArg])
	}
}