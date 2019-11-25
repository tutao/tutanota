// @flow
import {mp} from './DesktopMonkeyPatch.js'
import {err} from './DesktopErrorHandler.js'
import {DesktopConfigHandler} from './DesktopConfigHandler'
import {app, Menu} from 'electron'
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
import {lang} from "../misc/LanguageViewModel"
import en from "../translations/en"
import type {MenuItemConstructorOptions} from 'electron'

mp()


lang.init(en)
const conf = new DesktopConfigHandler()
const sock = new Socketeer()
const notifier = new DesktopNotifier()
const alarmStorage = new DesktopAlarmStorage(conf)
alarmStorage.init()
			.then(() => {
				console.log("alarm storage initialized")
			})
			.catch(e => {
				console.warn("alarm storage failed to initialize:", e)
			})
const updater = new ElectronUpdater(conf, notifier)
const tray = new DesktopTray(conf, notifier)
const wm = new WindowManager(conf, tray, notifier)
const alarmScheduler = new DesktopAlarmScheduler(wm, notifier, alarmStorage)
tray.setWindowManager(wm)
const sse = new DesktopSseClient(conf, notifier, wm, alarmScheduler)
sse.start()
const ipc = new IPC(conf, notifier, sse, wm, sock, alarmStorage)
wm.setIPC(ipc)

PreloadImports.keep(sock)
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

if (process.platform === 'darwin') {
	// We need menu on macOS, otherwise there are no shortcuts defined even for things like copy/paste or hiding window
	let template: MenuItemConstructorOptions[] = [
		{
			// Skip individual definitions because appMenu can do it automatically
			role: "appMenu"
		},
		{
			label: 'Edit',
			submenu: [
				{role: 'undo'},
				{role: 'redo'},
				{type: 'separator'},
				{role: 'cut'},
				{role: 'copy'},
				{role: 'paste'},
				{role: 'pasteAndMatchStyle'},
				{role: 'delete'},
				{role: 'selectAll'},
				{type: 'separator'},
				{
					label: 'Speech',
					submenu: [
						{role: 'startSpeaking'},
						{role: 'stopSpeaking'}
					]
				}
			]
		},
		{
			label: 'View',
			submenu: [
				// these ones don't work for some reason. Perhaps it must be set on the window and not as app menu.
				// {role: 'resetzoom'},
				// {role: 'zoomin'},
				// {role: 'zoomout'},
				// {type: 'separator'},
				{role: 'togglefullscreen'}
			]
		},
		{
			role: 'window',
			submenu: [
				{role: 'minimize'},
				{role: 'close'},
				{role: 'minimize'},
				{role: 'zoom'},
				{type: 'separator'},
				{role: 'front'}
			]
		},
		// Submenus are always disabled for some reason so don't use help menu for now
		// {
		// 	role: 'help',
		// 	submenu: [
		// 		{
		// 			label: 'Release notes',
		// 			click: () => {
		// 				const {shell} = require('electron')
		// 				return shell.openExternal('http://github.com/tutao/tutanota/releases')
		// 			}
		// 		},
		// 		{
		// 			label: 'FAQ',
		// 			click: () => {
		// 				const {shell} = require('electron')
		// 				return shell.openExternal('https://tutanota.com/faq')
		// 			}
		// 		}
		// 	]
		// }
	]
	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
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
	})
	notifier.start(tray, 2000)
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

