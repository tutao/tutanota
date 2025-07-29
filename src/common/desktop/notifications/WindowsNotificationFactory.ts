import { Notifier } from "@indutny/simple-windows-notifications"
import { assertNotNull, lazyNumberRange, noOp, takeFromMap } from "@tutao/tutanota-utils"
import { TUTA_PROTOCOL_NOTIFICATION_ACTION } from "../DesktopUtils"
import { urlEncodeHtmlTags } from "../../misc/Formatter"
import { Dismisser, NotificationFactory, NotificationParameters } from "./NotificationFactory"

// Maximum notifications we are able to keep track of (to avoid excessive amounts of notifications leaking memory)
const MAX_NOTIFICATIONS: number = 1000

interface WindowsNotificationIdentifier {
	tag: string
	group: string
}

interface WindowsNotification {
	identifier: WindowsNotificationIdentifier
	callback: () => unknown
}

/**
 * On Windows, we need send Toast notifications, as Electron's notifications won't awaken the app when the notification
 * goes into the notification center.
 *
 * You should not instantiate this directly, as it might not be appropriate for the current platform. Use
 * {@link createNotificationFactory} for this.
 */
export class WindowsNotificationFactory implements NotificationFactory {
	private readonly notificationIdGenerator: Generator<number>

	// VisibleForTesting
	readonly _notifications: Map<string, WindowsNotification> = new Map()

	constructor(
		private readonly notifier: Notifier,
		private readonly startingId = Date.now() * 1000,
	) {
		// We want the number ID generator to start at a timestamp times 1000, as this will prevent stale notifications from having any meaning
		// when new notifications come in.
		this.notificationIdGenerator = lazyNumberRange(this.startingId, Number.MAX_SAFE_INTEGER)
	}

	isSupported(): boolean {
		// all supported versions of Windows have notifications
		return true
	}

	makeNotification({ title, body = "", group }: NotificationParameters, onClick: () => unknown): Dismisser {
		const tag = this.nextNotificationId()
		const notificationIdentifier = { tag, group }

		const toastXML = `<toast launch="tuta:${TUTA_PROTOCOL_NOTIFICATION_ACTION}?id=${tag}" activationType="protocol">
<visual>
	<binding template="ToastText02">
		<text id="1">${urlEncodeHtmlTags(title)}</text>
		<text id="2">${urlEncodeHtmlTags(body)}</text>
	</binding>
</visual>
</toast>`

		try {
			this.notifier.show(toastXML, notificationIdentifier)
		} catch (e) {
			console.warn("Failed to spawn a Windows notification", e)
			return noOp
		}

		this._notifications.set(tag, {
			identifier: notificationIdentifier,
			callback: onClick,
		})

		if (this._notifications.size > MAX_NOTIFICATIONS) {
			const first: WindowsNotificationIdentifier = assertNotNull(this._notifications.values().next().value).identifier
			this.dismissNotification(first)
		}

		return () => this.dismissNotification(notificationIdentifier)
	}

	processNotification(id: string) {
		const notificationHandler = takeFromMap(this._notifications, id)?.item
		if (notificationHandler != null) {
			notificationHandler.callback()
		} else {
			console.warn(`No notification found (id = ${id})`)
		}
	}

	private dismissNotification(notificationIdentifier: { tag: string; group: string }) {
		this._notifications.delete(notificationIdentifier.tag)
		try {
			this.notifier.remove(notificationIdentifier)
		} catch (e) {
			console.warn("Failed to dismiss a Windows notification", e)
		}
	}

	private nextNotificationId(): string {
		return String(this.notificationIdGenerator.next().value)
	}
}
