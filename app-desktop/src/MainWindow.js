const {BrowserWindow} = require('electron')
const open = require('./open')

const startFile = './resources/desktop.html'

exports.createWindow = () => {
	let mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: false,
			nodeIntegrationInWorker: false,
			// TODO: not a real os sandbox yet.
			// https://github.com/electron-userland/electron-builder/issues/2562
			// https://electronjs.org/docs/api/sandbox-option
			sandbox: true,
			contextIsolation: true,
			webSecurity: true
			//preload: './preload.js'
		}
	})

	mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
		const url = webContents.getURL()
		if (!url.startsWith('https://mail.tutanota.com') || !permission === 'notifications') {
			return callback(false)
		}
		return callback(true)
	})

	// we never open any new windows except for links in mails etc.
	// so open them in the browser, not in electron
	mainWindow.webContents.on('new-window', (e, url) => {
		open(url);
		e.preventDefault();
	});

	// should never be called, but if somehow a webview gets created
	// we kill it
	mainWindow.webContents.on('will-attach-webview', (e, webPreferences, params) => {
		e.preventDefault()
	})

	// handle navigation events. needed since webSecurity = true will
	// prevent us from opening any local files directly
	mainWindow.webContents.on('did-start-navigation', (e, url) => {
		//desktop.html after logout
		if (url.endsWith('/login?noAutoLogin=true')) {
			mainWindow.loadFile(startFile)
		}
		e.preventDefault()
	})
	mainWindow.loadFile(startFile)
	return mainWindow
}