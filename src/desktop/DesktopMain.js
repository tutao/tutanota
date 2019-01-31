// @flow
import {err} from './DesktopErrorHandler.js'
import {conf} from './DesktopConfigHandler'
import {app, globalShortcut} from 'electron'
import {updater} from './ElectronUpdater.js'
import {ApplicationWindow} from './ApplicationWindow.js'
import DesktopUtils from './DesktopUtils.js'
import {notifier} from "./DesktopNotifier.js"
import {lang} from './DesktopLocalizationProvider.js'
import {tray} from './DesktopTray.js'
import {ipc} from './IPC.js'
import PreloadImports from './PreloadImports.js'

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
			if (!conf.getDesktopConfig('runAsTrayApp') && ApplicationWindow.getAll().length > 0) {
				ApplicationWindow.getAll().forEach(w => w.show())
			} else {
				new ApplicationWindow(true)
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

	err.init()
	// only create a window if there are none (may already have created one, e.g. for mailto handling)
	// also don't show the window when we're an autolaunched tray app
	const w = ApplicationWindow.getLastFocused(!(conf.getDesktopConfig('runAsTrayApp') && wasAutolaunched))
	console.log("default mailto handler:", app.isDefaultProtocolClient("mailto"))
	console.log("notifications available:", notifier.isAvailable())
	ipc.initialized(w.id)
	   .then(() => lang.init(w.id))
	   .then(main)
}

function main() {
	tray.update()
	console.log("Webapp ready")
	globalShortcut.register('CommandOrControl+N', () => new ApplicationWindow(true))
	app.on('activate', () => {
		// MacOs
		// this is fired for almost every interaction and on launch
		// so set listener later to avoid the call on launch
		ApplicationWindow.getLastFocused(true)
	})
	notifier.start()
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
		const w = ApplicationWindow.getLastFocused(true)
		ipc.sendRequest(w.id, 'createMailEditor', [[], "", "", "", mailtoArg])
	}
}