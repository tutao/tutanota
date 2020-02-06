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


// copy function
function copy(copyLink: boolean) {
	if (copyLink && !!urlToCopy) {
		clipboard.writeText(urlToCopy)
	} else if (!copyLink) {
		document.execCommand('copy')
	}
}

function setupContextMenu() {
	pasteItem = new MenuItem({label: lang.get("paste_action"), accelerator: "CmdOrCtrl+V", click() { document.execCommand('paste') }})
	copyItem = new MenuItem({label: lang.get("copy_action"), accelerator: "CmdOrCtrl+C", click: () => copy(false)})
	copyLinkItem = new MenuItem({label: lang.get("copyLink_action"), click: () => copy(true)})
	contextMenu.append(copyItem)
	contextMenu.append(copyLinkItem)
	contextMenu.append(new MenuItem({label: lang.get("cut_action"), accelerator: "CmdOrCtrl+X", click() { document.execCommand('cut') }}))
	contextMenu.append(pasteItem)
	contextMenu.append(new MenuItem({type: 'separator'}))
	contextMenu.append(new MenuItem({label: lang.get("undo_action"), accelerator: "CmdOrCtrl+Z", click() { document.execCommand('undo') }}))
	contextMenu.append(new MenuItem({
		label: lang.get("redo_action"),
		accelerator: "CmdOrCtrl+Shift+Z",
		click() { document.execCommand('redo') }
	}))

	ipcRenderer.on('open-context-menu', (e, params) => {
		console.log(params[0])
		const linkURL = params[0].linkURL
		copyLinkItem.enabled = !!linkURL
		pasteItem.enabled = clipboard.readText().length > 0
		copyItem.enabled = window.getSelection().toString().length > 0
		urlToCopy = linkURL
		contextMenu.popup({window: remote.getCurrentWindow()})
	})
}

function setZoomFactor(ev, newFactor) {
	webFrame.setZoomFactor(newFactor)
}

ipcRenderer
	.on(`${remote.getCurrentWindow().id}`, (ev, msg) => {
		window.tutao.nativeApp.handleMessageObject(msg)
	})
	.on('setup-context-menu', setupContextMenu)
	.on('set-zoom-factor', setZoomFactor)

// href URL reveal
let linkToolTip
window.addEventListener('mouseover', (e) => {
	// if there are nested elements like <strong/> in the link element,
	// we may not get a mouseover or mouseout for the actual <a/>, so
	// so we inspect the path.
	let linkElem = e.path.find(elem => elem.tagName === 'A')
	if (!linkElem || !linkElem.matches('#mail-viewer a')) {
		return
	}
	if (!linkToolTip) {
		linkToolTip = document.createElement("DIV")
		linkToolTip.id = "link-tt";
		(document.body: any).appendChild(linkToolTip)
	}
	linkToolTip.innerText = linkElem.href
	hoverUrl = linkElem.href
	linkToolTip.className = "reveal"
})

window.addEventListener('mouseout', (e) => {
	let linkElem = e.path.find(elem => elem.tagName === 'A')
	if (linkElem && linkToolTip) {
		linkToolTip.className = ""
		hoverUrl = ""
	}
})

window.addEventListener('mouseup', e => {
	/*
	* we're catching enter key events on the main thread while the search overlay is open to enable
	* next-result-via-enter behaviour.
	*
	* since losing focus on the overlay via issuing a search request seems to be indistinguishable
	* from losing it via click/tab we need to check if anything else was clicked and tell the main thread to
	* not search the next result for enter key events (otherwise we couldn't type newlines while the overlay is open)
	*/
	if (e.target.id === "search-overlay-input") return
	window.tutao.nativeApp.invokeNative(new PreloadImports.Request("setSearchOverlayState", [false, true]))
})

// needed to help the MacOs client to distinguish between Cmd+Arrow to navigate the history
// and Cmd+Arrow to navigate a text editor
window.addEventListener('keydown', e => {
	if (!e.metaKey || e.key === 'Meta' || !window.tutao || !window.tutao.client || !window.tutao.client.isMacOS) return
	// prevent history nav if the active element is an input / squire editor
	if (e.target && (e.target.tagName === "INPUT" || e.target.contentEditable === 'true')) {
		e.stopPropagation()
	} else if (e.key === 'ArrowLeft') {
		window.history.back()
	} else if (e.key === 'ArrowRight') window.history.forward()
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