// @flow
import {isDesktop} from "../api/Env"

const stubs: Bridge = {
	sendMessage: (msg: BridgeMessage, data: any) => {},
	startListening: (msg: BridgeMessage, listener: Function) => {},
	stopListening: (msg: BridgeMessage, listener: Function) => {},
}

let bridge: Bridge = new Proxy(stubs, {
	get: (obj, prop) => {
		return prop in window.bridge
			? window.bridge[prop]
			: () => {}
	}
})

export default bridge

export function ifDesktop<T>(obj: T | null): T | null {
	return isDesktop()
		? obj
		: null
}