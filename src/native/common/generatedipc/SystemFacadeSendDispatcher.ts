/* generated file, don't edit. */


import {SystemFacade} from "./SystemFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class SystemFacadeSendDispatcher implements SystemFacade {
	constructor(private readonly transport: NativeInterface) {}
	async findSuggestions(...args: Parameters<SystemFacade["findSuggestions"]>) {
		return this.transport.invokeNative("ipc",  ["SystemFacade", "findSuggestions", ...args])
	}
	async openLink(...args: Parameters<SystemFacade["openLink"]>) {
		return this.transport.invokeNative("ipc",  ["SystemFacade", "openLink", ...args])
	}
	async shareText(...args: Parameters<SystemFacade["shareText"]>) {
		return this.transport.invokeNative("ipc",  ["SystemFacade", "shareText", ...args])
	}
	async getLog(...args: Parameters<SystemFacade["getLog"]>) {
		return this.transport.invokeNative("ipc",  ["SystemFacade", "getLog", ...args])
	}
}
