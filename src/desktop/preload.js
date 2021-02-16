"use strict";
/**
 * Preload for the render thread of the electron.
 * Executed for every new window and on every reload.
 * Sets up inter-process communication.
 *
 * Note: we can't import any other desktop code here because it is in the web (render) process.
 * It's also not processed by babel or flow, so don't add any code here
 */
const {ipcRenderer, contextBridge} = require('electron')

contextBridge.exposeInMainWorld('nativeApp', {
	invoke: msg => ipcRenderer.invoke('to-main', msg),
	attach: handler => ipcRenderer.on('to-renderer', (ev, msg) => handler(msg))
})