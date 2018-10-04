const ipc = require('electron').ipcRenderer

function sendMessage(msg) {
	return ipc.send(msg);
}

function receiveMessage(msg, listener) {
	return ipc.on(msg, listener)
}

window.electron = {
	sendMessage: (msg) => sendMessage(msg),
	onMessage: (msg, listener) => receiveMessage(msg, listener)
}