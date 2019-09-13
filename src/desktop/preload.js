//@flow

/**
 * Preload for the render thread of the electron.
 * Executed for every new window. Sets up inter-process communication and Electron-specific functions like scaling.
 *
 * Note: we can't import any other desktop code here because it is in the web (render) process.
 */

// This should come from bundler banner. We are in a weird environment here where there's "require" but no "module" so we can't really
// use commonjs format. We use iife but "require" is shadowed in it. To work around this we save require before shadowing.
declare var dynamicRequire: typeof require;
const {ipcRenderer, webFrame} = dynamicRequire('electron')

let requestId = 0
let hoverUrl = "" // for the link popup
let linkToolTip = null

ipcRenderer
	.on('set-zoom-factor', setZoomFactor)
	.once('initialize-ipc', initializeIPC)

function initializeIPC(e, params) {
	const [version, windowId] = params

	ipcRenderer.on(`${windowId}`, (ev, msg) => {
		window.tutao.nativeApp.handleMessageObject(msg)
	})

	window.nativeApp = {
		invoke: (msg: string) => ipcRenderer.send(`${windowId}`, msg),
		getVersion: () => version
	}

	/* this event listener doesn't get fired
	 * if it's registered during the initial preload.js
	 * execution
	 */
	window.addEventListener('wheel', e => {
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
	})
}

function setZoomFactor(ev, newFactor) {
	webFrame.setZoomFactor(newFactor)
}

// for completeness - atm the preload requests never expect a response
function createRequestId() {
	if (requestId >= Number.MAX_SAFE_INTEGER) {
		requestId = 0
	}
	return "preload" + requestId++
}

// href URL reveal
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
	window.tutao.nativeApp.invokeNative({
		type: "setSearchOverlayState",
		id: createRequestId(),
		args: [false, true]
	})
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

// window.focus() doesn't seem to be working right now, so we're replacing it
// https://github.com/electron/electron/issues/8969#issuecomment-288024536
window.focus = () => {
	window.tutao.nativeApp.invokeNative({
		type: 'showWindow',
		id: createRequestId(),
		args: []
	})
}

window.addEventListener("beforeunload", () =>
		// There's no good way to detect reload using Electron APIs so we have to resort to DOM events
	window.tutao && window.tutao.nativeApp && window.tutao.nativeApp.invokeNative({
		type: "unload",
		id: createRequestId(),
		args: []
	})
)