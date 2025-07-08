import type { NativeImage } from "electron"
import type { DesktopTray } from "../tray/DesktopTray"
import type { ApplicationWindow } from "../ApplicationWindow"
import type { Dismisser, NotificationFactory } from "./NotificationFactory"
import { defer, DeferredObject, getFromMap, isEmpty, LazyLoaded, noOp } from "@tutao/tutanota-utils"

/**
 * Send and manipulate notifications on desktop.
 */
export class DesktopNotifier {
	private readonly initPromise: DeferredObject<void> = defer()
	private readonly notificationDismissersPerUser: Map<string, Dismisser[]> = new Map()

	constructor(
		private readonly tray: DesktopTray,
		private readonly notificationFactory: LazyLoaded<NotificationFactory>,
	) {}

	/**
	 * signal that notifications can now be shown. also start showing notifications that came
	 * in before this point
	 */
	start(delay: number): Promise<void> {
		setTimeout(() => {
			this.initPromise.resolve()
		}, delay)
		return this.initPromise.promise
	}

	/**
	 * Shows a simple Desktop Notification to the user, once.
	 * @param props.title title of the notification
	 * @param props.body body message. keep to less than 200 bytes for maximum compatibility.
	 * @param props.clickHandler Called when the user clicks the notification
	 * @param props.closeHandler Called when the notification was closed (by timeout or user action).
	 */
	async showOneShot(props: { title: string; body?: string; icon?: NativeImage; onClick?: () => unknown }): Promise<void> {
		const params = {
			title: props.title,
			body: props.body,
			icon: props.icon || (await this.tray.getAppIcon()),
			group: "oneshot",
		}

		const factory = await this.notificationFactory.getAsync()

		if (!factory.isSupported()) {
			throw new Error("Notifications are not supported")
		}

		const onClick = props.onClick ?? noOp

		await this.initPromise.promise

		factory.makeNotification(params, onClick)
	}

	/**
	 * Shows a notification that is associated with a specific user and will show up as a badge/counter.
	 */
	async showCountedUserNotification({
		title,
		body,
		onClick,
		userId,
	}: {
		title: string
		body: string
		userId: string
		onClick: () => unknown
	}): Promise<void> {
		const factory = await this.notificationFactory.getAsync()

		if (!factory.isSupported()) {
			return
		}

		await this.initPromise.promise

		const dismisser = factory.makeNotification(
			{
				title,
				body,
				icon: await this.tray.getAppIcon(),
				group: userId,
			},
			onClick,
		)

		getFromMap(this.notificationDismissersPerUser, userId, () => []).push(dismisser)
		this.tray.setBadge()

		this.tray.update(this)
	}

	clearUserNotifications(userId: string) {
		const grouped = this.notificationDismissersPerUser.get(userId)
		if (grouped == null) {
			return
		}
		for (const dismisser of grouped) {
			dismisser()
		}
		this.tray.update(this)
		this.notificationDismissersPerUser.delete(userId)
	}

	hasNotificationsForWindow(w: ApplicationWindow): boolean {
		const userId = w.getUserId()
		return userId != null && this.hasNotificationForUser(userId)
	}

	hasNotificationForUser(userId: string): boolean {
		const grouped = this.notificationDismissersPerUser.get(userId)
		return grouped != null && !isEmpty(grouped)
	}

	async onNotificationClick(id: string): Promise<void> {
		const factory = await this.notificationFactory.getAsync()
		factory.processNotification(id)
	}
}
