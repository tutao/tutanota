const ipc = require('electron').ipcRenderer

function sendMessage(msg, args) {
	return ipc.send(msg, args);
}

function receiveMessage(msg, listener) {
	return ipc.on(msg, listener)
}
function removeListener(msg, listener) {
	return ipc.removeListener(msg, listener)
}

function greet() {
	const m = window.tutao.m
	return m('h1', "Hello Electron!")
}

window.bridge = {
	sendMessage: (msg, data) => sendMessage(msg, data),
	startListening: (msg, listener) => receiveMessage(msg, listener),
	stopListening: (msg, listener) => removeListener(msg, listener),
	greet: greet
}