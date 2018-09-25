const {app} = require('electron')
const autoUpdater = require('./src/AutoUpdate')
const createWindow = require('./src/MainWindow').createWindow

let mainWindow

if (!app.requestSingleInstanceLock()) {
	app.quit()
	return;
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
	// mainWindow.webContents.executeJavaScript(`window`, (res) => {
	// 	res.foo = bar
	// })
	autoUpdater.initAndCheck()
})