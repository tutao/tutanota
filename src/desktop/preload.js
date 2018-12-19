// @flow
import {ipcRenderer, remote} from 'electron'

/**
 * preload scripts can only load modules that have previously been loaded
 * in the main thread.
 */
const app = remote.require('electron').app
const clipboard = remote.require('electron').clipboard
const PreloadImports = remote.require('./PreloadImports.js').default
const lang = PreloadImports.lang
const Menu = remote.Menu
const MenuItem = remote.MenuItem

/**
 * create the context menu
 * @type {Electron.Menu}
 */
const menu = new Menu()
let pasteItem, copyItem, copyLinkItem: MenuItem
let hoverUrl: string = "" // for the link popup
let urlToCopy: string = "" // for the context menu

lang.initialized.promise.then(() => {
	pasteItem = new MenuItem({label: lang.get("paste_action"), accelerator: "CmdOrCtrl+V", click() { document.execCommand('paste') }})
	copyItem = new MenuItem({label: lang.get("copy_action"), accelerator: "CmdOrCtrl+C", click: copy})
	copyLinkItem = new MenuItem({label: lang.get("copyLink_action"), click: copy})
	menu.append(copyItem)
	menu.append(copyLinkItem)
	menu.append(new MenuItem({label: lang.get("cut_action"), accelerator: "CmdOrCtrl+X", click() { document.execCommand('cut') }}))
	menu.append(pasteItem)
	menu.append(new MenuItem({type: 'separator'}))
	menu.append(new MenuItem({label: lang.get("undo_action"), accelerator: "CmdOrCtrl+Z", click() { document.execCommand('undo') }}))
	menu.append(new MenuItem({label: lang.get("redo_action"), accelerator: "CmdOrCtrl+Shift+Z", click() { document.execCommand('redo') }}))
})

window.addEventListener('contextmenu', (e) => {
	e.preventDefault()
	pasteItem.enabled = clipboard.readText().length > 0
	let sel = window.getSelection().toString()
	if (sel.length < 1 && !!e.target.href) {
		urlToCopy = e.target.href
		copyItem.visible = false
		copyLinkItem.visible = true
	} else {
		copyItem.visible = true
		copyLinkItem.visible = false
		copyItem.enabled = sel.length > 0
		urlToCopy = ""
	}
	menu.popup({window: remote.getCurrentWindow()})
}, false)

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

// copy function
function copy() {
	if (window.getSelection().toString().length < 1 && !!urlToCopy) {
		clipboard.writeText(urlToCopy)
	} else {
		document.execCommand('copy')
	}
}


function sendMessage(msg, args) {
	ipcRenderer.send(msg, args)
}

ipcRenderer.on('protocol-message', (ev, msg) => {
	window.tutao.nativeApp.handleMessageObject(msg)
})

ipcRenderer.once('print-argv', (ev, msg) => {
	console.log("node argv:", msg)
})

function receiveMessage(msg, listener) {
	return ipcRenderer.on(msg, listener)
}

function removeListener(msg, listener) {
	return ipcRenderer.removeListener(msg, listener)
}

window.onmousewheel = (e) => {
	if (e.ctrlKey) {
		e.preventDefault()
		window.tutao.nativeApp.invokeNative(new PreloadImports.Request('changeZoomFactor', [e.deltaY > 0 ? -10 : 10]))
	}
}

window.nativeApp = {
	invoke: (msg: string) => {sendMessage('protocol-message', msg)},
	sendMessage: (msg: BridgeMessage, data: any) => sendMessage(msg, data),
	startListening: (msg: BridgeMessage, listener: Function) => receiveMessage(msg, listener),
	stopListening: (msg: BridgeMessage, listener: Function) => removeListener(msg, listener),
	getVersion: () => app.getVersion()
}

// window.focus() doesn't seem to be working right now, so we're replacing it
// https://github.com/electron/electron/issues/8969#issuecomment-288024536
window.focus = () => {
	ipcRenderer.send('show-window')
}