import o from "@tutao/otest"
import type { NotificationFactory } from "../../../../src/common/desktop/notifications/NotificationFactory.js"
import { downcast, LazyLoaded } from "@tutao/tutanota-utils"
import { DesktopNotifier } from "../../../../src/common/desktop/notifications/DesktopNotifier.js"
import type { DesktopTray } from "../../../../src/common/desktop/tray/DesktopTray.js"
import type { NativeImage } from "electron"
import { func, matchers, object, verify, when } from "testdouble"

// just a placeholder, symbol to make sure it's the same instance
const appIcon: NativeImage = downcast(Symbol("appIcon"))
const icon1: NativeImage = downcast(Symbol("icon1"))

o.spec("DesktopNotifier", function () {
	const notificationStartDelay = 10
	let createdNotifications: { close: () => unknown; click: () => unknown; props: object }[]
	let desktopTray: DesktopTray
	let notificationFactory: NotificationFactory
	let notificationFactoryLazy: LazyLoaded<NotificationFactory>

	o.beforeEach(function () {
		createdNotifications = []
		desktopTray = object()
		notificationFactory = {
			isSupported: func(),
			makeNotification: (props, click) => {
				const n = {
					close: func<() => unknown>(),
					click,
					props,
				}
				createdNotifications.push(n)
				return () => n.close()
			},
		} as Partial<NotificationFactory> as NotificationFactory
		notificationFactoryLazy = new LazyLoaded(() => Promise.resolve(notificationFactory))
		when(notificationFactory.isSupported()).thenReturn(true)
	})

	o.test("show no notifications before call to start()", async function () {
		const notifier = new DesktopNotifier(desktopTray, notificationFactoryLazy)
		notifier.showOneShot({
			title: "Title1",
			body: "Body1",
			icon: icon1,
		})
		const createdPromise = notifier.showCountedUserNotification({
			title: "Title2",
			body: "Message",
			userId: "gn1",
			onClick: () => {},
		})
		o.check(createdNotifications).deepEquals([])
		const startPromise = notifier.start(notificationStartDelay)
		o.check(createdNotifications).deepEquals([])
		await Promise.all([startPromise, createdPromise])
		o.check(createdNotifications[0].props).deepEquals({
			title: "Title1",
			group: "oneshot",
			body: "Body1",
			icon: icon1,
		})
		verify(desktopTray.update(notifier), { times: 1 })
	})

	o.test("show no notifications when no notifications available", async function () {
		when(notificationFactory.isSupported()).thenReturn(false)

		const notifier = new DesktopNotifier(desktopTray, notificationFactoryLazy)
		notifier
			.showOneShot({
				title: "Title1",
				body: "Body1",
				icon: icon1,
			})
			.catch(() => {})
		// this should fail
		notifier.showCountedUserNotification({
			title: "Title2",
			body: "Message",
			userId: "gn1",
			onClick: () => {},
		})
		await notifier.start(notificationStartDelay)
		o.check(createdNotifications).deepEquals([])
	})

	o.test("when sending grouped notifications they are created and the badge is updated", async function () {
		const notifier = new DesktopNotifier(desktopTray, notificationFactoryLazy)
		await notifier.start(notificationStartDelay)
		await notifier.showCountedUserNotification({
			title: "Title1",
			body: "Message1",
			userId: "gn1",
			onClick: () => {},
		})
		await notifier.showCountedUserNotification({
			title: "Title2",
			body: "Message2",
			userId: "gn1",
			onClick: () => {},
		})
		await notifier.showCountedUserNotification({
			title: "Title3",
			body: "Message3",
			userId: "gn2",
			onClick: () => {},
		})
		o.check(createdNotifications.length).equals(3)
		verify(createdNotifications[0].close(), { times: 0 })
		verify(createdNotifications[1].close(), { times: 0 })
		verify(createdNotifications[2].close(), { times: 0 })
		verify(desktopTray.update(notifier), { times: 3 })
		verify(desktopTray.setBadge(), { times: 3 })
		o.check(notifier.hasNotificationForUser("gn1")).equals(true)
		o.check(notifier.hasNotificationForUser("gn2")).equals(true)
	})

	o.test("clearUserNotifications removes notifications only for one user", async function () {
		const notifier = new DesktopNotifier(desktopTray, notificationFactoryLazy)
		await notifier.start(0)
		await notifier.showCountedUserNotification({
			title: "Title1",
			body: "Message1",
			userId: "gn1",
			onClick: () => {},
		})
		await notifier.showCountedUserNotification({
			title: "Title2",
			body: "Message2",
			userId: "gn1",
			onClick: () => {},
		})
		await notifier.showCountedUserNotification({
			title: "Title3",
			body: "Message3",
			userId: "gn2",
			onClick: () => {},
		})
		const notifications = createdNotifications.slice()
		notifier.clearUserNotifications("gn1")
		verify(createdNotifications[0].close(), { times: 1 })
		verify(createdNotifications[1].close(), { times: 1 })
		verify(createdNotifications[2].close(), { times: 0 })

		o.check(notifier.hasNotificationForUser("gn1")).equals(false)
		o.check(notifier.hasNotificationForUser("gn2")).equals(true)
	})

	o.test("onNotificationClick calls processNotifications", async () => {
		const factory: NotificationFactory = object()
		const notifier = new DesktopNotifier(desktopTray, new LazyLoaded(() => Promise.resolve(factory)))

		await notifier.onNotificationClick("1234")
		verify(factory.processNotification("1234"))
	})
})
