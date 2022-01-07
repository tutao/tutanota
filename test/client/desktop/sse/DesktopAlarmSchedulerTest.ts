import o from "ospec"
import n from '../../nodemocker'
import {EndType, RepeatPeriod} from "../../../../src/api/common/TutanotaConstants"
import {DesktopAlarmScheduler, EncryptedAlarmNotification} from "../../../../src/desktop/sse/DesktopAlarmScheduler"
import type {AlarmScheduler} from "../../../../src/calendar/date/AlarmScheduler"
import {CryptoError} from "../../../../src/api/common/error/CryptoError"
import {downcast, lastThrow} from "@tutao/tutanota-utils"
import {WindowManager} from "../../../../src/desktop/DesktopWindowManager";
import {DesktopNotifier, NotificationResult} from "../../../../src/desktop/DesktopNotifier";
import {DesktopAlarmStorage} from "../../../../src/desktop/sse/DesktopAlarmStorage";
import {DesktopCryptoFacade} from "../../../../src/desktop/DesktopCryptoFacade";
import {assertThrows} from "@tutao/tutanota-test-utils";

const START_DATE = new Date(2019, 9, 10, 14).getTime()
const oldTimezone = process.env.TZ

o.spec("DesktopAlarmSchedulerTest", function () {
	o.before(function () {
		process.env.TZ = 'Europe/Berlin'
	})
	o.after(function () {
		process.env.TZ = oldTimezone
	})

	const lang = {
		lang: {get: key => key}
	}
	const crypto = {
		decryptAndMapToInstance: (tm, an) => Promise.resolve(Object.assign({}, an))
	}
	const alarmNotification = {}
	const wm = {
		openCalendar() {
		},
	}
	const notifier = {
		submitGroupedNotification: () => {
			console.log("show notification!")
		}
	}

	function makeAlarmScheduler(): AlarmScheduler {
		return {
			scheduleAlarm: o.spy(),
			cancelAlarm: o.spy(),
		}
	}

	const standardMocks = () => {
		// node modules

		// our modules
		const langMock = n.mock("__lang", lang).set()
		const alarmNotificationMock = n.mock("__alarmNotification", alarmNotification).set()
		const cryptoMock = n.mock<DesktopCryptoFacade>('__crypto', crypto).set()

		// instances
		const wmMock = n.mock<WindowManager>('__wm', wm).set()
		const notifierMock = n.mock<DesktopNotifier>("__notifier", notifier).set()

		const alarmStorage = {
			storeAlarm: o.spy(() => Promise.resolve()),
			deleteAlarm: o.spy(() => Promise.resolve()),
			getPushIdentifierSessionKey: () => Promise.resolve("piSk"),
			getScheduledAlarms: () => [],
			removePushIdentifierKey: () => {
			}
		}
		const alarmStorageMock = n.mock<DesktopAlarmStorage>("__alarmStorage", alarmStorage).set()

		return {
			langMock,
			alarmNotificationMock,
			wmMock,
			notifierMock,
			alarmStorageMock,
			cryptoMock
		}
	}

	o.spec("rescheduleAll", function () {
		o("no alarms", async function () {
			const {wmMock, notifierMock, cryptoMock, alarmStorageMock} = standardMocks()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			await scheduler.rescheduleAll()

			o(alarmStorageMock.storeAlarm.callCount).equals(0)
			o(notifierMock.submitGroupedNotification.callCount).equals(0)
			o(alarmScheduler.scheduleAlarm.callCount).equals(0)
		})

		o("some alarms", async function () {
			const {wmMock, notifierMock, cryptoMock, alarmStorageMock} = standardMocks()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			const an = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: '1'
			})
			// crypto is a stub which just returns things back
			alarmStorageMock.getScheduledAlarms = () => Promise.resolve([downcast<EncryptedAlarmNotification>(an)])

			await scheduler.rescheduleAll()

			o(alarmStorageMock.storeAlarm.callCount).equals(0)
			o(alarmScheduler.scheduleAlarm.calls.map(c => c.args.slice(0, -1))).deepEquals([
				[
					{startTime: an.eventStart, endTime: an.eventEnd, summary: an.summary},
					an.alarmInfo,
					an.repeatRule
				],
			])
		})
	})

	o.spec("handleAlarmNotification", async function () {
		o("handle multiple events", async function () {
			const {wmMock, notifierMock, alarmStorageMock, cryptoMock} = standardMocks()

			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			const an1 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: '1'
			})

			const an2 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: '1'
			})

			const an3 = createDeleteAlarmNotification(an1.alarmInfo.alarmIdentifier)
			// @ts-ignore
			await scheduler.handleAlarmNotification(an1)
			// @ts-ignore
			await scheduler.handleAlarmNotification(an2)

			// We don't want the callback argument
			o(alarmScheduler.scheduleAlarm.calls.map(c => c.args.slice(0, -1))).deepEquals([
				[
					{startTime: an1.eventStart, endTime: an1.eventEnd, summary: an1.summary},
					an1.alarmInfo,
					an1.repeatRule
				],
				[
					{startTime: an2.eventStart, endTime: an2.eventEnd, summary: an2.summary},
					an2.alarmInfo,
					an2.repeatRule
				],
			])


			// @ts-ignore
			await scheduler.handleAlarmNotification(an3)
			o(alarmScheduler.cancelAlarm.calls.map(c => c.args)).deepEquals([[an3.alarmInfo.alarmIdentifier]])
		})

		o("notification is shown and calendar is opened when it's clicked", async function () {
			const {wmMock, notifierMock, alarmStorageMock, cryptoMock} = standardMocks()

			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			const an1 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: '1'
			})

			// @ts-ignore
			await scheduler.handleAlarmNotification(an1)
			o(notifierMock.submitGroupedNotification.callCount).equals(0)

			const cb = lastThrow(alarmScheduler.scheduleAlarm.calls[0].args)
			const title = "title"
			const body = "body"
			cb(title, body)

			o(notifierMock.submitGroupedNotification.calls.map(c => c.args.slice(0, -1))).deepEquals([
				[title, body, an1.alarmInfo.alarmIdentifier]
			])
			o(wmMock.openCalendar.callCount).equals(0)
			const onClick = lastThrow(notifierMock.submitGroupedNotification.calls[0].args)
			onClick(NotificationResult.Click)
			o(wmMock.openCalendar.callCount).equals(1)
		})

		o("alarmnotification with unavailable pushIdentifierSessionKey", async function () {
			const {wmMock, notifierMock, cryptoMock} = standardMocks()
			const alarmStorageMock = n.mock<DesktopAlarmStorage>("__alarmStorage", {
				storeAlarm: o.spy(() => Promise.resolve()),
				deleteAlarm: o.spy(() => Promise.resolve()),
				getPushIdentifierSessionKey: () => null,
				getScheduledAlarms: () => []
			}).set()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			const an1 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: '1'
			})

			an1.notificationSessionKeys.push({
				_id: `notificationSessionKeysIdFoo`,
				pushIdentifierSessionEncSessionKey: `pushIdentifierSessionEncSessionKeyFoo`,
				pushIdentifier: [
					`pushIdentifierFooPart1`,
					`pushIdentifierFooPart2`
				]
			})

			// @ts-ignore
			await assertThrows(CryptoError, () => scheduler.handleAlarmNotification(an1))
			o(alarmStorageMock.getPushIdentifierSessionKey.callCount).equals(2)
		})

		o("alarmnotification with corrupt fields", async function () {
			const {wmMock, notifierMock, alarmStorageMock} = standardMocks()
			const cryptoMock = n.mock<DesktopCryptoFacade>('__crypto', crypto).with({
				decryptAndMapToInstance: (tm, an) => Promise.resolve(Object.assign({"_errors": {}}, an))
			}).set()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, cryptoMock, alarmScheduler)

			const an1 = createAlarmNotification({
				startTime: new Date(2019, 9, 20, 10),
				endTime: new Date(2019, 9, 20, 12),
				trigger: "5M",
				endType: EndType.Never,
				endValue: null,
				frequency: RepeatPeriod.ANNUALLY,
				interval: '1'
			})
			// @ts-ignore
			await assertThrows(CryptoError, () => scheduler.handleAlarmNotification(an1))
			o(alarmStorageMock.removePushIdentifierKey.callCount).equals(1)
		})
	})
})

