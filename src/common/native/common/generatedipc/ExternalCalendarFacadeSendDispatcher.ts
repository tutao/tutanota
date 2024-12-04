/* generated file, don't edit. */

import { ExternalCalendarFacade } from "./ExternalCalendarFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class ExternalCalendarFacadeSendDispatcher implements ExternalCalendarFacade {
	constructor(private readonly transport: NativeInterface) {}
	async fetchExternalCalendar(...args: Parameters<ExternalCalendarFacade["fetchExternalCalendar"]>) {
		return this.transport.invokeNative("ipc", ["ExternalCalendarFacade", "fetchExternalCalendar", ...args])
	}
}
