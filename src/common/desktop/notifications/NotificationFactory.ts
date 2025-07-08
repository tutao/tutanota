import type { NativeImage } from "electron"
import { type App } from "electron"
import { Notifier } from "@indutny/simple-windows-notifications"
import { DesktopConfig } from "../config/DesktopConfig"
import { BuildConfigKey } from "../config/ConfigKeys"
import { ElectronNotificationFactory } from "./ElectronNotificationFactory"
import { WindowsNotificationFactory } from "./WindowsNotificationFactory"

export type Dismisser = () => void

export interface NotificationParameters {
	title: string
	body?: string
	icon: NativeImage
	group: string
}

/** Actual implementation for creating notifications on Desktop */
export interface NotificationFactory {
	/**
	 * @returns true if notifications are supported on the current device
	 */
	isSupported(): boolean

	/**
	 * Create and emit a notification into the desktop.
	 * @param params  parameters to pass
	 * @param onClick this will get called with the result
	 * @returns call this to dismiss the notification
	 */
	makeNotification(params: NotificationParameters, onClick: () => unknown): Dismisser

	/**
	 * Process the notification with the given id (used for when receiving notification responses via protocol)
	 * @param id
	 */
	processNotification(id: string): void
}

/**
 * Creates a notification factory for the target platform
 * @param conf
 * @param app
 * @returns a promise that results in a NotificationFactory for the target platform
 */
export async function createNotificationFactory(conf: DesktopConfig, app: App): Promise<NotificationFactory> {
	if (process.platform === "win32") {
		const appId = await conf.getConst(BuildConfigKey.appUserModelId)
		console.log("appId is", appId)
		app.setAppUserModelId(appId)
		return new WindowsNotificationFactory(new Notifier(appId))
	} else {
		return new ElectronNotificationFactory()
	}
}
