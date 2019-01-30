// @flow
import {ipcRenderer, remote} from 'electron'

/**
 * preload scripts can only load modules that have previously been loaded
 * in the main thread.
 */
const app = remote.require('electron').app
const webFrame = require('electron').webFrame
const clipboard = remote.require('electron').clipboard
const PreloadImports = remote.require('./PreloadImports.js').default
const lang = PreloadImports.lang
const localShortcut = PreloadImports.localShortcut
const Menu = remote.Menu
const MenuItem = remote.MenuItem

/**
 * create the context menu
 * @type {Electron.Menu}
 */
const contextMenu = new Menu()
let pasteItem, copyItem, copyLinkItem: MenuItem
let hoverUrl: string = "" // for the link popup
let urlToCopy: string = "" // for the context menu

if (process.platform === 'darwin') {
	//MacOS needs special shortcut handling, these menu accelerators only work when the context menu is open.
	//thus we register them as browserwindow-local shortcuts on the node side
	localShortcut.register(remote.getCurrentWindow(), 'Command+C', () => copy(false))
	localShortcut.register(remote.getCurrentWindow(), 'Command+X', () => document.execCommand('cut'))
	localShortcut.register(remote.getCurrentWindow(), 'Command+V', () => document.execCommand('paste'))
	localShortcut.register(remote.getCurrentWindow(), 'Command+A', () => document.execCommand('selectAll'))
}

// copy function
function copy(copyLink: boolean) {
	if (copyLink && !!urlToCopy) {
		clipboard.writeText(urlToCopy)
	} else if (!copyLink) {
		document.execCommand('copy')
	}
}

function setupContextMenu() {
	console.log("context")
	pasteItem = new MenuItem({label: lang.get("paste_action"), accelerator: "CmdOrCtrl+V", click() { document.execCommand('paste') }})
	copyItem = new MenuItem({label: lang.get("copy_action"), accelerator: "CmdOrCtrl+C", click: () => copy(false)})
	copyLinkItem = new MenuItem({label: lang.get("copyLink_action"), click: () => copy(true)})
	contextMenu.append(copyItem)
	contextMenu.append(copyLinkItem)
	contextMenu.append(new MenuItem({label: lang.get("cut_action"), accelerator: "CmdOrCtrl+X", click() { document.execCommand('cut') }}))
	contextMenu.append(pasteItem)
	contextMenu.append(new MenuItem({type: 'separator'}))
	contextMenu.append(new MenuItem({label: lang.get("undo_action"), accelerator: "CmdOrCtrl+Z", click() { document.execCommand('undo') }}))
	contextMenu.append(new MenuItem({label: lang.get("redo_action"), accelerator: "CmdOrCtrl+Shift+Z", click() { document.execCommand('redo') }}))

	ipcRenderer.on('context-menu', (e, params) => {
		console.log(params[0])
		const linkURL = params[0].linkURL
		copyLinkItem.enabled = !!linkURL
		pasteItem.enabled = clipboard.readText().length > 0
		copyItem.enabled = window.getSelection().toString().length > 0
		urlToCopy = linkURL
		contextMenu.popup({window: remote.getCurrentWindow()})
	})
}

ipcRenderer
	.on(`${remote.getCurrentWindow().id}`, (ev, msg) => {
		window.tutao.nativeApp.handleMessageObject(msg)
	})
	.on('setup-context-menu', setupContextMenu)

// href URL reveal
window.addEventListener('mouseover', (e) => {
	if (e.target.tagName !== 'A' || !e.target.matches('#mail-viewer a')) {
		return
	}
	let elem = document.getElementById('link-tt')
	if (!elem) {
		elem = document.createElement("DIV")
		elem.id = "link-tt";
		(document.body: any).appendChild(elem)
	}
	elem.innerText = e.target.href
	hoverUrl = e.target.href
	elem.className = "reveal"
})

window.addEventListener('mouseout', (e) => {
	let elem = document.getElementById('link-tt')
	if (e.target.tagName === 'A' && elem) {
		elem.className = ""
		hoverUrl = ""
	}
})

window.onmousewheel = (e) => {
	if (!e.ctrlKey) {
		return
	}
	let newFactor = ((webFrame.getZoomFactor() * 100) + (e.deltaY > 0 ? -10 : 10)) / 100
	if (newFactor > 3) {
		newFactor = 3
	} else if (newFactor < 0.5) {
		newFactor = 0.5
	}
	webFrame.setZoomFactor(newFactor)
}

// window.focus() doesn't seem to be working right now, so we're replacing it
// https://github.com/electron/electron/issues/8969#issuecomment-288024536
window.focus = () => {
	window.tutao.nativeApp.invokeNative(new PreloadImports.Request('showWindow', []))
}

window.nativeApp = {
	invoke: (msg: string) => ipcRenderer.send(`${remote.getCurrentWindow().id}`, msg),
	getVersion: () => app.getVersion()
}