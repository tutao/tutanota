import o from "@tutao/otest"
import n from "../../nodemocker.js"
import { EndType, RepeatPeriod } from "../../../../src/common/api/common/TutanotaConstants.js"
import { DesktopAlarmScheduler } from "../../../../src/common/desktop/sse/DesktopAlarmScheduler.js"
import { downcast, lastThrow } from "@tutao/tutanota-utils"
import { WindowManager } from "../../../../src/common/desktop/DesktopWindowManager.js"
import { DesktopNotifier, NotificationResult } from "../../../../src/common/desktop/DesktopNotifier.js"
import { DesktopAlarmStorage } from "../../../../src/common/desktop/sse/DesktopAlarmStorage.js"
import { DesktopNativeCryptoFacade } from "../../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import { assertThrows, spy } from "@tutao/tutanota-test-utils"
import { EncryptedAlarmNotification } from "../../../../src/common/native/common/EncryptedAlarmNotification.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { makeAlarmScheduler } from "../../calendar/CalendarTestUtils.js"
import { matchers, object, verify, when } from "testdouble"
import { AlarmInfoTypeRef, AlarmNotificationTypeRef, CalendarEventRefTypeRef, RepeatRuleTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { AlarmScheduler } from "../../../../src/common/calendar/date/AlarmScheduler.js"
import { formatNotificationForDisplay } from "../../../../src/calendar-app/calendar/model/CalendarModel.js"

const oldTimezone = process.env.TZ

o.spec("DesktopAlarmSchedulerTest", function () {
	o.before(function () {
		process.env.TZ = "Europe/Berlin"
	})
	o.after(function () {
		process.env.TZ = oldTimezone
	})

	const lang = {
		lang: { get: (key) => key },
	}
	const crypto = {
		decryptAndMapToInstance: (tm, an) => Promise.resolve(Object.assign({}, an)),
	}
	const alarmNotification = {}
	const wm = {
		openCalendar() {},
	}
	const notifier = {
		submitGroupedNotification: () => {
			console.log("show notification!")
		},
	}

	const standardMocks = () => {
		// node modules

		// our modules
		const langMock = n.mock("__lang", lang).set()
		const alarmNotificationMock = n.mock("__alarmNotification", alarmNotification).set()
		const cryptoMock = n.mock<DesktopNativeCryptoFacade>("__crypto", crypto).set()

		// instances
		const wmMock = n.mock<WindowManager>("__wm", wm).set()
		const notifierMock = n.mock<DesktopNotifier>("__notifier", notifier).set()

		const alarmStorage = {
			storeAlarm: spy(() => Promise.resolve()),
			deleteAlarm: spy(() => Promise.resolve()),
			getPushIdentifierSessionKey: () => Promise.resolve("piSk"),
			getScheduledAlarms: () => [],
			removePushIdentifierKey: () => {},
		}
		const alarmStorageMock = n.mock<DesktopAlarmStorage>("__alarmStorage", alarmStorage).set()

		return {
			langMock,
			alarmNotificationMock,
			wmMock,
			notifierMock,
			alarmStorageMock,
			cryptoMock,
		}
	}

	o.spec("rescheduleAll", function () {
		o("no alarms", async function () {
			const { wmMock, notifierMock, cryptoMock, alarmStorageMock } = standardMocks()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			await scheduler.rescheduleAll()

			o(alarmStorageMock.storeAlarm.callCount).equals(0)
			o(notifierMock.submitGroupedNotification.callCount).equals(0)
			verify(alarmScheduler.scheduleAlarm(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("some alarms", async function () {
			const { wmMock, notifierMock, cryptoMock, alarmStorageMock } = standardMocks()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			const an = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: "1",
			})
			// crypto is a stub which just returns things back
			alarmStorageMock.getScheduledAlarms = () => Promise.resolve([downcast<EncryptedAlarmNotification>(an)])

			await scheduler.rescheduleAll()

			o(alarmStorageMock.storeAlarm.callCount).equals(0)

			// Summary 1
			verify(
				alarmScheduler.scheduleAlarm(
					{
						startTime: an.eventStart,
						endTime: an.eventEnd,
						summary: an.summary,
					},
					an.alarmInfo,
					an.repeatRule,
					matchers.anything(),
				),
				{ times: 1 },
			)
		})
	})

	o.spec("handleAlarmNotification", function () {
		o("handle multiple events", async function () {
			const { wmMock, notifierMock, alarmStorageMock, cryptoMock } = standardMocks()

			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			// Summary 2
			const an1 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: "1",
			})

			// Summary 3
			const an2 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: "1",
			})

			const an3 = createDeleteAlarmNotification(an1.alarmInfo.alarmIdentifier)

			// @ts-ignore
			await scheduler.handleAlarmNotification(an1)
			// @ts-ignore
			await scheduler.handleAlarmNotification(an2)

			// We don't want the callback argument
			verify(
				alarmScheduler.scheduleAlarm(
					{
						startTime: an1.eventStart,
						endTime: an1.eventEnd,
						summary: an1.summary,
					},
					an1.alarmInfo,
					an1.repeatRule,
					matchers.anything(),
				),
				{ times: 1 },
			)
			verify(
				alarmScheduler.scheduleAlarm(
					{
						startTime: an2.eventStart,
						endTime: an2.eventEnd,
						summary: an2.summary,
					},
					an2.alarmInfo,
					an2.repeatRule,
					matchers.anything(),
				),
				{ times: 1 },
			)

			// @ts-ignore
			await scheduler.handleAlarmNotification(an3)
			verify(alarmScheduler.cancelAlarm(an3.alarmInfo.alarmIdentifier), { times: 1 })
		})

		o("notification is shown and calendar is opened when it's clicked", async function () {
			const { wmMock, notifierMock, alarmStorageMock, cryptoMock } = standardMocks()

			const alarmScheduler: AlarmScheduler = object()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			const an1 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: "1",
			})

			const cbCaptor = matchers.captor()
			when(alarmScheduler.scheduleAlarm(matchers.anything(), matchers.anything(), matchers.anything(), cbCaptor.capture())).thenResolve(undefined)
			// @ts-ignore
			await scheduler.handleAlarmNotification(an1)
			o(notifierMock.submitGroupedNotification.callCount).equals(0)
			const cb = cbCaptor.value
			cb(an1.eventStart, "title")

			const { title, body } = formatNotificationForDisplay(an1.eventStart, "title")
			o(notifierMock.submitGroupedNotification.calls.map((c) => c.slice(0, -1))).deepEquals([[title, title, an1.alarmInfo.alarmIdentifier]])
			o(wmMock.openCalendar.callCount).equals(0)
			const onClick = lastThrow(notifierMock.submitGroupedNotification.calls[0])
			onClick(NotificationResult.Click)
			o(wmMock.openCalendar.callCount).equals(1)
		})

		o("alarmnotification with unavailable pushIdentifierSessionKey", async function () {
			const { wmMock, notifierMock, cryptoMock } = standardMocks()
			const alarmStorageMock = n
				.mock<DesktopAlarmStorage>("__alarmStorage", {
					storeAlarm: spy(() => Promise.resolve()),
					deleteAlarm: spy(() => Promise.resolve()),
					getPushIdentifierSessionKey: () => null,
					getScheduledAlarms: () => [],
				})
				.set()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			const an1 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: "1",
			})

			an1.notificationSessionKeys.push({
				_id: `notificationSessionKeysIdFoo`,
				pushIdentifierSessionEncSessionKey: `pushIdentifierSessionEncSessionKeyFoo`,
				pushIdentifier: [`pushIdentifierFooPart1`, `pushIdentifierFooPart2`],
			})

			await assertThrows(CryptoError, () => scheduler.handleAlarmNotification(an1 as unknown as EncryptedAlarmNotification))
			o(alarmStorageMock.getPushIdentifierSessionKey.callCount).equals(2)
		})

		o("alarmnotification with corrupt fields", async function () {
			const { wmMock, notifierMock, alarmStorageMock } = standardMocks()
			const cryptoMock = n
				.mock<DesktopNativeCryptoFacade>("__crypto", crypto)
				.with({
					decryptAndMapToInstance: (tm, an) => Promise.resolve(Object.assign({ _errors: {} }, an)),
				})
				.set()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			const an1 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: "1",
			})
			// @ts-ignore
			await assertThrows(CryptoError, () => scheduler.handleAlarmNotification(an1))
			o(alarmStorageMock.removePushIdentifierKey.callCount).equals(1)
		})
	})
})

