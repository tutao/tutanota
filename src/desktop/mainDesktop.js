// @flow
import {app, BrowserWindow} from 'electron'
import electronDebug from 'electron-debug'
import ElectronUpdater from './ElectronUpdater.js'
import {createWindow} from './MainWindow'

let mainWindow: BrowserWindow

electronDebug({
	enabled: true,
	showDevTools: false,
})

if (!app.requestSingleInstanceLock()) {
	app.quit()
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		mainWindow = createWindow()
	}
})

app.on('second-instance', (e, argv, cwd) => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore()
		}
		mainWindow.focus()
	}
})

app.on('ready', () => {
	mainWindow = createWindow()
	ElectronUpdater.initAndCheck()
})