"use strict"
/**
 * Preload for the render thread of the electron.
 * Executed for every new window and on every reload.
 * Sets up inter-process communication.
 *
 * Note: we can't import any other desktop code here because it is in the web (render) process.
 */

const { ipcRenderer, contextBridge } = require("electron")

console.log("registering context bridge")

contextBridge.exposeInMainWorld("nativeAppWebDialog", {
	invoke: (msg) => ipcRenderer.invoke("to-main-webdialog", msg),
	attach: (handler) => {
		console.log("attach from preload-webdialog")
		// Do not give back ipcRenderer to the caller!
		ipcRenderer.on("to-renderer-webdialog", (ev, msg) => handler(msg))
		return undefined
	},
})
