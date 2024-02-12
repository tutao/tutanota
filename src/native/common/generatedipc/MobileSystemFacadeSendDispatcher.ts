/* generated file, don't edit. */

import { MobileSystemFacade } from "./MobileSystemFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class MobileSystemFacadeSendDispatcher implements MobileSystemFacade {
	constructor(private readonly transport: NativeInterface) {}
	async goToSettings(...args: Parameters<MobileSystemFacade["goToSettings"]>) {
		return this.transport.invokeNative("ipc", ["MobileSystemFacade", "goToSettings", ...args])
	}
	async openLink(...args: Parameters<MobileSystemFacade["openLink"]>) {
		return this.transport.invokeNative("ipc", ["MobileSystemFacade", "openLink", ...args])
	}
	async shareText(...args: Parameters<MobileSystemFacade["shareText"]>) {
		return this.transport.invokeNative("ipc", ["MobileSystemFacade", "shareText", ...args])
	}
}
