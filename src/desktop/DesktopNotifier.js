// @flow
import type {NativeImage} from "electron"
import type {DesktopTray} from "./tray/DesktopTray"
import type {ApplicationWindow} from "./ApplicationWindow"
import {neverNull} from "../api/common/utils/Utils"
import type {NotificationResultEnum} from "./DesktopConstants"
import type {ElectronNotificationFactory} from "./NotificatonFactory"

export class DesktopNotifier {
	_tray: DesktopTray;

	_canShow: boolean = false;
	pendingNotifications: Array<Function> = [];
	_notificationCloseFunctions: {[userId: ?string]: ()=>void} = {};
	_notificationFactory: ElectronNotificationFactory

	constructor(tray: DesktopTray, notificationFactory: ElectronNotificationFactory) {
		this._tray = tray
		this._notificationFactory = notificationFactory
	}

	/**
	 * signal that notifications can now be shown. also start showing notifications that came
	 * in before this point
	 */
	start(delay: number): void {
		setTimeout(() => {
			this._canShow = true
			while (this.pendingNotifications.length > 0) {
				(this.pendingNotifications.shift())()
			}
		}, delay)
	}

	isAvailable(): boolean {
		return this._notificationFactory.isSupported()
	}

	/**
	 * Shows a simple Desktop Notification to the user, once.
	 * @param props.title title of the notification
	 * @param props.body body message. keep to less than 200 bytes for maximum compatibility.
	 * @param props.clickHandler Called when the user clicks the notification
	 * @param props.closeHandler Called when the notification was closed (by timeout or user action).
	 */
	async showOneShot(props: {|
		title: string,
		body?: string,
		icon?: NativeImage
	|}): Promise<NotificationResultEnum> {
		const withIcon = {title: props.title, body: props.body, icon: props.icon || await this._tray.getAppIcon()}
		if (!this.isAvailable()) {
			return Promise.reject()
		}
		return this._canShow
			? new Promise(resolve => this._notificationFactory.makeNotification(withIcon, res => resolve(res)))
			: new Promise(resolve => this.pendingNotifications.push(() => {
				this._notificationFactory.makeNotification(withIcon, res => resolve(res))
			}))
	}

	submitGroupedNotification(title: string, message: string, id: string, onClick: (NotificationResultEnum) => void): void {
		if ('function' === typeof this._notificationCloseFunctions[id]) { // close previous notification for this id
			this._notificationCloseFunctions[id]()
		}

		const showIt = async () => {
			if (!this.isAvailable()) {
				return
			}
			this._notificationCloseFunctions[id] = this._notificationFactory.makeNotification({
				title: title,
				body: message,
				icon: await this._tray.getAppIcon(),
			}, onClick)
			this._tray.setBadge()
			this._tray.update(this)
		}

		if (this._canShow) {
			showIt()
		} else {
			this.pendingNotifications.push(showIt)
		}
	}

	resolveGroupedNotification(id: ?string) {
		if ('function' === typeof this._notificationCloseFunctions[id]) {
			this._notificationCloseFunctions[id]()
			this._tray.update(this)
		}
		delete this._notificationCloseFunctions[id]
	}

	hasNotificationsForWindow(w: ApplicationWindow): boolean {
		return !!w.getUserInfo && this.hasNotificationForId(neverNull(w.getUserId()))
	}

	hasNotificationForId(id: string): boolean {
		return 'function' === typeof this._notificationCloseFunctions[id]
	}
}
