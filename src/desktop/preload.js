//@flow

/**
 * Preload for the render thread of the electron.
 * Executed for every new window and on every reload.
 * Sets up inter-process communication.
 *
 * Note: we can't import any other desktop code here because it is in the web (render) process.
 */

// This should come from bundler banner. We are in a weird environment here where there's "require" but no "module" so we can't really
// use commonjs format. We use iife but "require" is shadowed in it. To work around this we save require before shadowing.
declare var dynamicRequire: typeof require;
const {ipcRenderer, contextBridge} = dynamicRequire('electron')

contextBridge.exposeInMainWorld('nativeApp', {
	invoke: (msg: string) => ipcRenderer.invoke('message', msg)
})