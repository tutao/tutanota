/* generated file, don't edit. */

import { CommonSystemFacade } from "./CommonSystemFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class CommonSystemFacadeSendDispatcher implements CommonSystemFacade {
	constructor(private readonly transport: NativeInterface) {}
	async initializeRemoteBridge(...args: Parameters<CommonSystemFacade["initializeRemoteBridge"]>) {
		return this.transport.invokeNative("ipc", ["CommonSystemFacade", "initializeRemoteBridge", ...args])
	}
	async reload(...args: Parameters<CommonSystemFacade["reload"]>) {
		return this.transport.invokeNative("ipc", ["CommonSystemFacade", "reload", ...args])
	}
	async getLog(...args: Parameters<CommonSystemFacade["getLog"]>) {
		return this.transport.invokeNative("ipc", ["CommonSystemFacade", "getLog", ...args])
	}
}
