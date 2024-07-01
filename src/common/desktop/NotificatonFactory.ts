import type { NativeImage } from "electron"
import { Notification } from "electron"
import { NotificationResult } from "./DesktopNotifier"

type Dismisser = () => void

export class ElectronNotificationFactory {
	isSupported(): boolean {
		return Notification.isSupported()
	}

	/**
	 *
	 * @param props
	 * @param onClick this will get called with the result
	 * @returns call this to dismiss the notification
	 */
	makeNotification(
		props: {
			title: string
			body?: string
			icon: NativeImage
		},
		onClick: (res: NotificationResult) => void,
	): Dismisser {
		const { title, body, icon } = Object.assign(
			{},
			{
				body: "",
			},
			props,
		)
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
