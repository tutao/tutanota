const ipc = require('electron').ipcMain

exports.init = (window) => {
	exports.send = (...args) => window.webContents.send.apply(window.webContents, args)
	exports.on = (...args) => ipc.on.apply(ipc, args)
}
exports.send = () => {console.log("ipc not initialized!")}
exports.on = () => {console.log("ipc not initialized!")}