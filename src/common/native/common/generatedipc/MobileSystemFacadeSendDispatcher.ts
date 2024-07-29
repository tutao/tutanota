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
	async hasPermission(...args: Parameters<MobileSystemFacade["hasPermission"]>) {
		return this.transport.invokeNative("ipc", ["MobileSystemFacade", "hasPermission", ...args])
	}
	async requestPermission(...args: Parameters<MobileSystemFacade["requestPermission"]>) {
		return this.transport.invokeNative("ipc", ["MobileSystemFacade", "requestPermission", ...args])
	}
	async getAppLockMethod(...args: Parameters<MobileSystemFacade["getAppLockMethod"]>) {
		return this.transport.invokeNative("ipc", ["MobileSystemFacade", "getAppLockMethod", ...args])
	}
	async setAppLockMethod(...args: Parameters<MobileSystemFacade["setAppLockMethod"]>) {
		return this.transport.invokeNative("ipc", ["MobileSystemFacade", "setAppLockMethod", ...args])
	}
	async enforceAppLock(...args: Parameters<MobileSystemFacade["enforceAppLock"]>) {
		return this.transport.invokeNative("ipc", ["MobileSystemFacade", "enforceAppLock", ...args])
	}
	async getSupportedAppLockMethods(...args: Parameters<MobileSystemFacade["getSupportedAppLockMethods"]>) {
		return this.transport.invokeNative("ipc", ["MobileSystemFacade", "getSupportedAppLockMethods", ...args])
	}
}
