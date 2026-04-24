/* generated file, don't edit. */

import { NativePushFacade } from "./NativePushFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativePushFacadeSendDispatcher implements NativePushFacade {
	constructor(private readonly transport: NativeInterface) {}
	async getPushIdentifier(...args: Parameters<NativePushFacade["getPushIdentifier"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "getPushIdentifier", ...args])
	}
	async storePushIdentifierLocally(...args: Parameters<NativePushFacade["storePushIdentifierLocally"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "storePushIdentifierLocally", ...args])
	}
	async removeUser(...args: Parameters<NativePushFacade["removeUser"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "removeUser", ...args])
	}
	async initPushNotifications(...args: Parameters<NativePushFacade["initPushNotifications"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "initPushNotifications", ...args])
	}
	async closePushNotifications(...args: Parameters<NativePushFacade["closePushNotifications"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "closePushNotifications", ...args])
	}
	async scheduleAlarms(...args: Parameters<NativePushFacade["scheduleAlarms"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "scheduleAlarms", ...args])
	}
	async invalidateAlarmsForUser(...args: Parameters<NativePushFacade["invalidateAlarmsForUser"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "invalidateAlarmsForUser", ...args])
	}
	async setExtendedNotificationConfig(...args: Parameters<NativePushFacade["setExtendedNotificationConfig"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "setExtendedNotificationConfig", ...args])
	}
	async getExtendedNotificationConfig(...args: Parameters<NativePushFacade["getExtendedNotificationConfig"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "getExtendedNotificationConfig", ...args])
	}
	async setReceiveCalendarNotificationConfig(...args: Parameters<NativePushFacade["setReceiveCalendarNotificationConfig"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "setReceiveCalendarNotificationConfig", ...args])
	}
	async getReceiveCalendarNotificationConfig(...args: Parameters<NativePushFacade["getReceiveCalendarNotificationConfig"]>) {
		return this.transport.invokeNative("ipc", ["NativePushFacade", "getReceiveCalendarNotificationConfig", ...args])
	}
}
