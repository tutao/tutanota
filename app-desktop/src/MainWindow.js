const {BrowserWindow} = require('electron')
const ipc = require('electron').ipcMain
const open = require('./open')
const path = require('path')

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
			// can't use contextIsolation because this will isolate
			// the preload script from the web app
			//contextIsolation: true,
			webSecurity: true,
			preload: path.join(__dirname, '/preload.js')
		}
	})

	mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
		const url = webContents.getURL()
		if (!url.startsWith('https://mail.tutanota.com') || !(permission === 'notifications')) {
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

	//we only have one window to communicate with
	ipc.send = (...args) => mainWindow.webContents.send.apply(mainWindow.webContents, args)

	mainWindow.on('close', () => {
		ipc.send('close')
	})

	ipc.on('hello', () => {
		console.log('hello from renderer')
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