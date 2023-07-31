import o from "@tutao/otest"
import type { CalendarEvent, CalendarGroupRoot } from "../../../src/api/entities/tutanota/TypeRefs.js"
import {
	CalendarEventTypeRef,
	createCalendarEvent,
	createCalendarEventAttendee,
	createCalendarGroupRoot,
	createEncryptedMailAddress,
} from "../../../src/api/entities/tutanota/TypeRefs.js"
import { incrementByRepeatPeriod } from "../../../src/calendar/date/CalendarUtils.js"
import { clone, downcast, neverNull, noOp } from "@tutao/tutanota-utils"
import { CalendarModel } from "../../../src/calendar/model/CalendarModel.js"
import { CalendarAttendeeStatus, CalendarMethod, RepeatPeriod } from "../../../src/api/common/TutanotaConstants.js"
import { DateTime } from "luxon"
import type { EntityUpdateData } from "../../../src/api/main/EventController.js"
import { EventController } from "../../../src/api/main/EventController.js"
import { Notifications } from "../../../src/gui/Notifications.js"
import { AlarmInfo, createAlarmInfo, createUser, createUserAlarmInfo, createUserAlarmInfoListType } from "../../../src/api/entities/sys/TypeRefs.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import type { UserController } from "../../../src/api/main/UserController.js"
import { NotFoundError } from "../../../src/api/common/error/RestError.js"
import type { LoginController } from "../../../src/api/main/LoginController.js"
import { ProgressTracker } from "../../../src/api/main/ProgressTracker.js"
import { EntityClient } from "../../../src/api/common/EntityClient.js"
import { MailModel } from "../../../src/mail/model/MailModel.js"
import { AlarmScheduler } from "../../../src/calendar/date/AlarmScheduler.js"
import { CalendarEventProgenitor, CalendarFacade } from "../../../src/api/worker/facades/lazy/CalendarFacade.js"
import { verify } from "@tutao/tutanota-test-utils"
import type { WorkerClient } from "../../../src/api/main/WorkerClient.js"
import { FileController } from "../../../src/file/FileController.js"
import { func, matchers, when } from "testdouble"

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
			groupRoot = createCalendarGroupRoot({
				_id: "groupRootId",
				longEvents: "longEvents",
				shortEvents: "shortEvents",
			})
			restClientMock = new EntityRestClientMock()
			restClientMock.addElementInstances(groupRoot)
		})
		o("reply but sender is not a guest", async function () {
			const uid = "uid"
			const existingEvent = createCalendarEvent({ uid })
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
						event: createCalendarEvent({
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
			const alarm = createAlarmInfo({
				_id: "alarm-id",
			})
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				uid,
				_ownerGroup: groupRoot._id,
				summary: "v1",
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({
							address: sender,
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({
							address: anotherGuest,
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				],
				alarmInfos: [[alarmsListId, alarm._id]],
			})
			restClientMock.addListInstances(
				createUserAlarmInfo({
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
						event: createCalendarEvent({
							uid,
							attendees: [
								createCalendarEventAttendee({
									address: createEncryptedMailAddress({
										address: sender,
									}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
								createCalendarEventAttendee({
									// should be ignored
									address: createEncryptedMailAddress({
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
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({
						address: sender,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({
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
					getEventsByUid: (loadUid) => Promise.resolve(null),
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
						event: createCalendarEvent({
							uid,
							attendees: [
								createCalendarEventAttendee({
									address: createEncryptedMailAddress({
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
			const alarm = createAlarmInfo({
				_id: "alarm-id",
			})
			restClientMock.addListInstances(
				createUserAlarmInfo({
					_id: [alarmsListId, alarm._id],
					alarmInfo: alarm,
				}),
			)
			const startTime = new Date()
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: groupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createEncryptedMailAddress({
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
			const sentEvent = createCalendarEvent({
				summary: "v2",
				uid,
				sequence: "2",
				organizer: createEncryptedMailAddress({
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
			const alarm = createAlarmInfo({
				_id: "alarm-id",
			})
			restClientMock.addListInstances(
				createUserAlarmInfo({
					_id: [alarmsListId, alarm._id],
					alarmInfo: alarm,
				}),
			)
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: groupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createEncryptedMailAddress({
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
			const sentEvent = createCalendarEvent({
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
				organizer: createEncryptedMailAddress({
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
				const existingEvent = createCalendarEvent({
					_id: ["listId", "eventId"],
					_ownerGroup: groupRoot._id,
					sequence: "1",
					uid,
					organizer: createEncryptedMailAddress({
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
				const sentEvent = createCalendarEvent({
					uid,
					sequence: "2",
					organizer: createEncryptedMailAddress({
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
				await o(() => restClientMock.load(CalendarEventTypeRef, existingEvent._id, null)).asyncThrows(NotFoundError)
			})
			o("event is cancelled by someone else than organizer", async function () {
				const uid = "uid"
				const sender = "sender@example.com"
				const existingEvent = createCalendarEvent({
					_id: ["listId", "eventId"],
					_ownerGroup: groupRoot._id,
					sequence: "1",
					uid,
					organizer: createEncryptedMailAddress({
						address: sender,
					}),
				})
				restClientMock.addListInstances(existingEvent)
				const workerClient = makeWorkerClient()
				const model = init({
					workerClient,
					restClientMock,
				})
				const sentEvent = createCalendarEvent({
					uid,
					sequence: "2",
					organizer: createEncryptedMailAddress({
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
				o(await restClientMock.load(CalendarEventTypeRef, existingEvent._id, null)).equals(existingEvent)("Calendar event was not deleted")
			})
		})
	})
})

function makeNotifications(): Notifications {
	return downcast({})
}

function makeProgressTracker(): ProgressTracker {
	return downcast({
		register: () => 0,
	})
}

function makeEventController(): {
	eventController: EventController
	sendEvent: (arg0: EntityUpdateData) => void
} {
	const listeners = []
	return {
		eventController: downcast({
			listeners,
			addEntityListener: noOp,
		}),
		sendEvent: (update) => {
			for (let listener of listeners) {
				// @ts-ignore
				listener([update])
			}
		},
	}
}

function makeWorkerClient(): WorkerClient {
	return downcast({})
}

function makeLoginController(props: Partial<UserController> = {}): LoginController {
	const userController = downcast(
		Object.assign(props, {
			user: createUser({
				_id: "user-id",
				alarmInfoList: createUserAlarmInfoListType({
					alarms: "alarms",
				}),
			}),
		}),
	)
	return downcast({
		getUserController: () => userController,
	})
}

function makeAlarmScheduler(): AlarmScheduler {
	return {
		scheduleAlarm: func<AlarmScheduler["scheduleAlarm"]>(),
		cancelAlarm: func<AlarmScheduler["cancelAlarm"]>(),
	}
}

function makeMailModel(): MailModel {
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
	)
}
