import type { NativeImage } from "electron"
import { Notification } from "electron"
import { NotificationResult } from "./DesktopNotifier"
import { Notifier } from "@indutny/simple-windows-notifications"
import { TUTA_PROTOCOL_NOTIFICATION_ACTION } from "./DesktopUtils"

type Dismisser = () => void

export class ElectronNotificationFactory {
	private readonly notifier: Notifier

	constructor(appId: string) {
		this.notifier = new Notifier(appId)
	}

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
		{
			title,
			body = "",
			tag,
			group,
		}: {
			title: string
			body?: string
			icon: NativeImage
			tag: string
			group: string
		},
		onClick: (res: NotificationResult) => void,
	): Dismisser {
		const notificationIdentifier = { tag, group }
		// FIXME: wildly insecure
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

		// const { title, body, icon } = Object.assign(
		// 	{},
		// 	{
		// 		body: "",
		// 	},
		// 	props,
		// )
		// const notification = new Notification({
		// 	title,
		// 	icon,
		// 	body,
		// })
		// 	.on("click", () => onClick(NotificationResult.Click))
		// 	.on("close", () => onClick(NotificationResult.Close))
		// notification.show()
		// // remove listeners before closing to distinguish from dismissal by user
		// return () => notification.removeAllListeners().close()
	}
}
