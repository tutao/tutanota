const {app, BrowserWindow} = require('electron')
const {autoUpdater} = require('electron-updater')

let mainWindow

console.log("[o] app starting...")
autoUpdater.logger = {
	info: (m) => console.log("info: ", m),
	warn: (m) => console.log("warn: ", m),
	error: (m) => console.log("error: ", m),
	debug: (m) => console.log("debug: ", m),
	verbose: (m) => console.log("verbose: ", m),
	silly: (m) => console.log("silly: ", m)
}

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		autoHideMenuBar: true,
	})
	mainWindow.loadFile('./resources/index.html')
	console.log("[o] ready")
	autoUpdater.checkForUpdatesAndNotify()
	mainWindow.on('closed', () => {
			mainWindow = null
		}
	)
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
autoUpdater.on('checking-for-update', () => {
	autoUpdater.logger.info('[o] Checking for update...');
})
autoUpdater.on('update-available', (info) => {
	autoUpdater.logger.info('[o] Update available.');
})
autoUpdater.on('update-not-available', (info) => {
	autoUpdater.logger.info('[o] Update not available.');
})
autoUpdater.on('error', (err) => {
	autoUpdater.logger.info('[o] Error in auto-updater. ' + err);
})


app.on('ready', createWindow)