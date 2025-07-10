import type { NativeImage } from "electron"
import { Notification } from "electron"
import { NotificationResult } from "./DesktopNotifier"
import { Notifier } from "@indutny/simple-windows-notifications"
import { TUTA_PROTOCOL_NOTIFICATION_ACTION } from "./DesktopUtils"
import { DesktopConfig } from "./config/DesktopConfig"
import { BuildConfigKey } from "./config/ConfigKeys"
import { type App } from "electron"
import { lazyNumberRange, takeFromMap } from "@tutao/tutanota-utils"

type Dismisser = () => void

export interface NotificationParameters {
	title: string
	body?: string
	icon: NativeImage
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
	 * @param onClick this will get called with the result
	 * @returns call this to dismiss the notification
	 */
	makeNotification(params: NotificationParameters, onClick: (res: NotificationResult) => void): Dismisser

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
		return new WindowsNotificationFactory(appId)
	} else {
		return new ElectronNotificationFactory()
	}
}

/**
 * Handles notifications through Electron.
 */
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

	processNotification(id: string) {
		console.warn(`ElectronNotificationFactory does not use processNotification (id = ${id})`)
	}
}

/**
 * On Windows, we need send Toast notifications, as Electron's notifications won't awaken the app when the notification goes into the notification center.
 */
class WindowsNotificationFactory implements NotificationFactory {
	private readonly notifier: Notifier
	private readonly notificationIdGenerator: Generator<number>
	private readonly notifications: Map<string, (res: NotificationResult) => void> = new Map()

	constructor(appId: string, private readonly startingId = Date.now() * 1000) {
		this.notifier = new Notifier(appId)

		// We want the number ID generator to start at a timestamp times 1000, as this will prevent stale notifications from having any meaning
		// when new notifications come in.
		this.notificationIdGenerator = lazyNumberRange(this.startingId, Number.MAX_SAFE_INTEGER)
	}

	isSupported(): boolean {
		// all supported versions of Windows have notifications
		return true
	}

	makeNotification({ title, body = "", group }: NotificationParameters, onClick: (res: NotificationResult) => void): Dismisser {
		const tag = this.nextNotificationId()
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

		this.notifications.set(tag, onClick)

		return () => {
			this.notifier.remove(notificationIdentifier)
			this.notifications.delete(tag)
		}
	}

	processNotification(id: string) {
		const notificationHandler = takeFromMap(this.notifications, id)?.item
		if (notificationHandler != null) {
			notificationHandler(NotificationResult.Click)
		} else {
			console.warn(`No notification found (id = ${id})`)
		}
	}

	private nextNotificationId(): string {
		return String(this.notificationIdGenerator.next().value)
	}
}
