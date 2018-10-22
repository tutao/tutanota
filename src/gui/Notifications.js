//@flow

import {noOp} from "../api/common/utils/Utils"
import {NotificationIcon} from "./base/icons/Icons"

/**
 * Requests user permission if notifications are supported
 * @returns {Promise<boolean>} resolves to "true" if we can send notifications.
 */
export function requestPermission(): Promise<boolean> {
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

function _showNotificaiton(title: string, body: ?string, onClick: () => void) {
	if (Notification.permission === "granted") {
		try {
			const options: NotificationOptions = {
				icon: NotificationIcon
			}
			if (body != null) options.body = body // so that null will not be converted to string
			let notification = new Notification(title, options)
			notification.onclick = onClick
		} catch (e) {
			// new Notification() throws an error in new chrome browsers on android devices.
			// According to the error message ServiceWorkerRegistration.showNotification() should be used instead.
			// This is currently not available on our test devices, so ignore notification errors.
			// Setails: http://stackoverflow.com/questions/29774836/failed-to-construct-notification-illegal-constructor
			console.warn("notification error", e);
		}
	}
}

export const showNotification: (title: string, body: ?string, onclick: () => void) => void =
	typeof Notification !== "undefined" ? _showNotificaiton : noOp