/* generated file, don't edit. */

import { CommonNativeFacade } from "./CommonNativeFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class CommonNativeFacadeSendDispatcher implements CommonNativeFacade {
	constructor(private readonly transport: NativeInterface) {}
	async createMailEditor(...args: Parameters<CommonNativeFacade["createMailEditor"]>) {
		return this.transport.invokeNative("ipc", ["CommonNativeFacade", "createMailEditor", ...args])
	}
	async openMailBox(...args: Parameters<CommonNativeFacade["openMailBox"]>) {
		return this.transport.invokeNative("ipc", ["CommonNativeFacade", "openMailBox", ...args])
	}
	async openCalendar(...args: Parameters<CommonNativeFacade["openCalendar"]>) {
		return this.transport.invokeNative("ipc", ["CommonNativeFacade", "openCalendar", ...args])
	}
	async showAlertDialog(...args: Parameters<CommonNativeFacade["showAlertDialog"]>) {
		return this.transport.invokeNative("ipc", ["CommonNativeFacade", "showAlertDialog", ...args])
	}
	async invalidateAlarms(...args: Parameters<CommonNativeFacade["invalidateAlarms"]>) {
		return this.transport.invokeNative("ipc", ["CommonNativeFacade", "invalidateAlarms", ...args])
	}
}
