// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

o.spec("Desktop Notifier Test", (done, timeout) => {
	o.beforeEach(n.enable)
	o.afterEach(n.disable)
	o.specTimeout(2500)

	const notificationStartDelay = 10

	const electron = {
		app: {},
		Notification: n.classify({
			prototype: {
				on: function () {return this},
				show: function () {},
				removeAllListeners: function () {return this},
				close: function () {}
			},
			statics: {
				isSupported: () => true
			}
		})
	}

	const desktopTray = {
		DesktopTray: {
			getIcon: () => {return 'this is an icon'}
		},
		update: () => {}
	}

	o("show no notifications before call to start()", done => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		n.mock('./DesktopTray', desktopTray).set()

		// instances
		const desktopTrayMock = n.mock("__tray", desktopTray).set()

		const {DesktopNotifier} = n.subject('../../src/desktop/DesktopNotifier.js')
		const notifier = new DesktopNotifier()

		notifier.showOneShot({title: "Title1", body: "Body1", icon: "Icon1"})
		notifier.submitGroupedNotification("Title2", "Message", "gn1", () => {})

		o(electronMock.Notification.mockedInstances.length).equals(0)

		notifier.start(desktopTrayMock, notificationStartDelay)

		setImmediate(() => {
			o(electronMock.Notification.mockedInstances.length).equals(0)
		})

		setTimeout(() => {
			o(electronMock.Notification.mockedInstances.length).equals(2)
			o(electronMock.Notification.args).deepEquals([{title: "Title1", body: "Body1", icon: "Icon1"}])
			o(desktopTrayMock.update.callCount).equals(1)
			done()
		}, notificationStartDelay * 1.1)
	})

	o("show no notifications when no notifications available", done => {

		// node modules
		const electronMock = n.mock("electron", electron)
		                      .with({
			                      Notification: n.classify({
				                      prototype: {
					                      on: function () {return this},
					                      show: function () {},
					                      removeAllListeners: function () {return this},
					                      close: function () {}
				                      },
				                      statics: {
					                      isSupported: () => false
				                      }
			                      })
		                      })
		                      .set()

		// our modules
		n.mock('./DesktopTray', desktopTray).set()

		// instances
		const desktopTrayMock = n.mock("__tray", desktopTray).set()

		const {DesktopNotifier} = n.subject('../../src/desktop/DesktopNotifier.js')
		const notifier = new DesktopNotifier()

		notifier.showOneShot({title: "Title1", body: "Body1", icon: "Icon1"})
		notifier.submitGroupedNotification("Title2", "Message", "gn1", () => {})

		notifier.start(desktopTrayMock, notificationStartDelay)

		setTimeout(() => {
			o(electronMock.Notification.mockedInstances.length).equals(0)
			done()
		}, notificationStartDelay * 1.1)
	})

	o("grouped notifications replace each other", done => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		n.mock('./DesktopTray', desktopTray).set()

		// instances
		const desktopTrayMock = n.mock("__tray", desktopTray).set()

		const {DesktopNotifier} = n.subject('../../src/desktop/DesktopNotifier.js')
		const notifier = new DesktopNotifier()

		notifier.start(desktopTrayMock, notificationStartDelay)
		setTimeout(() => {
			notifier.submitGroupedNotification("Title1", "Message1", "gn1", () => {})
			notifier.submitGroupedNotification("Title2", "Message2", "gn1", () => {})
			notifier.submitGroupedNotification("Title3", "Message3", "gn2", () => {})
			o(electronMock.Notification.mockedInstances.length).equals(3)
			o(electronMock.Notification.mockedInstances[0].close.callCount).equals(1)
			o(electronMock.Notification.mockedInstances[1].close.callCount).equals(0)
			o(electronMock.Notification.mockedInstances[2].close.callCount).equals(0)

			o(desktopTrayMock.update.callCount).equals(3)
			o(notifier.hasNotificationForId("gn1")).equals(true)
			o(notifier.hasNotificationForId("gn2")).equals(true)
			done()
		}, notificationStartDelay * 1.1)
	})

	o("grouped notification disappear after clicking", done => {
		// node modules
		const electronMock = n.mock("electron", electron)
		                      .with({
			                      Notification: n.classify({
				                      prototype: {
					                      on: function (ev: string, cb: ()=>void) {
						                      if (ev === "click") {
							                      setImmediate(() => cb())
						                      }
						                      return this
					                      },
					                      show: function () {},
					                      removeAllListeners: function () {return this},
					                      close: function () {}
				                      },
				                      statics: {
					                      isSupported: () => true
				                      }
			                      })
		                      })
		                      .set()

		// our modules
		n.mock('./DesktopTray', desktopTray).set()

		// instances
		const desktopTrayMock = n.mock("__tray", desktopTray).set()

		const {DesktopNotifier} = n.subject('../../src/desktop/DesktopNotifier.js')
		const notifier = new DesktopNotifier()

		notifier.start(desktopTrayMock, notificationStartDelay)
		const clickHandler = o.spy(() => notifier.resolveGroupedNotification("gn1"))
		notifier.submitGroupedNotification("Title1", "Message1", "gn1", clickHandler)

		// not shown yet
		o(electronMock.Notification.mockedInstances.length).equals(0)
		o(desktopTrayMock.update.callCount).equals(0)
		o(notifier.hasNotificationForId("gn1")).equals(false)
		o(clickHandler.callCount).equals(0)

		setTimeout(() => {
			// shown and removed
			o(clickHandler.callCount).equals(1)
			o(electronMock.Notification.mockedInstances.length).equals(1)
			o(electronMock.Notification.mockedInstances[0].close.callCount).equals(1)

			o(desktopTrayMock.update.callCount).equals(2)
			o(notifier.hasNotificationForId("gn1")).equals(false)
			done()
		}, notificationStartDelay * 1.1)
	})
})
