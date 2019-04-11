// @flow
import {err} from './DesktopErrorHandler.js'
import {DesktopConfigHandler} from './DesktopConfigHandler'
import {app} from 'electron'
import DesktopUtils from './DesktopUtils.js'
import {lang} from './DesktopLocalizationProvider.js'
import chalk from 'chalk'
import {IPC} from './IPC.js'
import PreloadImports from './PreloadImports.js'
import {WindowManager} from "./DesktopWindowManager"
import {DesktopNotifier} from "./DesktopNotifier"
import {DesktopTray} from './DesktopTray.js'
import {ElectronUpdater} from "./ElectronUpdater"
import {DesktopSseClient} from "./DesktopSseClient"

const oldLog = console.log
const oldError = console.error
const oldWarn = console.warn

;(console: any).log = (...args) => oldLog(chalk.blue(`[${new Date().toISOString()}]`), ...args)
;(console: any).error = (...args) => oldError(chalk.red.bold(`[${new Date().toISOString()}]`), ...args)
;(console: any).warn = (...args) => oldWarn(chalk.yellow(`[${new Date().toISOString()}]`), ...args)

const conf = new DesktopConfigHandler()
const notifier = new DesktopNotifier()
const updater = new ElectronUpdater(conf, notifier)
const tray = new DesktopTray(conf, notifier)
const wm = new WindowManager(conf, tray, notifier)
tray.setWindowManager(wm)
const sse = new DesktopSseClient(conf, notifier, wm)
const ipc = new IPC(conf, notifier, sse, wm)
wm.setIPC(ipc)

PreloadImports.keep()
app.setAppUserModelId(conf.get("appUserModelId"))
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
	   .then(() => lang.init(ipc.sendRequest(w.id, 'sendTranslations', [])))
	   .then(main)
}

function main() {
	tray.update()
	console.log("Webapp ready")
	app.on('activate', () => {
		// MacOs
		// this is fired for almost every interaction and on launch
		// so set listener later to avoid the call on launch
		wm.getLastFocused(true)
	})
	notifier.start(tray)
	updater.start()
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