let alarmIdCounter = 0

function createAlarmNotification({ startTime, endTime, trigger, endType, endValue, frequency, interval }: any) {
	alarmIdCounter++
	return {
		_id: `scheduledAlarmId${alarmIdCounter}`,
		_type: AlarmNotificationTypeRef,
		eventStart: startTime,
		eventEnd: endTime,
		operation: "0",
		summary: `summary${alarmIdCounter}`,
		alarmInfo: {
			_type: AlarmInfoTypeRef,
			_id: `alarmInfoId1${alarmIdCounter}`,
			alarmIdentifier: `alarmIdentifier${alarmIdCounter}`,
			trigger,
			calendarRef: {
				_type: CalendarEventRefTypeRef,
				_id: `calendarRefId${alarmIdCounter}`,
				elementId: `calendarRefElementId${alarmIdCounter}`,
				listId: `calendarRefListId${alarmIdCounter}`,
			},
		},
		notificationSessionKeys: [
			{
				_id: `notificationSessionKeysId${alarmIdCounter}`,
				pushIdentifierSessionEncSessionKey: `pushIdentifierSessionEncSessionKey${alarmIdCounter}=`,
				pushIdentifier: [`pushIdentifier${alarmIdCounter}Part1`, `pushIdentifier${alarmIdCounter}Part2`],
			},
		],
		repeatRule: endType
			? {
					_id: `repeatRuleId${alarmIdCounter}`,
					_type: RepeatRuleTypeRef,
					timeZone: "Europe/Berlin",
					excludedDates: [],
					endType,
					endValue,
					frequency,
					interval,
			  }
			: null,
		user: "userId1",
	}
}

function createDeleteAlarmNotification(alarmIdentifier: string) {
	return {
		_id: "irrelevantAlarmNotificationId",
		eventEnd: "",
		eventStart: "",
		operation: "2",
		summary: "",
		alarmInfo: {
			_id: "irrelevantAlarmInfoId",
			alarmIdentifier,
			trigger: "",
			calendarRef: {
				_id: "yZRX5A",
				elementId: "irrelevantElementId",
				listId: "irrelevantListId",
			},
		},
		notificationSessionKeys: [],
		repeatRule: null,
		user: "someIrrelevantUserId",
	}
}
