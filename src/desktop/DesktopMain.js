// @flow
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
conf.get("appUserModelId").then(app.setAppUserModelId)
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
			if (process.platform !== 'linux') {
				ApplicationWindow.getAll().forEach(w => w.show())
				handleArgv(args)
			} else {
				new ApplicationWindow()
			}
		})
	}

	app.on('window-all-closed', () => {
		if (process.platform === 'linux') {
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
		ApplicationWindow.getLastFocused().show()
	}).on('ready', createMainWindow)
}

function createMainWindow() {
	const w = new ApplicationWindow()
	console.log("default mailto handler:", app.isDefaultProtocolClient("mailto"))
	console.log("notifications available:", notifier.isAvailable())
	ipc.initialized()
	   .then(() => lang.init(w.id))
	   .then(main)
}

function main() {
	tray.show()
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
		const w = ApplicationWindow.getLastFocused()
		w.show()
		ipc.sendRequest(w.id, 'createMailEditor', [[], "", "", "", mailtoArg])
	}
}