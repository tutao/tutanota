//@flow
import {NotificationIcon} from "./base/icons/Icons"


export function showBrowserNotification(message: string): void {
	if ("Notification" in window) {
		if (Notification.permission !== 'denied' && Notification.permission !== 'granted') {
			Notification.requestPermission((permission) => {
				// Whatever the user answers, we make sure we store the information
				if (!('permission' in Notification)) {
					Notification.permission = permission
				}
				showIfGranted(message)
			})
		} else {
			showIfGranted(message)
		}
	}
}

function showIfGranted(message: string): void {
	if (Notification.permission === "granted") {
		try {
			let notification = new Notification("Tutanota", {
				body: message,
				icon: NotificationIcon
			})
			notification.onshow = () => {
				setTimeout(() => notification.close(), 5000)
			}
			notification.onclick = () => notification.close()
		} catch (e) {
			// new Notification() throws an error in new chrome browsers on android devices.
			// According to the error message ServiceWorkerRegistration.showNotification() should be used instead.
			// This is currently not available on our test devices, so ignore notification errors.
			// Setails: http://stackoverflow.com/questions/29774836/failed-to-construct-notification-illegal-constructor
			console.log("notification error");
		}
	}
}
