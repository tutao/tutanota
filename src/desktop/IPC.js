// @flow
import {BrowserWindow, ipcMain} from 'electron'

export default class IPC {

	static _send = () => console.log("ipc not initialized!")
	static _on = () => console.log("ipc not initialized!")

	static init(window: BrowserWindow) {
		IPC._send = (...args: any) => window.webContents.send.apply(window.webContents, args)
		IPC._on = (...args: any) => ipcMain.on.apply(ipcMain, args)
	}

	static send(...args: any) {
		return IPC._send.apply(this, args)
	}

	static on(...args: any) {
		return IPC._on.apply(this, args)
	}
}