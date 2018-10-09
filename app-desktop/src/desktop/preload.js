// @flow
import {ipcRenderer} from 'electron'

console.log("Preloaded")

function sendMessage(msg, args) {
	return ipcRenderer.send(msg, args);
}

function receiveMessage(msg, listener) {
	return ipcRenderer.on(msg, listener)
}

function removeListener(msg, listener) {
	return ipcRenderer.removeListener(msg, listener)
}

const bridge: Bridge = {
	sendMessage: (msg: BridgeMessage, data: any) => sendMessage(msg, data),
	startListening: (msg: BridgeMessage, listener: Function) => receiveMessage(msg, listener),
	stopListening: (msg: BridgeMessage, listener: Function) => removeListener(msg, listener),
}

window.bridge = bridge