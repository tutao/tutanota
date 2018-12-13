// @flow
import {Notification} from 'electron'

export type NotificationResultEnum = $Values<typeof NotificationResult>;
export const NotificationResult = {
	Click: 'click',
	Close: 'close'
}

class DesktopNotifier {
	_canShow: boolean = false
	pendingNotifications: Array<Function> = []

	/**
	 * signal that notifications can now be shown. also start showing notifications that came
	 * in before this point
	 */
	start(): void {
		setTimeout(() => {
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
		icon?: string
	|}): Promise<NotificationResultEnum> {
		if (!this.isAvailable()) {
			return Promise.resolve()
		}
		let promise: Promise<NotificationResultEnum>
		if (this._canShow) {
			promise = new Promise((resolve, reject) => this._makeNotification(props, (res) => {
				return () => resolve(res)
			}))
		} else {
			promise = new Promise((resolve, reject) => this.pendingNotifications.push(resolve))
				.then(() => {
					return new Promise((resolve, reject) => {
						this._makeNotification(props, (res) => {
							return () => resolve(res)
						})
					})
				})
		}
		return promise
	}

	_makeNotification(props: {|
		title: string,
		body?: string,
		icon?: string
	|}, onClick: (res: NotificationResultEnum) => Function): void {
		const {title, body, icon} =
			Object.assign({}, {body: ""}, props)

		const oneshot = new Notification({
			"title": title,
			"icon": icon,
			"body": body,
		})
		oneshot.on('click', onClick(NotificationResult.Click))
		oneshot.on('close', onClick(NotificationResult.Close))
		oneshot.show()
	}
}

export const notifier = new DesktopNotifier()