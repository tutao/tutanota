// @flow
import {mp} from './DesktopMonkeyPatch.js'
import {err} from './DesktopErrorHandler.js'
import {DesktopConfigHandler} from './DesktopConfigHandler'
import {app} from 'electron'
import DesktopUtils from './DesktopUtils.js'
import {IPC} from './IPC.js'
import PreloadImports from './PreloadImports.js'
import {WindowManager} from "./DesktopWindowManager"
import {DesktopNotifier} from "./DesktopNotifier"
import {DesktopTray} from './DesktopTray.js'
import {ElectronUpdater} from "./ElectronUpdater"
import {DesktopSseClient} from "./sse/DesktopSseClient"
import {Socketeer} from "./Socketeer"
import {DesktopAlarmStorage} from "./sse/DesktopAlarmStorage"
import {DesktopAlarmScheduler} from "./sse/DesktopAlarmScheduler"
import {runIntegration} from "./integration/DesktopIntegrator"
import {lang} from "../misc/LanguageViewModel"
import en from "../translations/en"
import {DesktopNetworkClient} from "./DesktopNetworkClient"
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import {DesktopDownloadManager} from "./DesktopDownloadManager"

mp()

lang.init(en)
const conf = new DesktopConfigHandler()
const net = new DesktopNetworkClient()
const crypto = new DesktopCryptoFacade()
const sock = new Socketeer()
const notifier = new DesktopNotifier()
const dl = new DesktopDownloadManager(conf, net)
const alarmStorage = new DesktopAlarmStorage(conf, crypto)
alarmStorage.init()
            .then(() => {
	            console.log("alarm storage initialized")
            })
            .catch(e => {
	            console.warn("alarm storage failed to initialize:", e)
            })
const updater = new ElectronUpdater(conf, notifier)
const tray = new DesktopTray(conf, notifier)
const wm = new WindowManager(conf, tray, notifier, dl)
const alarmScheduler = new DesktopAlarmScheduler(wm, notifier, alarmStorage, crypto)
tray.setWindowManager(wm)
const sse = new DesktopSseClient(app, conf, notifier, wm, alarmScheduler, net, crypto, alarmStorage, lang)
sse.start()
const ipc = new IPC(conf, notifier, sse, wm, sock, alarmStorage, crypto, dl, alarmScheduler)
wm.setIPC(ipc)

PreloadImports.keep(sock)
app.setAppUserModelId(conf.get("appUserModelId"))
app.allowRendererProcessReuse = false
console.log("argv: ", process.argv)
console.log("version:  ", app.getVersion())

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
	if (!app.requestSingleInstanceLock()) {
		app.quit()
	} else {
		app.on('second-instance', (ev, args, cwd) => {
			console.log("2nd instance args:", args)
			if (wm.getAll().length === 0) {
				wm.newWindow(true)
			} else {
				wm.getAll().forEach(w => w.show())
			}
			handleArgv(args)
		})
	}

	app.on('ready', onAppReady)
}

function onAppReady() {

	app.on('window-all-closed', () => {
		if (!conf.getDesktopConfig('runAsTrayApp')) {
			app.quit()
		}
	}).on('open-url', (e, url) => { // MacOS mailto handling
		e.preventDefault()
		if (!url.startsWith('mailto:')) {
			return
		}
		handleMailto(url)
	})

	err.init(wm, ipc)
	// only create a window if there are none (may already have created one, e.g. for mailto handling)
	// also don't show the window when we're an autolaunched tray app
	const w = wm.getLastFocused(!(conf.getDesktopConfig('runAsTrayApp') && wasAutolaunched))
	console.log("default mailto handler:", app.isDefaultProtocolClient("mailto"))
	ipc.initialized(w.id)
	   .then(main)
}

function main() {
	tray.update()
	if (process.argv.indexOf('-s') !== -1) {
		sock.startServer()
	}
	console.log("Webapp ready")
	app.on('activate', () => {
		// MacOs
		// this is fired for almost every interaction and on launch
		// so set listener later to avoid the call on launch
		wm.getLastFocused(true)
		tray.clearBadge()
	})
	notifier.start(tray, 2000)
	updater.start()
	runIntegration()
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

