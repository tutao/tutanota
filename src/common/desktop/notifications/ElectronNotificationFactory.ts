import { Notification } from "electron"
import { NotificationResult } from "./DesktopNotifier"
import { Dismisser, NotificationFactory, NotificationParameters } from "./NotificationFactory"

/**
 * Handles notifications through Electron.
 *
 * You should not instantiate this directly, as it might not be appropriate for the current platform. Use
 * {@link createNotificationFactory} for this.
 */
export class ElectronNotificationFactory implements NotificationFactory {
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
