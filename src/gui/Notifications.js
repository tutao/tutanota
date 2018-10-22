//@flow

import {noOp} from "../api/common/utils/Utils"
import {NotificationIcon} from "./base/icons/Icons"

function _showNotificaiton(title: string, options: ?NotificationOptions): ?Notification {
	if (Notification.permission === "granted") {
		try {
			const actualOptions: NotificationOptions = Object.assign({}, {
				icon: NotificationIcon
			}, options)
			return new Notification(title, actualOptions)
		} catch (e) {
			// new Notification() throws an error in new chrome browsers on android devices.
			// According to the error message ServiceWorkerRegistration.showNotification() should be used instead.
			// This is currently not available on our test devices, so ignore notification errors.
			// Setails: http://stackoverflow.com/questions/29774836/failed-to-construct-notification-illegal-constructor
			console.warn("notification error", e);
		}
	}
	return null
}

export class Notifications {
	/**
	 * Requests user permission if notifications are supported
	 * @returns {Promise<boolean>} resolves to "true" if we can send notifications.
	 */
	requestPermission(): Promise<boolean> {
		if (typeof Notification === "undefined") {
			return Promise.resolve(false)
		}
		if (Notification.permission === "granted") {
			return Promise.resolve(true)
		} else if (Notification.permission !== "denied") {
			return Notification.requestPermission().then((answer) => answer === "granted")
		} else {
			return Promise.resolve(false)
		}
	}

	showNotification: (title: string, options?: NotificationOptions) => ?Notification =
		typeof Notification !== "undefined" ? _showNotificaiton : noOp
}

export const notifications = new Notifications()