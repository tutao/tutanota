/* generated file, don't edit. */

import { SearchTextInAppFacade } from "./SearchTextInAppFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class SearchTextInAppFacadeSendDispatcher implements SearchTextInAppFacade {
	constructor(private readonly transport: NativeInterface) {}
	async findInPage(...args: Parameters<SearchTextInAppFacade["findInPage"]>) {
		return this.transport.invokeNative("ipc", ["SearchTextInAppFacade", "findInPage", ...args])
	}
	async stopFindInPage(...args: Parameters<SearchTextInAppFacade["stopFindInPage"]>) {
		return this.transport.invokeNative("ipc", ["SearchTextInAppFacade", "stopFindInPage", ...args])
	}
	async setSearchOverlayState(...args: Parameters<SearchTextInAppFacade["setSearchOverlayState"]>) {
		return this.transport.invokeNative("ipc", ["SearchTextInAppFacade", "setSearchOverlayState", ...args])
	}
}
