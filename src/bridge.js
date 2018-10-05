// @flow

const stubs = {
	startListening: (msg: BridgeMessage, cb: Function) => {},
	stopListening: (msg: BridgeMessage, cb: Function) => {},
	sendMessage: (msg: BridgeMessage, data: Object) => {},
	greet: () => {return null}
}

const bridge = new Proxy(stubs, {
	get: (obj, prop) => {
		return prop in window.bridge
			? window.bridge[prop]
			: obj[prop]
	}
})

export default bridge