// @flow
import {conf} from './DesktopConfigHandler'
import {app} from 'electron'
import {updater} from './ElectronUpdater.js'
import {MainWindow} from './MainWindow.js'
import DesktopUtils from './DesktopUtils.js'
import {notifier} from "./DesktopNotifier.js"
import {lang} from './DesktopLocalizationProvider.js'
import {ipc} from './IPC.js'
import PreloadImports from './PreloadImports.js'

let mainWindow: MainWindow
PreloadImports.keep()
conf.get("appUserModelId")
    .then((id) => {
	    app.setAppUserModelId(id)
    })
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

	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})

	app.on('open-url', (e, url) => { // MacOS mailto handling
		e.preventDefault()
		if (!url.startsWith('mailto:')) {
			return
		}
		if (mainWindow) {
			handleMailto(url)
		} else {
			process.argv.push(url)
		}
	})

	app.on('activate', () => {
		mainWindow.show()
	})

	app.on('ready', createMainWindow)
}

function createMainWindow() {
	mainWindow = new MainWindow()
	console.log("default mailto handler:", app.isDefaultProtocolClient("mailto"))
	console.log("notifications available:", notifier.isAvailable())
	ipc.initialized()
	   .then(lang.init)
	   .then(main)
}

function main() {
	console.log("Webapp ready")
	notifier.start()
	updater.start()
	handleArgv()
}

function handleArgv() {
	const mailtoUrl = process.argv.find((arg) => arg.startsWith('mailto'))
	if (mailtoUrl) {
		process.argv.splice(process.argv.indexOf(mailtoUrl), 1)
		handleMailto(mailtoUrl)
	}
}

function handleMailto(mailtoArg?: string) {
	if (mailtoArg) {
		/*[filesUris, text, addresses, subject, mailToUrl]*/
		mainWindow.show()
		ipc.sendRequest('createMailEditor', [[], "", "", "", mailtoArg])
	}
}