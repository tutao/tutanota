import o, { spy } from "@tutao/otest"
import n from "../../nodemocker.js"
import { EndType, RepeatPeriod } from "../../../../src/platform-kit/app-env"
import { DesktopAlarmScheduler } from "../../../../src/applications/common/desktop/sse/DesktopAlarmScheduler.js"
import { stringToUtf8Uint8Array } from "../../../../src/platform-kit/utils"
import { WindowManager } from "../../../../src/applications/common/desktop/DesktopWindowManager.js"
import { DesktopNotifier } from "../../../../src/applications/common/desktop/notifications/DesktopNotifier.js"
import { DesktopAlarmStorage } from "../../../../src/applications/common/desktop/sse/DesktopAlarmStorage.js"
import { DesktopNativeCryptoFacade } from "../../../../src/applications/common/desktop/DesktopNativeCryptoFacade.js"
import { makeAlarmScheduler } from "../../calendar/CalendarTestUtils.js"
import { matchers, object, verify, when } from "testdouble"
import { AlarmScheduler, EventInfo } from "../../../../src/applications/common/calendar/date/AlarmScheduler.js"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, removeOriginals } from "../../TestUtils"
import { EncryptedAlarmNotification } from "../../../../src/app-kit/native-bridge/common/EncryptedAlarmNotification"

import { formatNotificationForDisplay } from "../../../../src/ui/utils/Formatter"

import {
	AlarmInfoTypeRef,
	AlarmNotification,
	AlarmNotificationTypeRef,
	CalendarEventRefTypeRef,
	NotificationSessionKeyTypeRef,
	RepeatRuleTypeRef,
} from "@tutao/entities/sys"
import { aes256RandomKey } from "@tutao/crypto/symmetric-cipher-utils"
import { aesEncrypt } from "../../../../src/platform-kit/crypto"
import { changeInstanceDirection } from "../../instance-pipeline/InstancePipelineTestUtils"
import { InstanceDirection } from "../../../../src/platform-kit/instance-pipeline/ParsedValue"

const oldTimezone = process.env.TZ
const userId = "userId1"
const sk = aes256RandomKey()

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
	const notifier: Partial<DesktopNotifier> = {
		showCountedUserNotification: async () => {
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
		const instancePipeline = instancePipelineFromTypeModelResolver(clientInitializedTypeModelResolver())

		const alarmStorageMockBuilder = n.mock<DesktopAlarmStorage>("__alarmStorage", new DesktopAlarmStorage(null!, cryptoMock, null!, null!))
		alarmStorageMockBuilder._mock.storeAlarm = spy(() => Promise.resolve())
		alarmStorageMockBuilder._mock.deleteAlarm = spy(() => Promise.resolve())
		alarmStorageMockBuilder._mock.getPushIdentifierSessionKey = () => Promise.resolve(aes256RandomKey())
		alarmStorageMockBuilder._mock.getScheduledAlarms = () => Promise.resolve([])
		alarmStorageMockBuilder._mock.removePushIdentifierKey = () => Promise.resolve()
		alarmStorageMockBuilder._mock.encryptAlarmNotification = (an) => instancePipeline.mapAndEncryptToParsedInstance(AlarmNotificationTypeRef, an, sk)
		alarmStorageMockBuilder._mock.decryptAlarmNotification = async (an) => {
			const notif = await instancePipeline.decryptAndMapEncryptedInstance<AlarmNotification>(an.encryptedInstance, sk)
			removeOriginals(notif)
			return notif
		}
		const alarmStorageMock = alarmStorageMockBuilder.set()

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
		o.test("no alarms", async function () {
			const { wmMock, notifierMock, cryptoMock, alarmStorageMock } = standardMocks()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, alarmScheduler)

			await scheduler.rescheduleAll()

			o.check(alarmStorageMock.storeAlarm.callCount).equals(0)
			o.check(notifierMock.showCountedUserNotification.callCount).equals(0)
			verify(alarmScheduler.scheduleAlarm(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("some alarms", async function () {
			const { wmMock, notifierMock, cryptoMock, alarmStorageMock } = standardMocks()
			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, alarmScheduler)

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
			alarmStorageMock.getScheduledAlarms = async () => {
				const encryptedAlarm = await alarmStorageMock.encryptAlarmNotification(an, null)
				changeInstanceDirection(encryptedAlarm, InstanceDirection.IncomingFromServer)
				return Promise.resolve([new EncryptedAlarmNotification(encryptedAlarm)])
			}

			await scheduler.rescheduleAll()

			o.check(alarmStorageMock.storeAlarm.callCount).equals(0)

			// Summary 1
			verify(
				alarmScheduler.scheduleAlarm(
					{
						startTime: an.eventStart,
						endTime: an.eventEnd,
						summary: an.summary,
					} satisfies EventInfo,
					an.alarmInfo,
					an.repeatRule,
					matchers.anything(),
				),
				{ times: 1 },
			)
		})
	})

	o.spec("handleAlarmNotification", function () {
		o.test("handle multiple events", async function () {
			const { wmMock, notifierMock, alarmStorageMock, cryptoMock } = standardMocks()

			const alarmScheduler = makeAlarmScheduler()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, alarmScheduler)

			// Summary 2
			const an1: AlarmNotification = createAlarmNotification({
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

			await scheduler.handleCreateAlarm(an1)
			await scheduler.handleCreateAlarm(an2)

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

			await scheduler.handleDeleteAlarm(an3.alarmInfo.alarmIdentifier)
			verify(alarmScheduler.cancelAlarm(an3.alarmInfo.alarmIdentifier), { times: 1 })
		})

		o.test("notification is shown and calendar is opened when it's clicked", async function () {
			const { wmMock, notifierMock, alarmStorageMock, cryptoMock } = standardMocks()

			const alarmScheduler: AlarmScheduler = object()
			const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, alarmScheduler)

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
			await scheduler.handleCreateAlarm(an1)
			o.check(notifierMock.showCountedUserNotification.callCount).equals(0)
			const cb = cbCaptor.value
			cb(an1.eventStart, "title")

			const { title, body } = formatNotificationForDisplay(an1.eventStart, "title", false)
			// taking the args apart because we can't match the click handler
			o.check(notifierMock.showCountedUserNotification.calls.length).equals(1)
			const firstCall = notifierMock.showCountedUserNotification.calls[0] as Parameters<DesktopNotifier["showCountedUserNotification"]>
			const argObject = firstCall[0]
			o.check(argObject.body).equals(body)
			o.check(argObject.title).equals(title)
			o.check(argObject.userId).equals(userId)

			o.check(wmMock.openCalendar.callCount).equals(0)
			argObject.onClick()
			o.check(wmMock.openCalendar.callCount).equals(1)
		})
	})
})

let alarmIdCounter = 0

function createAlarmNotification({ startTime, endTime, trigger, endType, endValue, frequency, interval }: any) {
	alarmIdCounter++
	return createTestEntity(AlarmNotificationTypeRef, {
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
			createTestEntity(NotificationSessionKeyTypeRef, {
				_id: `notificationSessionKeysId${alarmIdCounter}`,
				pushIdentifierSessionEncSessionKey: aesEncrypt(sk, stringToUtf8Uint8Array(`pushIdentifierSessionEncSessionKey${alarmIdCounter}`)),
				pushIdentifier: [`pushIdentifier${alarmIdCounter}Part1`, `pushIdentifier${alarmIdCounter}Part2`],
			}),
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
					advancedRules: [],
				}
			: null,
		user: userId,
	})
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
