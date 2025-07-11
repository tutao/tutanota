import { NotificationResult } from "./DesktopNotifier"
import { Notifier } from "@indutny/simple-windows-notifications"
import { lazyNumberRange, takeFromMap } from "@tutao/tutanota-utils"
import { TUTA_PROTOCOL_NOTIFICATION_ACTION } from "../DesktopUtils"
import { urlEncodeHtmlTags } from "../../misc/Formatter"
import { Dismisser, NotificationFactory, NotificationParameters } from "./NotificationFactory"

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
	readonly _notifications: Map<string, (res: NotificationResult) => void> = new Map()

	constructor(private readonly notifier: Notifier, private readonly startingId = Date.now() * 1000) {
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

		// FIXME: Do we want to strip control characters, null, etc. to prevent errors? (note: escaping chars should be enough for security)
		this.notifier.show(
			`<toast launch="tuta:${TUTA_PROTOCOL_NOTIFICATION_ACTION}?id=${tag}" activationType="protocol">
<visual>
	<binding template="ToastText02">
		<text id="1">${urlEncodeHtmlTags(title)}</text>
		<text id="2">${urlEncodeHtmlTags(body)}</text>
	</binding>
</visual>
</toast>`,
			notificationIdentifier,
		)

		this._notifications.set(tag, onClick)

		return () => {
			this.notifier.remove(notificationIdentifier)
			this._notifications.delete(tag)
		}
	}

	processNotification(id: string) {
		const notificationHandler = takeFromMap(this._notifications, id)?.item
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
