/* generated file, don't edit. */

import { InterWindowEventFacade } from "./InterWindowEventFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class InterWindowEventFacadeSendDispatcher implements InterWindowEventFacade {
	constructor(private readonly transport: NativeInterface) {}
	async localUserDataInvalidated(...args: Parameters<InterWindowEventFacade["localUserDataInvalidated"]>) {
		return this.transport.invokeNative("ipc", ["InterWindowEventFacade", "localUserDataInvalidated", ...args])
	}
	async reloadDeviceConfig(...args: Parameters<InterWindowEventFacade["reloadDeviceConfig"]>) {
		return this.transport.invokeNative("ipc", ["InterWindowEventFacade", "reloadDeviceConfig", ...args])
	}
}
