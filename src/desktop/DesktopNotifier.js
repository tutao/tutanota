// @flow
import type {NativeImage} from 'electron'
import {Notification} from 'electron'
import {DesktopTray} from "./DesktopTray"
import type {ApplicationWindow} from "./ApplicationWindow"
import {neverNull} from "../api/common/utils/Utils"

export type NotificationResultEnum = $Values<typeof NotificationResult>;
export const NotificationResult = {
	Click: 'click',
	Close: 'close'
}

export class DesktopNotifier {
	_tray: DesktopTray;

	_canShow: boolean = false;
	pendingNotifications: Array<Function> = [];
	_notificationCloseFunctions: {[userId: ?string]: ()=>void} = {};

	/**
	 * signal that notifications can now be shown. also start showing notifications that came
	 * in before this point
	 */
	start(tray: DesktopTray): void {
		this._tray = tray

		setTimeout(() => {
			console.log("popping")
			this._canShow = true
			while (this.pendingNotifications.length > 0) {
				(this.pendingNotifications.pop())()
			}
		}, 2000)
	}

	isAvailable(): boolean {
		return Notification.isSupported()
	}

	/**
	 * Shows a simple Desktop Notification to the user, once.
	 * @param props.title title of the notification
	 * @param props.body body message. keep to less than 200 bytes for maximum compatibility.
	 * @param props.clickHandler Called when the user clicks the notification
	 * @param props.closeHandler Called when the notification was closed (by timeout or user action).
	 */
	showOneShot(props: {|
		title: string,
		body?: string,
		icon?: NativeImage
	|}): Promise<NotificationResultEnum> {
		if (!this.isAvailable()) {
			return Promise.resolve()
		}
		console.log("showing notification", this._canShow)
		return this._canShow
			? new Promise(resolve => this._makeNotification(props, res => resolve(res)))
			: new Promise(resolve => this.pendingNotifications.push(resolve))
				.then(() => new Promise(resolve => this._makeNotification(props, res => resolve(res))))
	}

	submitGroupedNotification(title: string, message: string, id: string, onClick: () => void): void {
		if ('function' === typeof this._notificationCloseFunctions[id]) { // close previous notification for this id
			this._notificationCloseFunctions[id]()
		}
		this._notificationCloseFunctions[id] = this._makeNotification({
			title: title,
			body: message,
			icon: DesktopTray.getIcon(),
		}, onClick)

		this._tray.update()
	}

	resolveGroupedNotification(id: ?string) {
		if ('function' === typeof this._notificationCloseFunctions[id]) {
			this._notificationCloseFunctions[id]()
			this._tray.update()
		}
		delete this._notificationCloseFunctions[id]

	}

	hasNotificationsForWindow(w: ApplicationWindow): boolean {
		return !!w.getUserInfo && this.hasNotificationForId(neverNull(w.getUserId()))
	}

	hasNotificationForId(id: string): boolean {
		return 'function' === typeof this._notificationCloseFunctions[id]
	}

	/**
	 *
	 * @param props
	 * @param onClick this will get called with the result
	 * @returns {function(): void} call this to dismiss the notification
	 * @private
	 */
	_makeNotification(props: {|
		title: string,
		body?: string,
		icon?: NativeImage
	|}, onClick: (res: NotificationResultEnum) => void): () => void {
		console.log("nope")

		const {title, body, icon} =
			Object.assign({}, {body: ""}, props)

		const notification = new Notification({title, icon, body})
			.on('click', () => onClick(NotificationResult.Click))
			.on('close', () => onClick(NotificationResult.Close))
		notification.show()
		//remove listeners before closing to distinguish from dismissal by user
		return () => notification.removeAllListeners().close()

	}
}
