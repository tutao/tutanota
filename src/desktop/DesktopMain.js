// @flow
import {err} from './DesktopErrorHandler.js'
import {conf} from './DesktopConfigHandler'
import {app} from 'electron'
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
	let firstActivate = !conf.getDesktopConfig('runOnStartup')

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
	}).on('activate', () => { //MacOS
		// first launch, dock click,
		// attempt to launch while already running on macOS
		if (firstActivate) { //skip showing window if autostart
			firstActivate = false
			return
		}
		ApplicationWindow.getLastFocused(true)
	})

	err.init()
	const w = ApplicationWindow.getLastFocused(!conf.getDesktopConfig('runOnStartup'))
	console.log("default mailto handler:", app.isDefaultProtocolClient("mailto"))
	console.log("notifications available:", notifier.isAvailable())
	ipc.initialized(w.id)
	   .then(() => lang.init(w.id))
	   .then(main)
}

function main() {
	tray.update()
	console.log("Webapp ready")
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