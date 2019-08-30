//@flow

import {noOp} from "../api/common/utils/Utils"
import {isApp, isDesktop} from "../api/Env"
import {NotificationIcon} from "./base/icons/Icons"

function _showNotification(title: string, options: ?NotificationOptions, onclick: (evt: Event) => any): ?Notification {
	if (Notification.permission === "granted") {
		try {
			const actualOptions: NotificationOptions = Object.assign({}, {
				icon: NotificationIcon
			}, options)
			const notification = new Notification(title, actualOptions)
			notification.onclick = onclick
			return notification
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

	// All NotificationOptions are optional anyway but it wasn't the case in Flow for some time
	// see https://github.com/facebook/flow/commit/364f0d5be27a267cf6e87af9a55dc9460e047277#diff-957520c0f46b971206faac53f37127b8
	showNotification: (title: string, options: $Shape<NotificationOptions>, onclick: (evt: Event) => any) => ?Notification

	constructor() {
		this.showNotification = (isApp() || typeof Notification === "undefined") ? noOp : _showNotification
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
			if (Notification.permission !== "denied") {
				Notification.requestPermission()
			}
		} catch (e) {
			console.log("request notification permission error", e)
		}
	}
}

export const notifications = new Notifications()
