import o from "@tutao/otest"
import type { CalendarEvent, CalendarGroupRoot } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import {
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	CalendarEventUpdateTypeRef,
	CalendarGroupRootTypeRef,
	EncryptedMailAddressTypeRef,
	FileTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { downcast, hexToUint8Array, neverNull, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel.js"
import { CalendarAttendeeStatus, CalendarMethod, OperationType, RepeatPeriod } from "../../../src/common/api/common/TutanotaConstants.js"
import { DateTime } from "luxon"
import { EntityEventsListener, EventController } from "../../../src/common/api/main/EventController.js"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import { AlarmInfo, AlarmInfoTypeRef, UserAlarmInfoListTypeTypeRef, UserAlarmInfoTypeRef, UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import type { UserController } from "../../../src/common/api/main/UserController.js"
import { NotFoundError } from "../../../src/common/api/common/error/RestError.js"
import type { LoginController } from "../../../src/common/api/main/LoginController.js"
import { ProgressTracker } from "../../../src/common/api/main/ProgressTracker.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { CalendarEventProgenitor, CalendarFacade } from "../../../src/common/api/worker/facades/lazy/CalendarFacade.js"
import { verify } from "@tutao/tutanota-test-utils"
import type { WorkerClient } from "../../../src/common/api/main/WorkerClient.js"
import { FileController } from "../../../src/common/file/FileController.js"
import { func, matchers, object, when } from "testdouble"
import { elementIdPart, getElementId, listIdPart } from "../../../src/common/api/common/utils/EntityUtils.js"
import { createDataFile } from "../../../src/common/api/common/DataFile.js"
import { SessionKeyNotFoundError } from "../../../src/common/api/common/error/SessionKeyNotFoundError.js"
import { createTestEntity } from "../TestUtils.js"
import { NoopProgressMonitor } from "../../../src/common/api/common/utils/ProgressMonitor.js"
import { makeAlarmScheduler } from "./CalendarTestUtils.js"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import { MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { incrementByRepeatPeriod } from "../../../src/common/calendar/date/CalendarUtils.js"
import { ExternalCalendarFacade } from "../../../src/common/native/common/generatedipc/ExternalCalendarFacade.js"
import { DeviceConfig } from "../../../src/common/misc/DeviceConfig.js"

o.spec("CalendarModel", function () {
	o.spec("incrementByRepeatPeriod", function () {
		const timeZone = "Europe/Berlin"
		o("with daylight saving", function () {
			const daylightSavingDay = DateTime.fromObject(
				{
					year: 2019,
					month: 10,
					day: 26,
					hour: 10,
				},
				{ zone: "Europe/Moscow" },
			).toJSDate()
			const dayAfter = DateTime.fromObject(
				{
					year: 2019,
					month: 10,
					day: 27,
					hour: 11,
				},
				{ zone: "Europe/Moscow" },
			).toJSDate()
			// event timezone is subject to daylight saving but observer is not
			o(incrementByRepeatPeriod(daylightSavingDay, RepeatPeriod.DAILY, 1, timeZone).toISOString()).equals(dayAfter.toISOString())
		})
		o("event in timezone without daylight saving should not be subject to daylight saving", function () {
			const daylightSavingDay = DateTime.fromObject(
				{
					year: 2019,
					month: 10,
					day: 26,
					hour: 10,
				},
				{ zone: "Europe/Moscow" },
			).toJSDate()
			const dayAfter = DateTime.fromObject(
				{
					year: 2019,
					month: 10,
					day: 27,
					hour: 10,
				},
				{ zone: "Europe/Moscow" },
			).toJSDate()
			o(incrementByRepeatPeriod(daylightSavingDay, RepeatPeriod.DAILY, 1, "Europe/Moscow").toISOString()).equals(dayAfter.toISOString())
		})
		o("weekly", function () {
			const onFriday = DateTime.fromObject(
				{
					year: 2019,
					month: 5,
					day: 31,
					hour: 10,
				},
				{ zone: timeZone },
			).toJSDate()
			const nextFriday = DateTime.fromObject(
				{
					year: 2019,
					month: 6,
					day: 7,
					hour: 10,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(onFriday, RepeatPeriod.WEEKLY, 1, timeZone).toISOString()).equals(nextFriday.toISOString())
			const oneYearAfter = DateTime.fromObject(
				{
					year: 2020,
					month: 5,
					day: 29,
					hour: 10,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(onFriday, RepeatPeriod.WEEKLY, 52, timeZone).toISOString()).equals(oneYearAfter.toISOString())
		})
		o("monthly", function () {
			const endOfMay = DateTime.fromObject(
				{
					year: 2019,
					month: 5,
					day: 31,
				},
				{ zone: timeZone },
			).toJSDate()
			const endOfJune = DateTime.fromObject(
				{
					year: 2019,
					month: 6,
					day: 30,
				},
				{ zone: timeZone },
			).toJSDate()
			const calculatedEndOfJune = incrementByRepeatPeriod(endOfMay, RepeatPeriod.MONTHLY, 1, timeZone)
			o(calculatedEndOfJune.toISOString()).equals(endOfJune.toISOString())
			const endOfJuly = DateTime.fromObject(
				{
					year: 2019,
					month: 7,
					day: 31,
				},
				{ zone: timeZone },
			).toJSDate()
			const endOfJulyString = endOfJuly.toISOString()
			const incrementedDateString = incrementByRepeatPeriod(endOfMay, RepeatPeriod.MONTHLY, 2, timeZone).toISOString()
			o(incrementedDateString).equals(endOfJulyString)
		})
		o("annually", function () {
			const leapYear = DateTime.fromObject(
				{
					year: 2020,
					month: 2,
					day: 29,
				},
				{ zone: timeZone },
			).toJSDate()
			const yearAfter = DateTime.fromObject(
				{
					year: 2021,
					month: 2,
					day: 28,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(leapYear, RepeatPeriod.ANNUALLY, 1, timeZone).toISOString()).equals(yearAfter.toISOString())
			const twoYearsAfter = DateTime.fromObject(
				{
					year: 2022,
					month: 2,
					day: 28,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(leapYear, RepeatPeriod.ANNUALLY, 2, timeZone).toISOString()).equals(twoYearsAfter.toISOString())
			const fourYearsAfter = DateTime.fromObject(
				{
					year: 2024,
					month: 2,
					day: 29,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(leapYear, RepeatPeriod.ANNUALLY, 4, timeZone).toISOString()).equals(fourYearsAfter.toISOString())
		})
	})
	o.spec("calendar event updates", function () {
		let restClientMock: EntityRestClientMock
		let groupRoot: CalendarGroupRoot
		const loginController = makeLoginController()
		const alarmsListId = neverNull(loginController.getUserController().user.alarmInfoList).alarms
		o.beforeEach(function () {
			groupRoot = createTestEntity(CalendarGroupRootTypeRef, {
				_id: "groupRootId",
				longEvents: "longEvents",
				shortEvents: "shortEvents",
			})
			restClientMock = new EntityRestClientMock()
			restClientMock.addElementInstances(groupRoot)
		})
		o("reply but sender is not a guest", async function () {
			const uid = "uid"
			const existingEvent = createTestEntity(CalendarEventTypeRef, { uid })
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
				},
				restClientMock,
			)
			const workerClient = makeWorkerClient()
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			await model.processCalendarData("sender@example.com", {
				method: CalendarMethod.REPLY,
				contents: [
					{
						event: createTestEntity(CalendarEventTypeRef, {
							uid,
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			verify(calendarFacade.updateCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})
		o("reply", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const anotherGuest = "another-attendee"
			const alarm = createTestEntity(AlarmInfoTypeRef, {
				_id: "alarm-id",
			})
			const existingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				uid,
				_ownerGroup: groupRoot._id,
				summary: "v1",
				attendees: [
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, {
							address: sender,
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, {
							address: anotherGuest,
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				],
				alarmInfos: [[alarmsListId, alarm._id]],
			})
			restClientMock.addListInstances(
				createTestEntity(UserAlarmInfoTypeRef, {
					_id: [alarmsListId, alarm._id],
					alarmInfo: alarm,
				}),
			)
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
				},
				restClientMock,
			)
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			await model.processCalendarData(sender, {
				// should be ignored
				method: CalendarMethod.REPLY,
				contents: [
					{
						event: createTestEntity(CalendarEventTypeRef, {
							uid,
							attendees: [
								createTestEntity(CalendarEventAttendeeTypeRef, {
									address: createTestEntity(EncryptedMailAddressTypeRef, {
										address: sender,
									}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
								createTestEntity(CalendarEventAttendeeTypeRef, {
									// should be ignored
									address: createTestEntity(EncryptedMailAddressTypeRef, {
										address: anotherGuest,
									}),
									status: CalendarAttendeeStatus.DECLINED,
								}),
							],
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			const eventCaptor = matchers.captor()
			const alarmsCaptor = matchers.captor()
			verify(calendarFacade.updateCalendarEvent(eventCaptor.capture(), alarmsCaptor.capture(), matchers.anything()))
			const createdEvent: CalendarEvent = eventCaptor.value
			const alarms: ReadonlyArray<AlarmInfo> = alarmsCaptor.value
			o(createdEvent.uid).equals(existingEvent.uid)
			o(createdEvent.summary).equals(existingEvent.summary)
			o(createdEvent.attendees).deepEquals([
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: sender,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: "another-attendee",
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			])
			o(alarms).deepEquals([alarm])
		})
		o("request as a new invite", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const restClientMock = new EntityRestClientMock()
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (_loadUid) => Promise.resolve(null),
				},
				restClientMock,
			)
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			await model.processCalendarData(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: createTestEntity(CalendarEventTypeRef, {
							uid,
							attendees: [
								createTestEntity(CalendarEventAttendeeTypeRef, {
									address: createTestEntity(EncryptedMailAddressTypeRef, {
										address: sender,
									}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
							],
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			verify(calendarFacade.updateCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})
		o("request as an update", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const alarm = createTestEntity(AlarmInfoTypeRef, {
				_id: "alarm-id",
			})
			restClientMock.addListInstances(
				createTestEntity(UserAlarmInfoTypeRef, {
					_id: [alarmsListId, alarm._id],
					alarmInfo: alarm,
				}),
			)
			const startTime = new Date()
			const existingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				_ownerGroup: groupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
				alarmInfos: [[alarmsListId, alarm._id]],
				startTime,
			})
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
				},
				restClientMock,
			)
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			const sentEvent = createTestEntity(CalendarEventTypeRef, {
				summary: "v2",
				uid,
				sequence: "2",
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
				startTime,
			})
			await model.processCalendarData(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: sentEvent as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			const eventCaptor = matchers.captor()
			const alarmsCaptor = matchers.captor()
			const oldEventCaptor = matchers.captor()
			verify(calendarFacade.updateCalendarEvent(eventCaptor.capture(), alarmsCaptor.capture(), oldEventCaptor.capture()))
			const updatedEvent = eventCaptor.value
			const updatedAlarms = alarmsCaptor.value
			const oldEvent = oldEventCaptor.value
			o(updatedEvent.summary).equals(sentEvent.summary)
			o(updatedEvent.sequence).equals(sentEvent.sequence)
			o(updatedAlarms).deepEquals([alarm])
			o(oldEvent).deepEquals(existingEvent)
		})
		o("event is re-created when the start time changes", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const alarm = createTestEntity(AlarmInfoTypeRef, {
				_id: "alarm-id",
			})
			restClientMock.addListInstances(
				createTestEntity(UserAlarmInfoTypeRef, {
					_id: [alarmsListId, alarm._id],
					alarmInfo: alarm,
				}),
			)
			const existingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				_ownerGroup: groupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 5,
						day: 10,
					},
					{ zone: "UTC" },
				).toJSDate(),
				alarmInfos: [[alarmsListId, alarm._id]],
			})
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
				},
				restClientMock,
			)
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			const sentEvent = createTestEntity(CalendarEventTypeRef, {
				summary: "v2",
				uid,
				sequence: "2",
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 5,
						day: 11,
					},
					{ zone: "UTC" },
				).toJSDate(),
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
			})
			await model.processCalendarData(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: sentEvent as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			verify(calendarFacade.updateCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

			const eventCaptor = matchers.captor()
			const alarmsCaptor = matchers.captor()
			const oldEventCaptor = matchers.captor()
			verify(calendarFacade.saveCalendarEvent(eventCaptor.capture(), alarmsCaptor.capture(), oldEventCaptor.capture()))
			const updatedEvent = eventCaptor.value
			const updatedAlarms = alarmsCaptor.value
			const oldEvent = oldEventCaptor.value

			o(updatedEvent.summary).equals(sentEvent.summary)
			o(updatedEvent.sequence).equals(sentEvent.sequence)
			o(updatedEvent.startTime.toISOString()).equals(sentEvent.startTime.toISOString())
			o(updatedEvent.uid).equals(uid)
			o(updatedAlarms).deepEquals([alarm])
			o(oldEvent).deepEquals(existingEvent)
		})
		o.spec("cancel", function () {
			o("event is cancelled by organizer", async function () {
				const uid = "uid"
				const sender = "sender@example.com"
				const existingEvent = createTestEntity(CalendarEventTypeRef, {
					_id: ["listId", "eventId"],
					_ownerGroup: groupRoot._id,
					sequence: "1",
					uid,
					organizer: createTestEntity(EncryptedMailAddressTypeRef, {
						address: sender,
					}),
				})
				restClientMock.addListInstances(existingEvent)
				const workerClient = makeWorkerClient()
				const calendarFacade = makeCalendarFacade(
					{
						getEventsByUid: (loadUid) =>
							uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
					},
					restClientMock,
				)
				const model = init({
					workerClient,
					restClientMock,
					calendarFacade: calendarFacade,
				})
				const sentEvent = createTestEntity(CalendarEventTypeRef, {
					uid,
					sequence: "2",
					organizer: createTestEntity(EncryptedMailAddressTypeRef, {
						address: sender,
					}),
				})
				await model.processCalendarData(sender, {
					method: CalendarMethod.CANCEL,
					contents: [
						{
							event: sentEvent as CalendarEventProgenitor,
							alarms: [],
						},
					],
				})
				await o(() => restClientMock.load(CalendarEventTypeRef, existingEvent._id)).asyncThrows(NotFoundError)
			})
			o("event is cancelled by someone else than organizer", async function () {
				const uid = "uid"
				const sender = "sender@example.com"
				const existingEvent = createTestEntity(CalendarEventTypeRef, {
					_id: ["listId", "eventId"],
					_ownerGroup: groupRoot._id,
					sequence: "1",
					uid,
					organizer: createTestEntity(EncryptedMailAddressTypeRef, {
						address: sender,
					}),
				})
				restClientMock.addListInstances(existingEvent)
				const workerClient = makeWorkerClient()
				const model = init({
					workerClient,
					restClientMock,
				})
				const sentEvent = createTestEntity(CalendarEventTypeRef, {
					uid,
					sequence: "2",
					organizer: createTestEntity(EncryptedMailAddressTypeRef, {
						address: sender,
					}),
				})
				await model.processCalendarData("another-sender", {
					method: CalendarMethod.CANCEL,
					contents: [
						{
							event: sentEvent as CalendarEventProgenitor,
							alarms: [],
						},
					],
				})
				o(await restClientMock.load(CalendarEventTypeRef, existingEvent._id)).equals(existingEvent)("Calendar event was not deleted")
			})
		})
		o("reprocess deferred calendar events with no owner enc session key", async function () {
			const calendarFile = createTestEntity(FileTypeRef, {
				_id: ["fileListId", "fileId"],
			})

			const eventUpdate = createTestEntity(CalendarEventUpdateTypeRef, {
				_id: ["calendarEventUpdateListId", "calendarEventUpdateId"],
				file: calendarFile._id,
			})

			const uid = "uid"
			const sender = "sender@example.com"
			const existingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["calendarListId", "eventId"],
				_ownerGroup: groupRoot._id,
				sequence: "1",
				uid,
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
			})

			const fileControllerMock = makeFileController()

			const workerClient = makeWorkerClient()
			const eventControllerMock = makeEventController()

			fileControllerMock.getAsDataFile = func<FileController["getAsDataFile"]>()
			when(fileControllerMock.getAsDataFile(matchers.anything())).thenResolve(
				createDataFile("event.ics", "ical", stringToUtf8Uint8Array("UID: " + uid), "cid"),
			)

			const actuallyLoad = restClientMock.load
			restClientMock.load = func<EntityRestClientMock["load"]>()
			when(restClientMock.load(matchers.anything(), matchers.anything()), { ignoreExtraArgs: true }).thenDo((...args) =>
				actuallyLoad.apply(restClientMock, args),
			)
			when(restClientMock.load(FileTypeRef, calendarFile._id), { ignoreExtraArgs: true }).thenReject(new SessionKeyNotFoundError("test"))

			const model = init({
				workerClient,
				restClientMock,
				fileFacade: fileControllerMock,
				eventController: eventControllerMock.eventController,
			})

			restClientMock.addListInstances(calendarFile, eventUpdate, existingEvent)

			// calendar update create event
			await eventControllerMock.sendEvent({
				application: CalendarEventUpdateTypeRef.app,
				type: CalendarEventUpdateTypeRef.type,
				instanceListId: listIdPart(eventUpdate._id),
				instanceId: elementIdPart(eventUpdate._id),
				operation: OperationType.CREATE,
			})

			o(model.getFileIdToSkippedCalendarEventUpdates().get(getElementId(calendarFile))!).deepEquals(eventUpdate)

			o(await restClientMock.load(CalendarEventUpdateTypeRef, eventUpdate._id)).deepEquals(eventUpdate)

			restClientMock.load = actuallyLoad

			// set owner enc session key to ensure that we can process the calendar event file
			calendarFile._ownerEncSessionKey = hexToUint8Array("01")
			await eventControllerMock.sendEvent({
				application: FileTypeRef.app,
				type: FileTypeRef.type,
				instanceListId: listIdPart(calendarFile._id),
				instanceId: elementIdPart(calendarFile._id),
				operation: OperationType.UPDATE,
			})

			o(model.getFileIdToSkippedCalendarEventUpdates().size).deepEquals(0)
			verify(fileControllerMock.getAsDataFile(matchers.anything()), { times: 1 })
			await o(async () => restClientMock.load(CalendarEventUpdateTypeRef, eventUpdate._id)).asyncThrows(NotFoundError)
		})
	})
})

function makeNotifications(): Notifications {
	return downcast({})
}

function makeProgressTracker(): ProgressTracker {
	const progressTracker: ProgressTracker = object()
	when(progressTracker.registerMonitorSync(matchers.anything())).thenReturn(0)
	when(progressTracker.getMonitor(matchers.anything())).thenReturn(new NoopProgressMonitor())
	return progressTracker
}

function makeEventController(): {
	eventController: EventController
	sendEvent: (arg0: EntityUpdateData) => Promise<void>
} {
	const listeners = new Array<EntityEventsListener>()
	return {
		eventController: downcast({
			listeners,
			addEntityListener(listener: EntityEventsListener) {
				listeners.push(listener)
			},
		}),
		sendEvent: async (update) => {
			for (let listener of listeners) {
				// @ts-ignore
				await listener([update])
			}
		},
	}
}

function makeWorkerClient(): WorkerClient {
	return downcast({})
}

function makeLoginController(): LoginController {
	const loginController: LoginController = object()
	const alarmInfoList = createTestEntity(UserAlarmInfoListTypeTypeRef, {
		alarms: "alarms",
	})
	const userController: UserController = object()
	userController.user = createTestEntity(UserTypeRef, {
		_id: "user-id",
		alarmInfoList,
	})
	when(loginController.getUserController()).thenReturn(userController)
	when(userController.getCalendarMemberships()).thenReturn([])
	return loginController
}

function makeMailModel(): MailboxModel {
	return downcast({})
}

function makeCalendarFacade(getEventsByUid: { getEventsByUid: Function }, entityRestClient: EntityRestClientMock): CalendarFacade {
	const saveCalendarEvent = func<CalendarFacade["saveCalendarEvent"]>()
	when(saveCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything())).thenDo((event) => {
		// testdouble is very insistent on calling such callbacks even during verification and we get weird args here
		if (!event.__matches) {
			entityRestClient.addListInstances(event)
		}
		return Promise.resolve()
	})
	return {
		getEventsByUid: getEventsByUid.getEventsByUid,
		updateCalendarEvent: func<CalendarFacade["updateCalendarEvent"]>(),
		saveCalendarEvent,
	} as Partial<CalendarFacade> as CalendarFacade
}

function makeFileController(): FileController {
	return downcast({})
}

function makeExternalCalendarFacade(): ExternalCalendarFacade {
	return downcast({})
}

function makeDeviceConfig(): DeviceConfig {
	return downcast({})
}

function init({
	notifications = makeNotifications(),
	eventController = makeEventController().eventController,
	workerClient,
	restClientMock,
	loginController = makeLoginController(),
	progressTracker = makeProgressTracker(),
	entityClient = new EntityClient(restClientMock),
	mailModel = makeMailModel(),
	alarmScheduler = makeAlarmScheduler(),
	calendarFacade = makeCalendarFacade(
		{
			getEventsByUid: () => Promise.resolve(null),
		},
		restClientMock,
	),
	fileFacade = makeFileController(),
	externalCalendarFacade = makeExternalCalendarFacade(),
	deviceConfig = makeDeviceConfig(),
}): CalendarModel {
	const lazyScheduler = async () => alarmScheduler

	return new CalendarModel(
		notifications,
		lazyScheduler,
		eventController,
		workerClient,
		loginController,
		progressTracker,
		entityClient,
		mailModel,
		calendarFacade,
		fileFacade,
		"Europe/Berlin",
		externalCalendarFacade,
		deviceConfig,
		downcast({
			getLoadedPushIdentifier: () => ({
				identifier: "",
				disabled: false,
			}),
		}),
	)
}
