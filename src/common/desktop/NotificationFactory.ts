import type { NativeImage } from "electron"
import { Notification } from "electron"
import { NotificationResult } from "./DesktopNotifier"
import { Notifier } from "@indutny/simple-windows-notifications"
import { TUTA_PROTOCOL_NOTIFICATION_ACTION } from "./DesktopUtils"
import { DesktopConfig } from "./config/DesktopConfig"
import { BuildConfigKey } from "./config/ConfigKeys"
import { type App } from "electron"

type Dismisser = () => void

export interface NotificationParameters {
	title: string
	body?: string
	icon: NativeImage
	tag: string
	group: string
}

export interface NotificationFactory {
	/**
	 * @returns true if notifications are supported on the current device
	 */
	isSupported(): boolean

	/**
	 * Create and emit a notification into the desktop.
	 * @param params  parameters to pass
	 * @param onClick this will get called with the result (ignored on Windows)
	 * @returns call this to dismiss the notification
	 */
	makeNotification(params: NotificationParameters, onClick: (res: NotificationResult) => void): Dismisser
}

export async function createNotificationFactory(conf: DesktopConfig, app: App): Promise<NotificationFactory> {
	if (process.platform === "win32") {
		const appId = await conf.getConst(BuildConfigKey.appUserModelId)
		console.log("appId is", appId)
		app.setAppUserModelId(appId)
		return new WindowsNotificationFactory(appId)
	} else {
		return new ElectronNotificationFactory()
	}
}

class ElectronNotificationFactory implements NotificationFactory {
	isSupported(): boolean {
		return Notification.isSupported()
	}

	makeNotification({ title, body, icon }: NotificationParameters, onClick: (res: NotificationResult) => void): Dismisser {
		const notification = new Notification({
			title,
			icon,
			body,
		})
			.on("click", () => onClick(NotificationResult.Click))
			.on("close", () => onClick(NotificationResult.Close))
		notification.show()

		// remove listeners before closing to distinguish from dismissal by user
		return () => notification.removeAllListeners().close()
	}
}

/**
 * On Windows, we need send Toast notifications, as Electron's notifications won't awaken the app when the notification goes into the notification center.
 */
class WindowsNotificationFactory implements NotificationFactory {
	private readonly notifier: Notifier

	constructor(appId: string) {
		this.notifier = new Notifier(appId)
	}

	isSupported(): boolean {
		// all supported versions of Windows have notifications
		return true
	}

	makeNotification({ title, body = "", icon, tag, group }: NotificationParameters, onClick: (res: NotificationResult) => void): Dismisser {
		const notificationIdentifier = { tag, group }

		// FIXME: wildly insecure; need to sanitize title and body (i.e. replace < with &lt; and strip invalid chars like 0x00 and control chars to prevent errors)
		this.notifier.show(
			`
<toast launch="tuta:${TUTA_PROTOCOL_NOTIFICATION_ACTION}?id=${tag}" activationType="protocol">
<visual>
	<binding template="ToastText02">
		<text id="1">${title}</text>
		<text id="2">${body}</text>
	</binding>
</visual>
</toast>`,
			notificationIdentifier,
		)

		return () => this.notifier.remove(notificationIdentifier)
	}
}
