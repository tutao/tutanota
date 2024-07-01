/* generated file, don't edit. */

import { DesktopSystemFacade } from "./DesktopSystemFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class DesktopSystemFacadeSendDispatcher implements DesktopSystemFacade {
	constructor(private readonly transport: NativeInterface) {}
	async openNewWindow(...args: Parameters<DesktopSystemFacade["openNewWindow"]>) {
		return this.transport.invokeNative("ipc", ["DesktopSystemFacade", "openNewWindow", ...args])
	}
	async focusApplicationWindow(...args: Parameters<DesktopSystemFacade["focusApplicationWindow"]>) {
		return this.transport.invokeNative("ipc", ["DesktopSystemFacade", "focusApplicationWindow", ...args])
	}
	async sendSocketMessage(...args: Parameters<DesktopSystemFacade["sendSocketMessage"]>) {
		return this.transport.invokeNative("ipc", ["DesktopSystemFacade", "sendSocketMessage", ...args])
	}
}
