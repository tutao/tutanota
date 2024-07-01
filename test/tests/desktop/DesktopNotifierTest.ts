import o from "@tutao/otest"
import type { ElectronNotificationFactory } from "../../../src/common/desktop/NotificatonFactory.js"
import { defer, delay, downcast } from "@tutao/tutanota-utils"
import { DesktopNotifier } from "../../../src/common/desktop/DesktopNotifier.js"
import type { DesktopTray } from "../../../src/common/desktop/tray/DesktopTray.js"
import type { NativeImage } from "electron"
import { spy } from "@tutao/tutanota-test-utils"

// just a placeholder, symbol to make sure it's the same instance
const appIcon: NativeImage = downcast(Symbol("appIcon"))
const icon1: NativeImage = downcast(Symbol("icon1"))

o.spec("Desktop Notifier Test", function () {
	const notificationStartDelay = 10
	let createdNotifications
	let desktopTray: DesktopTray
	let notificationFactory: ElectronNotificationFactory
	let notificationMade = defer<void>()
	o.beforeEach(function () {
		createdNotifications = []
		desktopTray = downcast({
			getAppIcon: () => appIcon,
			update: spy(() => {}),
			setBadge: spy(() => {}),
		})
		notificationFactory = downcast({
			isSupported: () => true,
			makeNotification: spy((props, click) => {
				const n = {
					close: spy(),
					click,
				}
				createdNotifications.push(n)
				notificationMade.resolve()
				return () => n.close()
			}),
		})
	})
	o("show no notifications before call to start()", async function () {
		const notifier = new DesktopNotifier(desktopTray, notificationFactory)
		notifier.showOneShot({
			title: "Title1",
			body: "Body1",
			icon: icon1,
		})
		notifier.submitGroupedNotification("Title2", "Message", "gn1", () => {})
		o(notificationFactory.makeNotification.calls).deepEquals([])
		notifier.start(notificationStartDelay)
		setImmediate(() => {
			o(notificationFactory.makeNotification.calls).deepEquals([])
		})
		await delay(notificationStartDelay * 3)
		o(notificationFactory.makeNotification.calls[0][0]).deepEquals({
			title: "Title1",
			body: "Body1",
			icon: icon1,
		})
		o(desktopTray.update.callCount).equals(1)
	})
	o("show no notifications when no notifications available", async function () {
		downcast(notificationFactory).isSupported = () => false

		const notifier = new DesktopNotifier(desktopTray, notificationFactory)
		notifier
			.showOneShot({
				title: "Title1",
				body: "Body1",
				icon: icon1,
			})
			.catch(() => {})
		// this should fail
		notifier.submitGroupedNotification("Title2", "Message", "gn1", () => {})
		notifier.start(notificationStartDelay)
		await delay(notificationStartDelay * 1.1)
		o(notificationFactory.makeNotification.callCount).equals(0)
	})
	o("grouped notifications replace each other", async function () {
		const notifier = new DesktopNotifier(desktopTray, notificationFactory)
		notifier.start(notificationStartDelay)
		await delay(notificationStartDelay * 1.1)
		// Notice the same "gn1". The second replaces the first and calls its "close"
		notifier.submitGroupedNotification("Title1", "Message1", "gn1", () => {})
		await notificationMade.promise
		notificationMade = defer()
		notifier.submitGroupedNotification("Title2", "Message2", "gn1", () => {})
		await notificationMade.promise
		notificationMade = defer()
		notifier.submitGroupedNotification("Title3", "Message3", "gn2", () => {})
		await notificationMade.promise
		o(createdNotifications.length).equals(3)
		o(createdNotifications[0].close.callCount).equals(1)
		o(createdNotifications[1].close.callCount).equals(0)
		o(createdNotifications[1].close.callCount).equals(0)
		o(desktopTray.update.callCount).equals(3)
		o(desktopTray.setBadge.callCount).equals(3)
		o(notifier.hasNotificationForId("gn1")).equals(true)
		o(notifier.hasNotificationForId("gn2")).equals(true)
	})
	o("grouped notification disappear after clicking", async function () {
		const notifier = new DesktopNotifier(desktopTray, notificationFactory)
		notifier.start(notificationStartDelay)
		const clickHandler = spy(() => notifier.resolveGroupedNotification("gn1"))
		notifier.submitGroupedNotification("Title1", "Message1", "gn1", clickHandler)
		// not shown yet
		o(createdNotifications.length).equals(0)
		o(desktopTray.update.callCount).equals(0)
		o(notifier.hasNotificationForId("gn1")).equals(false)
		o(clickHandler.callCount).equals(0)
		await delay(notificationStartDelay * 2)
		createdNotifications[0].click()
		// shown and removed
		o(clickHandler.callCount).equals(1)
		o(createdNotifications.length).equals(1)
		o(createdNotifications[0].close.callCount).equals(1)
		o(desktopTray.update.callCount).equals(2)
		o(desktopTray.setBadge.callCount).equals(1)
		o(notifier.hasNotificationForId("gn1")).equals(false)
	})
})
