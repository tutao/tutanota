import o from "@tutao/otest"
import { Notifier } from "@indutny/simple-windows-notifications"
import { WindowsNotificationFactory } from "../../../../src/common/desktop/notifications/WindowsNotificationFactory"
import { matchers, object, verify } from "testdouble"
import { TUTA_PROTOCOL_NOTIFICATION_ACTION } from "../../../../src/common/desktop/DesktopUtils"
import NativeImage = Electron.NativeImage

o.spec("WindowsNotificationFactory", () => {
	const startingId = 1234

	let notifier: Notifier
	let factory: WindowsNotificationFactory

	o.beforeEach(() => {
		notifier = object()
		factory = new WindowsNotificationFactory(notifier, startingId)
	})

	o.test("makes notification", () => {
		const params = {
			title: "My notification!",
			body: "Some body!",
			group: "somegroup",
			icon: object<NativeImage>(),
		}
		factory.makeNotification(params, () => {
			throw new Error("this notification's click handler is not implemented")
		})

		const tag = String(startingId)

		verify(
			notifier.show(
				matchers.argThat((s: string) => {
					return (
						s.startsWith(`<toast launch="tuta:${TUTA_PROTOCOL_NOTIFICATION_ACTION}?id=${tag}" activationType="protocol">`) &&
						s.includes(`<text id="1">${params.title}</text>`) &&
						s.includes(`<text id="2">${params.body}</text>`)
					)
				}),
				{
					tag,
					group: "somegroup",
				},
			),
		)

		o.check(factory._notifications.has(tag))
	})

	o.test("handles dubious notifications", () => {
		const params = {
			title: "My notification! <3",
			body: `Some body!</text><text id="3"><!-- something dodgy here --></text>`,
			group: "somegroup",
			icon: object<NativeImage>(),
		}
		factory.makeNotification(params, () => {
			throw new Error("this notification's click handler is not implemented")
		})

		const tag = String(startingId)

		verify(
			notifier.show(
				matchers.argThat((s: string) => {
					return (
						s.startsWith(`<toast launch="tuta:${TUTA_PROTOCOL_NOTIFICATION_ACTION}?id=${tag}" activationType="protocol">`) &&
						s.includes(`<text id="1">My notification! &lt;3</text>`) && // needs to be hardcoded for this example
						s.includes(`<text id="2">Some body!&lt;/text&gt;&lt;text id=&quot;3&quot;&gt;&lt;!-- something dodgy here --&gt;&lt;/text&gt;</text>`)
					)
				}),
				{
					tag,
					group: "somegroup",
				},
			),
		)

		o.check(factory._notifications.has(tag))
	})

	o.test("dismisses notification", () => {
		const params = {
			title: "My notification!",
			body: "Some body!",
			group: "somegroup",
			icon: object<NativeImage>(),
		}

		const dismisser = factory.makeNotification(params, () => {
			throw new Error("this notification's click handler is not implemented")
		})

		const tag = String(startingId)
		o.check(factory._notifications.has(tag))
		verify(notifier.remove({ tag, group: "somegroup" }), { times: 0 })
		dismisser()
		o.check(!factory._notifications.has(tag))
		verify(notifier.remove({ tag, group: "somegroup" }), { times: 1 })
	})

	o.test("runs notification", () => {
		const params = {
			title: "My notification!",
			body: "Some body!",
			group: "somegroup",
			icon: object<NativeImage>(),
		}

		let passes = false
		factory.makeNotification(params, () => {
			passes = true
		})

		const tag = String(startingId)
		o.check(factory._notifications.has(tag))
		verify(notifier.remove({ tag, group: "somegroup" }), { times: 0 })
		factory.processNotification(tag)
		o.check(!factory._notifications.has(tag))
		verify(notifier.remove({ tag, group: "somegroup" }), { times: 0 })
		o.check(passes)
	})

	o.test("dismisses with offset", () => {
		const params = {
			title: "My notification!",
			body: "Some body!",
			group: "somegroup",
			icon: object<NativeImage>(),
		}

		const offset = 10

		// make some at the start
		for (let i = 0; i < offset; i++) {
			factory.makeNotification(params, () => {
				throw new Error("this notification's click handler is not implemented")
			})
		}

		const dismisser = factory.makeNotification(params, () => {
			throw new Error("this notification's click handler is not implemented")
		})

		// make some more
		for (let i = 0; i < offset; i++) {
			factory.makeNotification(params, () => {
				throw new Error("this notification's click handler is not implemented")
			})
		}

		const tag = String(startingId + offset)
		o.check(factory._notifications.has(tag))
		verify(notifier.remove({ tag, group: "somegroup" }), { times: 0 })
		dismisser()
		o.check(!factory._notifications.has(tag))
		verify(notifier.remove({ tag, group: "somegroup" }), { times: 1 })
	})

	o.test("automatically dismisses after lots of notifications", () => {
		const params = {
			title: "My notification!",
			body: "Some body!",
			group: "somegroup",
			icon: object<NativeImage>(),
		}

		const offset = 1000

		// make some at the start
		for (let i = 0; i < offset; i++) {
			factory.makeNotification(params, () => {
				throw new Error("this notification's click handler is not implemented")
			})
		}

		o.check(factory._notifications.size).equals(1000)
		o.check(factory._notifications.get("0") != null)

		factory.makeNotification(params, () => {
			throw new Error("this notification's click handler is not implemented")
		})

		o.check(factory._notifications.size).equals(1000)
		o.check(factory._notifications.get("0") == null)
	})
})
