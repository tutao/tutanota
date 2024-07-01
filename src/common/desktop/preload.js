"use strict"
/**
 * Preload for the render thread of the electron.
 * Executed for every new window and on every reload.
 * Sets up inter-process communication.
 *
 * Note: we can't import any other desktop code here because it is in the web (render) process.
 */

const { ipcRenderer, contextBridge } = require("electron")

contextBridge.exposeInMainWorld("nativeApp", {
	invoke: (msg) => ipcRenderer.invoke("to-main", msg),
	attach: (handler) => {
		// Do not give back ipcRenderer to the caller!
		ipcRenderer.on("to-renderer", (ev, msg) => handler(msg))
		return undefined
	},
})
