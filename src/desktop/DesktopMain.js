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

mp()

lang.init(en)
const conf = new DesktopConfig(app)
const desktopNet = new DesktopNetworkClient()
const desktopCrypto = new DesktopCryptoFacade(fs, cryptoFns)
const sock = new Socketeer(net, app)
const tray = new DesktopTray(conf)
const notifier = new DesktopNotifier(tray, new ElectronNotificationFactory())
const dl = new DesktopDownloadManager(conf, desktopNet, desktopUtils, fs, electron)
const alarmStorage = new DesktopAlarmStorage(conf, desktopCrypto, new KeytarSecretStorage())
alarmStorage.init()
            .then(() => {
	            log.debug("alarm storage initialized")
            })
            .catch(e => {
	            console.warn("alarm storage failed to initialize:", e)
            })
const updater = new ElectronUpdater(conf, notifier, desktopCrypto, app, tray, new UpdaterWrapperImpl())
const shortcutManager = new LocalShortcutManager()
const wm = new WindowManager(conf, tray, notifier, electron, shortcutManager, dl)
const alarmScheduler = new DesktopAlarmScheduler(wm, notifier, alarmStorage, desktopCrypto)
alarmScheduler.rescheduleAll()

tray.setWindowManager(wm)
const sse = new DesktopSseClient(app, conf, notifier, wm, alarmScheduler, desktopNet, desktopCrypto, alarmStorage, lang)
const integrator = new DesktopIntegrator(electron, fs, child_process, () => import("winreg"))
const ipc = new IPC(conf, notifier, sse, wm, sock, alarmStorage, desktopCrypto, dl, updater, electron, desktopUtils, err, integrator, alarmScheduler)
wm.setIPC(ipc)

app.setAppUserModelId(conf.getConst("appUserModelId"))
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
		sse.start()
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
		DesktopUtils.callWhenReady(onAppReady)
	})
}

function onAppReady() {

	app.on('window-all-closed', () => {
		if (!conf.getVar('runAsTrayApp')) {
			app.quit()
		}
	})

	err.init(wm, ipc)
	// only create a window if there are none (may already have created one, e.g. for mailto handling)
	// also don't show the window when we're an autolaunched tray app
	const w = wm.getLastFocused(!(conf.getVar('runAsTrayApp') && wasAutolaunched))
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

function handleMailto(mailtoArg?: string) {
	if (mailtoArg) {
		/*[filesUris, text, addresses, subject, mailToUrl]*/
		const w = wm.getLastFocused(true)
		ipc.sendRequest(w.id, 'createMailEditor', [[], "", "", "", mailtoArg])
	}
}