let alarmIdCounter = 0

function createAlarmNotification({startTime, endTime, trigger, endType, endValue, frequency, interval}: any) {
	alarmIdCounter++
	return {
		_id: `scheduledAlarmId${alarmIdCounter}`,
		eventStart: startTime,
		eventEnd: endTime,
		operation: "0",
		summary: `summary${alarmIdCounter}`,
		alarmInfo: {
			_id: `alarmInfoId1${alarmIdCounter}`,
			alarmIdentifier: `alarmIdentifier${alarmIdCounter}`,
			trigger,
			calendarRef: {
				_id: `calendarRefId${alarmIdCounter}`,
				elementId: `calendarRefElementId${alarmIdCounter}`,
				listId: `calendarRefListId${alarmIdCounter}`
			}
		},
		notificationSessionKeys: [
			{
				_id: `notificationSessionKeysId${alarmIdCounter}`,
				pushIdentifierSessionEncSessionKey: `pushIdentifierSessionEncSessionKey${alarmIdCounter}`,
				pushIdentifier: [
					`pushIdentifier${alarmIdCounter}Part1`,
					`pushIdentifier${alarmIdCounter}Part2`
				]
			}
		],
		repeatRule: endType
			? {
				_id: `repeatRuleId${alarmIdCounter}`,
				endType,
				endValue,
				frequency,
				interval
			}
			: null,
		user: "userId1"
	}
}

function createDeleteAlarmNotification(alarmIdentifier: string) {
	return {
		"_id": "irrelevantAlarmNotificationId",
		"eventEnd": "",
		"eventStart": "",
		"operation": "2",
		"summary": "",
		"alarmInfo": {
			"_id": "irrelevantAlarmInfoId",
			alarmIdentifier,
			"trigger": "",
			"calendarRef": {
				"_id": "yZRX5A",
				"elementId": "irrelevantElementId",
				"listId": "irrelevantListId"
			}
		},
		"notificationSessionKeys": [],
		"repeatRule": null,
		"user": "someIrrelevantUserId"
	}
}

