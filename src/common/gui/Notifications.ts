import { noOp } from "@tutao/tutanota-utils"
import { isApp, isDesktop } from "../api/common/Env"
import { CalendarNotificationIcon, MailNotificationIcon } from "./base/icons/Icons.js"

export const enum NotificationType {
	Mail = "Mail",
	Calendar = "Calendar",
}

export class Notifications {
	showNotification(type: NotificationType, title: string, options?: NotificationOptions, onclick: Notification["onclick"] = noOp): Notification | null {
		if (!isApp() && typeof window.Notification !== "undefined" && window.Notification.permission === "granted") {
			try {
				const actualOptions: NotificationOptions = Object.assign(
					{},
					{
						icon: type == NotificationType.Mail ? MailNotificationIcon : CalendarNotificationIcon,
					},
					options,
				)
				const notification = new window.Notification(title, actualOptions)
				notification.onclick = onclick
				return notification
			} catch (e) {
				// new Notification() throws an error in new chrome browsers on android devices.
				// According to the error message ServiceWorkerRegistration.showNotification() should be used instead.
				// This is currently not available on our test devices, so ignore notification errors.
				// Setails: http://stackoverflow.com/questions/29774836/failed-to-construct-notification-illegal-constructor
				console.warn("notification error", e)
			}
		}

		return null
	}

	/**
	 * Requests user permission if notifications are supported
	 * @returns {Promise<boolean>} resolves to "true" if we can send notifications.
	 */
	requestPermission(): void {
		if (isDesktop() || isApp() || typeof Notification === "undefined") {
			return
		}

		try {
			if (window.Notification.permission !== "denied") {
				window.Notification.requestPermission()
			}
		} catch (e) {
			console.log("request notification permission error", e)
		}
	}
}

export const notifications: Notifications = new Notifications()
