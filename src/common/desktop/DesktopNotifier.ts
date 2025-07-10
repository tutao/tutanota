import type { NativeImage } from "electron"
import type { DesktopTray } from "./tray/DesktopTray"
import type { ApplicationWindow } from "./ApplicationWindow"
import type { NotificationFactory } from "./NotificationFactory"

import { newPromise } from "@tutao/tutanota-utils/dist/Utils"
import { LazyLoaded, lazyNumberRange } from "@tutao/tutanota-utils"

export const enum NotificationResult {
	Click = "click",
	Close = "close",
}

export class DesktopNotifier {
	_tray: DesktopTray
	_canShow: boolean = false
	pendingNotifications: Array<(...args: Array<any>) => any> = []
	_notificationCloseFunctions: { [userId in string]?: () => void } = {}

	constructor(
		tray: DesktopTray,
		private readonly notificationFactory: LazyLoaded<NotificationFactory>,
		private readonly startingId: number = Date.now() * 1000,
	) {
		this._tray = tray
	}

	/**
	 * signal that notifications can now be shown. also start showing notifications that came
	 * in before this point
	 */
	start(delay: number): void {
		setTimeout(() => {
			this._canShow = true

			while (this.pendingNotifications.length > 0) {
				this.pendingNotifications.shift()?.()
			}
		}, delay)
	}

	/**
	 * Shows a simple Desktop Notification to the user, once.
	 * @param props.title title of the notification
	 * @param props.body body message. keep to less than 200 bytes for maximum compatibility.
	 * @param props.clickHandler Called when the user clicks the notification
	 * @param props.closeHandler Called when the notification was closed (by timeout or user action).
	 */
	async showOneShot(props: { title: string; body?: string; icon?: NativeImage }): Promise<NotificationResult> {
		const params = {
			title: props.title,
			body: props.body,
			icon: props.icon || (await this._tray.getAppIcon()),
			group: "oneshot",
		}

		const factory = await this.notificationFactory.getAsync()

		if (!factory.isSupported()) {
			return Promise.reject()
		}

		return newPromise((resolve) => {
			if (this._canShow) {
				factory.makeNotification(params, (res) => resolve(res))
			} else {
				this.pendingNotifications.push(() => {
					factory.makeNotification(params, (res) => resolve(res))
				})
			}
		})
	}

	submitGroupedNotification(title: string, message: string, id: string, onClick: (arg0: NotificationResult) => void): void {
		if ("function" === typeof this._notificationCloseFunctions[id]) {
			// close previous notification for this id
			this._notificationCloseFunctions[id]?.()
		}

		const showIt = async () => {
			const factory = await this.notificationFactory.getAsync()

			if (!factory.isSupported()) {
				return
			}

			this._notificationCloseFunctions[id] = factory.makeNotification(
				{
					title: title,
					body: message,
					icon: await this._tray.getAppIcon(),
					group: id,
				},
				onClick,
			)

			this._tray.setBadge()

			this._tray.update(this)
		}

		if (this._canShow) {
			showIt()
		} else {
			this.pendingNotifications.push(showIt)
		}
	}

	resolveGroupedNotification(userId: string | null) {
		if (userId && "function" === typeof this._notificationCloseFunctions[userId]) {
			this._notificationCloseFunctions[userId]?.()

			this._tray.update(this)

			delete this._notificationCloseFunctions[userId]
		}
	}

	hasNotificationsForWindow(w: ApplicationWindow): boolean {
		const userId = w.getUserId()
		return userId != null && this.hasNotificationForId(userId)
	}

	hasNotificationForId(id: string): boolean {
		return "function" === typeof this._notificationCloseFunctions[id]
	}

	onNotificationClick(id: string) {
		this.notificationFactory.getAsync().then((factory) => factory.processNotification(id))
	}
}
