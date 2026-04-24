/* generated file, don't edit. */

import { DesktopFacade } from "./DesktopFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class DesktopFacadeSendDispatcher implements DesktopFacade {
	constructor(private readonly transport: NativeInterface) {}
	async print(...args: Parameters<DesktopFacade["print"]>) {
		return this.transport.invokeNative("ipc", ["DesktopFacade", "print", ...args])
	}
	async showSpellcheckDropdown(...args: Parameters<DesktopFacade["showSpellcheckDropdown"]>) {
		return this.transport.invokeNative("ipc", ["DesktopFacade", "showSpellcheckDropdown", ...args])
	}
	async openFindInPage(...args: Parameters<DesktopFacade["openFindInPage"]>) {
		return this.transport.invokeNative("ipc", ["DesktopFacade", "openFindInPage", ...args])
	}
	async applySearchResultToOverlay(...args: Parameters<DesktopFacade["applySearchResultToOverlay"]>) {
		return this.transport.invokeNative("ipc", ["DesktopFacade", "applySearchResultToOverlay", ...args])
	}
	async reportError(...args: Parameters<DesktopFacade["reportError"]>) {
		return this.transport.invokeNative("ipc", ["DesktopFacade", "reportError", ...args])
	}
	async updateTargetUrl(...args: Parameters<DesktopFacade["updateTargetUrl"]>) {
		return this.transport.invokeNative("ipc", ["DesktopFacade", "updateTargetUrl", ...args])
	}
	async openCustomer(...args: Parameters<DesktopFacade["openCustomer"]>) {
		return this.transport.invokeNative("ipc", ["DesktopFacade", "openCustomer", ...args])
	}
	async addShortcuts(...args: Parameters<DesktopFacade["addShortcuts"]>) {
		return this.transport.invokeNative("ipc", ["DesktopFacade", "addShortcuts", ...args])
	}
	async appUpdateDownloaded(...args: Parameters<DesktopFacade["appUpdateDownloaded"]>) {
		return this.transport.invokeNative("ipc", ["DesktopFacade", "appUpdateDownloaded", ...args])
	}
}
