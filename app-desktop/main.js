const {app, BrowserWindow} = require('electron')

let mainWindow

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		autoHideMenuBar: true,

	})
	mainWindow.loadFile('resources/index.html')
	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
})

app.on('ready', createWindow)