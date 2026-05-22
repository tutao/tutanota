import o from "@tutao/otest"
import {
	AlarmInfoTemplate,
	CachingMode,
	CalendarEventAlteredInstance,
	CalendarFacade,
	EventWithUserAlarmInfos,
	sortByRecurrenceId,
} from "../../../../../src/common/api/worker/facades/lazy/CalendarFacade.js"
import { EntityRestClientMock } from "../rest/EntityRestClientMock.js"
import { DefaultEntityRestCache } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import { downcast, first } from "@tutao/utils"
import { clone, elementIdPart, getElementId, getLetId, getListId } from "@tutao/meta"
import { SetupMultipleError } from "../../../../../src/network/error/SetupMultipleError.js"
import { GroupManagementFacade } from "../../../../../src/base/facades/lazy/GroupManagementFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { IServiceExecutor } from "../../../../../src/network/ServiceRequest"
import { UserFacade } from "../../../../../src/base/facades/UserFacade"
import { clientInitializedTypeModelResolver, createTestEntity } from "../../../TestUtils.js"
import { TypeModelResolver } from "@tutao/instance-pipeline"

import { CalendarEvent, CalendarEventTypeRef, CalendarGroupRootTypeRef, GroupSettingsTypeRef, UserSettingsGroupRootTypeRef } from "@tutao/entities/tutanota"
import {
	AlarmInfo,
	AlarmInfoTypeRef,
	CalendarEventRefTypeRef,
	GroupMembershipTypeRef,
	PushIdentifierListTypeRef,
	PushIdentifierTypeRef,
	User,
	UserAlarmInfo,
	UserAlarmInfoListTypeTypeRef,
	UserAlarmInfoTypeRef,
	UserTypeRef,
} from "@tutao/entities/sys"
import { AlarmFacade } from "../../../../../src/common/api/worker/facades/lazy/AlarmFacade"
import { EventAlarmInfoTemplatesTuple } from "../../../../../src/common/calendar/gui/ImportExportUtils"
import { EntityClient } from "../../../../../src/network/EntityClient"
import { ExposedOperationProgressTracker } from "../../../../../src/common/api/main/OperationProgressTracker"
import { GroupType } from "../../../../../src/entities/sys/Utils"

o.spec("CalendarFacadeTest", function () {
	let userAlarmInfoListId: Id
	let user: User
	let userFacade: UserFacade
	let groupManagementFacade: GroupManagementFacade
	let restClientMock: EntityRestClientMock
	let entityRestCache: DefaultEntityRestCache
	let calendarFacade: CalendarFacade
	let serviceExecutor: IServiceExecutor
	let typeModelResolver: TypeModelResolver
	let exposedOperationProgressTracker: ExposedOperationProgressTracker
	let alarmFacadeMock: AlarmFacade

	const PRIVATE_CALENDAR_ID = "privateCalendarId"
	const SUBSCRIPTION_CALENDAR_ID = "subscriptionCalendarId"

	function sortEventsWithAlarmInfos(eventsWithAlarmInfos: Array<EventWithUserAlarmInfos>) {
		const idCompare = (el1, el2) => getLetId(el1).join("").localeCompare(getLetId(el2).join(""))

		eventsWithAlarmInfos.sort((a, b) => idCompare(a.event, b.event))

		for (let { userAlarmInfos } of eventsWithAlarmInfos) {
			userAlarmInfos.sort(idCompare)
		}
		return eventsWithAlarmInfos
	}

	// We have to sort because deepEquals takes list order into account
	function assertSortedEquals(actual, expected) {
		o(sortEventsWithAlarmInfos(actual)).deepEquals(sortEventsWithAlarmInfos(expected))
	}

	function makeCalendarEvent(listId: Id, elementId?: Id): CalendarEvent {
		return createTestEntity(CalendarEventTypeRef, {
			_id: [listId, elementId || restClientMock.getNextId()],
			uid: `${listId}-${elementId}`,
		})
	}

	function makeAlarmInfoTemplate(alarmIdentifier: string, trigger: string = "1D"): AlarmInfoTemplate {
		return {
			alarmIdentifier,
			trigger,
		}
	}

	function makeUserAlarmInfo(event: CalendarEvent): UserAlarmInfo {
		return createTestEntity(UserAlarmInfoTypeRef, {
			_id: [userAlarmInfoListId, restClientMock.getNextId()],
			alarmInfo: makeAlarmInfo(event),
		})
	}

	function makeAlarmInfo(event: CalendarEvent): AlarmInfo {
		return createTestEntity(AlarmInfoTypeRef, {
			calendarRef: createTestEntity(CalendarEventRefTypeRef, {
				elementId: getElementId(event),
				listId: getListId(event),
			}),
		})
	}

	o.beforeEach(async function () {
		restClientMock = new EntityRestClientMock()
		userAlarmInfoListId = restClientMock.getNextId()

		user = createTestEntity(UserTypeRef, {
			alarmInfoList: createTestEntity(UserAlarmInfoListTypeTypeRef, {
				alarms: userAlarmInfoListId,
			}),
			pushIdentifierList: createTestEntity(PushIdentifierListTypeRef, { list: "pushIdentifierList" }),
			userGroup: downcast({
				group: "Id",
			}),
			_id: "userList",
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					group: PRIVATE_CALENDAR_ID,
					groupType: GroupType.Calendar,
				}),
				createTestEntity(GroupMembershipTypeRef, {
					group: SUBSCRIPTION_CALENDAR_ID,
					groupType: GroupType.Calendar,
				}),
			],
		})
		userFacade = downcast({
			getLoggedInUser: () => user,
			getUserGroupId: () => user.userGroup.group,
			getCurrentUserGroupKey: () => object(),
		})
		groupManagementFacade = downcast({})

		entityRestCache = downcast(restClientMock)
		serviceExecutor = object()
		typeModelResolver = clientInitializedTypeModelResolver()
		exposedOperationProgressTracker = object()
		alarmFacadeMock = object()

		calendarFacade = new CalendarFacade(
			userFacade,
			groupManagementFacade,
			entityRestCache,
			new EntityClient(entityRestCache, typeModelResolver),
			exposedOperationProgressTracker,
			serviceExecutor,
			new EntityClient(entityRestCache, typeModelResolver),
			alarmFacadeMock,
		)
	})

	o.spec("setupMultipleCalendarEventsForOneList", function () {
		// Calendar Events
		let personalCalendarEvent: CalendarEvent
		let workCalendarEvent: CalendarEvent

		// Calendar Event Lists
		const shortListId = "shortListId"

		// Dependencies
		let nonCachingEntityClientMock: EntityClient
		let cachingEntityClientMock: EntityClient

		o.beforeEach(async function () {
			personalCalendarEvent = makeCalendarEvent(shortListId)
			workCalendarEvent = makeCalendarEvent(shortListId)

			entityRestCache = object()
			nonCachingEntityClientMock = object()
			cachingEntityClientMock = object()

			calendarFacade = new CalendarFacade(
				userFacade,
				groupManagementFacade,
				entityRestCache,
				nonCachingEntityClientMock,
				exposedOperationProgressTracker,
				serviceExecutor,
				cachingEntityClientMock,
				alarmFacadeMock,
			)
		})

		o.spec("SetupMultipleError", function () {
			o.test("when all events fail, all events are in failedEvents and we collect the error message", async function () {
				const calendarEvents = [personalCalendarEvent, workCalendarEvent]

				when(cachingEntityClientMock.setupMultipleEntities(shortListId, matchers.anything())).thenReject(
					new SetupMultipleError("Mock error message", [new Error("Inner error message")], calendarEvents),
				)

				const result = await calendarFacade.setupMultipleCalendarEventsForOneList(calendarEvents, shortListId)

				o.check(result.successfulEvents.length).equals(0)
				o.check(result.failedEventsResult.failedEvents).deepEquals(calendarEvents)
				o.check(result.failedEventsResult.errors.length).equals(1)
			})

			o.test("when there is a partial failure, we still collect the successful events and we collect the error message", async function () {
				const calendarEvents = [personalCalendarEvent, workCalendarEvent]

				when(cachingEntityClientMock.setupMultipleEntities(shortListId, matchers.anything())).thenReject(
					new SetupMultipleError("Mock error message", [new Error("Inner error message")], [workCalendarEvent]),
				)

				const result = await calendarFacade.setupMultipleCalendarEventsForOneList(calendarEvents, shortListId)

				o.check(result.successfulEvents).deepEquals([personalCalendarEvent])
				o.check(result.failedEventsResult.failedEvents).deepEquals([workCalendarEvent])
				o.check(result.failedEventsResult.errors.length).equals(1)
			})
		})

		o.test("when event save fails with a non-SetupMultipleError, all events are in failedEvents and we collect the error message", async function () {
			const calendarEvents = [personalCalendarEvent, workCalendarEvent]

			const unexpectedErrorMessage = "Another unexpected error"
			when(cachingEntityClientMock.setupMultipleEntities(shortListId, calendarEvents)).thenReject(new Error(unexpectedErrorMessage))

			const result = await calendarFacade.setupMultipleCalendarEventsForOneList(calendarEvents, shortListId)

			o.check(result.successfulEvents.length).equals(0)
			o.check(result.failedEventsResult.failedEvents).deepEquals(calendarEvents)
			o.check(result.failedEventsResult.errors.length).equals(1)
			o.check(first(result.failedEventsResult.errors)?.message).equals(unexpectedErrorMessage)
		})

		o.test("when all events succeed, all events are in successfulEvents and no errors are present", async function () {
			const calendarEvents = [personalCalendarEvent, workCalendarEvent]

			when(cachingEntityClientMock.setupMultipleEntities(shortListId, calendarEvents)).thenResolve(
				calendarEvents.map((event) => elementIdPart(event._id)),
			)

			const result = await calendarFacade.setupMultipleCalendarEventsForOneList(calendarEvents, shortListId)

			o.check(result.successfulEvents).deepEquals(calendarEvents)
			o.check(result.failedEventsResult.failedEvents.length).equals(0)
			o.check(result.failedEventsResult.errors.length).equals(0)
		})
	})

	o.spec("createCalendarEvents", function () {
		// Function input
		let eventAlarmInfoTemplatesTuples: EventAlarmInfoTemplatesTuple[]

		// Calendar Events
		let personalCalendarEvent: CalendarEvent
		let personalAlarmTemplate: AlarmInfoTemplate
		let workCalendarEvent: CalendarEvent
		let workAlarmTemplate: AlarmInfoTemplate
		let vacationsCalendarEvent: CalendarEvent
		let vacationsAlarmTemplate: AlarmInfoTemplate

		// Calendar Event Lists
		const shortListId = "shortListId"
		let shortListEvents: CalendarEvent[] = []
		const longListId = "longListId"
		let longListEvents: CalendarEvent[] = []

		// Dependencies
		let nonCachingEntityClientMock: EntityClient
		let cachingEntityClientMock: EntityClient

		o.beforeEach(async function () {
			personalCalendarEvent = makeCalendarEvent(shortListId)
			personalAlarmTemplate = makeAlarmInfoTemplate("personalAlarm")
			workCalendarEvent = makeCalendarEvent(shortListId)
			workAlarmTemplate = makeAlarmInfoTemplate("workAlarm")
			shortListEvents = [personalCalendarEvent, workCalendarEvent]

			vacationsCalendarEvent = makeCalendarEvent(longListId)
			vacationsAlarmTemplate = makeAlarmInfoTemplate("vacationsAlarm")
			longListEvents = [vacationsCalendarEvent]

			eventAlarmInfoTemplatesTuples = [
				{ event: personalCalendarEvent, alarmInfoTemplates: [personalAlarmTemplate] },
				{ event: workCalendarEvent, alarmInfoTemplates: [workAlarmTemplate] },
				{ event: vacationsCalendarEvent, alarmInfoTemplates: [vacationsAlarmTemplate] },
			]

			entityRestCache = object()
			nonCachingEntityClientMock = object()
			cachingEntityClientMock = object()

			calendarFacade = new CalendarFacade(
				userFacade,
				groupManagementFacade,
				entityRestCache,
				nonCachingEntityClientMock,
				exposedOperationProgressTracker,
				serviceExecutor,
				cachingEntityClientMock,
				alarmFacadeMock,
			)
		})

		o.spec("save calendar events failure", function () {
			o.test("when all events fail, all events are in failedEvents and alarms are not attempted", async function () {
				when(cachingEntityClientMock.setupMultipleEntities(shortListId, matchers.anything())).thenReject(
					new SetupMultipleError("Mock error message", [new Error("Inner error message")], shortListEvents),
				)
				when(cachingEntityClientMock.setupMultipleEntities(longListId, matchers.anything())).thenReject(
					new SetupMultipleError("Mock error message", [new Error("Inner error message")], longListEvents),
				)

				const expectedFailedEvents = eventAlarmInfoTemplatesTuples.map((tuple) => tuple.event)

				const result = await calendarFacade.createCalendarEvents(eventAlarmInfoTemplatesTuples, 0)

				o.check(result.failedEvents).deepEquals(expectedFailedEvents)
				o.check(result.failedEventErrors.length).equals(2) // One error per list
				verify(alarmFacadeMock.createAlarms(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			})

			o.test("when some events fail, only successful events have alarms saved", async function () {
				const expectedFailedEvents = [workCalendarEvent]
				const shortListSuccessTuples = [{ event: personalCalendarEvent, alarmInfoTemplates: [personalAlarmTemplate] }]
				const longListSuccessTuples = [{ event: vacationsCalendarEvent, alarmInfoTemplates: [vacationsAlarmTemplate] }]

				when(cachingEntityClientMock.setupMultipleEntities(shortListId, matchers.anything())).thenReject(
					new SetupMultipleError("Mock error message", [new Error("Inner error message")], expectedFailedEvents),
				)
				when(cachingEntityClientMock.setupMultipleEntities(longListId, matchers.anything())).thenResolve([elementIdPart(vacationsCalendarEvent._id)])
				when(alarmFacadeMock.createAlarms(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve()

				const result = await calendarFacade.createCalendarEvents(eventAlarmInfoTemplatesTuples, 0)

				o.check(result.failedEvents).deepEquals(expectedFailedEvents)
				o.check(result.failedEventErrors.length).equals(1) // We had one error when saving the shortList
				verify(alarmFacadeMock.createAlarms(user, shortListSuccessTuples, matchers.anything()), { times: 1 })
				verify(alarmFacadeMock.createAlarms(user, longListSuccessTuples, matchers.anything()), { times: 1 })
				verify(alarmFacadeMock.createAlarms(matchers.anything(), matchers.anything(), matchers.anything()), { times: 2 })
			})

			o.test("when one list fails entirely, the other list is still processed", async function () {
				const longListSuccessTuples = [{ event: vacationsCalendarEvent, alarmInfoTemplates: [vacationsAlarmTemplate] }]

				when(cachingEntityClientMock.setupMultipleEntities(shortListId, matchers.anything())).thenReject(
					new SetupMultipleError("Mock error message", [new Error("Inner error message")], shortListEvents),
				)
				when(cachingEntityClientMock.setupMultipleEntities(longListId, matchers.anything())).thenResolve([elementIdPart(vacationsCalendarEvent._id)])
				when(alarmFacadeMock.createAlarms(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve()

				const result = await calendarFacade.createCalendarEvents(eventAlarmInfoTemplatesTuples, 0)

				o.check(result.successfulEvents).deepEquals(longListEvents)
				o.check(result.failedEvents).deepEquals(shortListEvents)
				o.check(result.failedEventErrors.length).equals(1) // We had one error when saving the shortList
				verify(alarmFacadeMock.createAlarms(user, longListSuccessTuples, matchers.anything()), { times: 1 })
			})
		})

		o.spec("create alarms failure", function () {
			o.test("when alarm save fails, the affected events remain in successfulEvents but are also reported in failedAlarms", async function () {
				const expectedSuccessfulEvents = shortListEvents.concat(longListEvents)

				when(alarmFacadeMock.createAlarms(user, matchers.anything(), matchers.anything())).thenReject(new Error("Save alarms mock error"))

				const result = await calendarFacade.createCalendarEvents(eventAlarmInfoTemplatesTuples, 0)

				o.check(result.successfulEvents).deepEquals(expectedSuccessfulEvents)
				o.check(result.failedAlarmErrors.length).equals(2) // One error per list
				o.check(result.failedAlarms).deepEquals(eventAlarmInfoTemplatesTuples)
			})
		})

		o.spec("success scenarios", function () {
			o.test("when input is empty, an empty result is returned", async function () {
				const result = await calendarFacade.createCalendarEvents([], 0)

				o.check(result.successfulEvents.length).equals(0)
				o.check(result.failedEvents.length).equals(0)
				o.check(result.failedEventErrors.length).equals(0)
				o.check(result.failedAlarms.length).equals(0)
				o.check(result.failedAlarmErrors.length).equals(0)

				verify(cachingEntityClientMock.loadAll(PushIdentifierTypeRef, matchers.anything()), { times: 0 })
				verify(cachingEntityClientMock.setupMultipleEntities(matchers.anything(), matchers.anything()), { times: 0 })
				verify(alarmFacadeMock.createAlarms(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			})

			o.test("when all events and alarms succeed, all events are in successfulEvents and no failures are reported", async function () {
				const expectedSuccessfulEvents = shortListEvents.concat(longListEvents)
				const shortListSuccessTuples = [
					{ event: personalCalendarEvent, alarmInfoTemplates: [personalAlarmTemplate] },
					{ event: workCalendarEvent, alarmInfoTemplates: [workAlarmTemplate] },
				]
				const longListSuccessTuples = [{ event: vacationsCalendarEvent, alarmInfoTemplates: [vacationsAlarmTemplate] }]
				when(alarmFacadeMock.createAlarms(user, shortListSuccessTuples, matchers.anything())).thenResolve()
				when(alarmFacadeMock.createAlarms(user, longListSuccessTuples, matchers.anything())).thenResolve()

				const result = await calendarFacade.createCalendarEvents(eventAlarmInfoTemplatesTuples, 0)

				o.check(result.successfulEvents).deepEquals(expectedSuccessfulEvents)
				o.check(result.failedEvents.length).equals(0)
				o.check(result.failedEventErrors.length).equals(0)
				o.check(result.failedAlarms.length).equals(0)
				o.check(result.failedAlarmErrors.length).equals(0)

				verify(alarmFacadeMock.createAlarms(user, shortListSuccessTuples, matchers.anything()), { times: 1 })
				verify(alarmFacadeMock.createAlarms(user, longListSuccessTuples, matchers.anything()), { times: 1 })
			})
			o.test("when events are successful and have no alarms, alarm service is NOT called, to prevent unnecessary server requests", async function () {
				const expectedSuccessfulEvents = shortListEvents.concat(longListEvents)

				// remove alarms from tuples
				eventAlarmInfoTemplatesTuples = eventAlarmInfoTemplatesTuples.map((tuple) => {
					tuple.alarmInfoTemplates = []
					return tuple
				})

				const result = await calendarFacade.createCalendarEvents(eventAlarmInfoTemplatesTuples, 0)

				o.check(result.successfulEvents).deepEquals(expectedSuccessfulEvents)
				verify(alarmFacadeMock.createAlarms(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			})

			o.test("when events are successful and only 1 event has an alarm, the alarm service is called, only for the relevant event", async function () {
				const expectedSuccessfulEvents = shortListEvents.concat(longListEvents)
				const shortListSuccessTuples = [{ event: workCalendarEvent, alarmInfoTemplates: [workAlarmTemplate] }]

				eventAlarmInfoTemplatesTuples = [
					{ event: personalCalendarEvent, alarmInfoTemplates: [] },
					{ event: workCalendarEvent, alarmInfoTemplates: [workAlarmTemplate] },
					{ event: vacationsCalendarEvent, alarmInfoTemplates: [] },
				]
				when(alarmFacadeMock.createAlarms(user, shortListSuccessTuples, matchers.anything())).thenResolve()

				const result = await calendarFacade.createCalendarEvents(eventAlarmInfoTemplatesTuples, 0)

				o.check(result.successfulEvents).deepEquals(expectedSuccessfulEvents)
				o.check(result.failedEvents.length).equals(0)
				o.check(result.failedEventErrors.length).equals(0)
				o.check(result.failedAlarms.length).equals(0)
				o.check(result.failedAlarmErrors.length).equals(0)

				verify(alarmFacadeMock.createAlarms(user, shortListSuccessTuples, matchers.anything()), { times: 1 })
				// verify not called additional times with any other inputs (e.g. for long list)
				verify(alarmFacadeMock.createAlarms(matchers.anything(), matchers.anything(), matchers.anything()), { times: 1 })
			})
		})
	})

	o.spec("loadAlarmEvents", function () {
		o("no alarms", async function () {
			o(await calendarFacade.loadAlarmEvents()).deepEquals([])
		})
		o("one alarm", async function () {
			const calendarId = restClientMock.getNextId()
			const event = makeCalendarEvent(calendarId)
			const alarm = makeUserAlarmInfo(event)
			restClientMock.addListInstances(event, alarm)
			const actual = await calendarFacade.loadAlarmEvents()
			const expected = [{ event, userAlarmInfos: [alarm] }]
			assertSortedEquals(actual, expected)
		})
		o("multiple alarms, same event", async function () {
			const calendarId = restClientMock.getNextId()
			const event = makeCalendarEvent(calendarId)
			const alarm1 = makeUserAlarmInfo(event)
			const alarm2 = makeUserAlarmInfo(event)
			restClientMock.addListInstances(event, alarm1, alarm2)
			const actual = await calendarFacade.loadAlarmEvents()
			const expected = [{ event, userAlarmInfos: [alarm1, alarm2] }]
			assertSortedEquals(actual, expected)
		})
		o("multiple alarms, different events", async function () {
			const calendarId = restClientMock.getNextId()
			const event1 = makeCalendarEvent(calendarId)
			const event2 = makeCalendarEvent(calendarId)
			const alarm1 = makeUserAlarmInfo(event1)
			const alarm2 = makeUserAlarmInfo(event2)
			const alarm3 = makeUserAlarmInfo(event2)
			restClientMock.addListInstances(event1, event2, alarm1, alarm2, alarm3)
			const actual = await calendarFacade.loadAlarmEvents()
			const expected = [
				{ event: event1, userAlarmInfos: [alarm1] },
				{ event: event2, userAlarmInfos: [alarm2, alarm3] },
			]
			assertSortedEquals(actual, expected)
		})
		o("multiple alarms, different calendar", async function () {
			const calendarId1 = restClientMock.getNextId()
			const calendarId2 = restClientMock.getNextId()
			const event1 = makeCalendarEvent(calendarId1)
			const event2 = makeCalendarEvent(calendarId2)
			const event3 = makeCalendarEvent(calendarId2)
			const alarm1 = makeUserAlarmInfo(event1)
			const alarm2 = makeUserAlarmInfo(event2)
			const alarm3 = makeUserAlarmInfo(event2)
			const alarm4 = makeUserAlarmInfo(event3)
			restClientMock.addListInstances(event1, event2, event3, alarm1, alarm2, alarm3, alarm4)
			const actual = await calendarFacade.loadAlarmEvents()
			const expected = [
				{ event: event1, userAlarmInfos: [alarm1] },
				{ event: event2, userAlarmInfos: [alarm2, alarm3] },
				{ event: event3, userAlarmInfos: [alarm4] },
			]
			assertSortedEquals(actual, expected)
		})

		// Event ids can clash because they are generated client side
		o("multiple alarms, different calendar, clashing event ids", async function () {
			const calendarId1 = restClientMock.getNextId()
			const calendarId2 = restClientMock.getNextId()
			const clashingEventId = restClientMock.getNextId()

			const event1 = makeCalendarEvent(calendarId1)
			const event2 = makeCalendarEvent(calendarId2)
			const clashEvent1 = makeCalendarEvent(calendarId1, clashingEventId)
			const clashEvent2 = makeCalendarEvent(calendarId2, clashingEventId)

			const alarm1 = makeUserAlarmInfo(event1)
			const alarm2 = makeUserAlarmInfo(event2)
			const alarm3 = makeUserAlarmInfo(event2)
			const alarm4 = makeUserAlarmInfo(clashEvent1)
			const alarm5 = makeUserAlarmInfo(clashEvent2)
			const alarm6 = makeUserAlarmInfo(clashEvent2)

			restClientMock.addListInstances(event1, event2, clashEvent1, clashEvent2, alarm1, alarm2, alarm3, alarm4, alarm5, alarm6)

			const actual = await calendarFacade.loadAlarmEvents()
			const expected = [
				{ event: event1, userAlarmInfos: [alarm1] },
				{ event: event2, userAlarmInfos: [alarm2, alarm3] },
				{ event: clashEvent1, userAlarmInfos: [alarm4] },
				{ event: clashEvent2, userAlarmInfos: [alarm5, alarm6] },
			]
			assertSortedEquals(actual, expected)
		})

		// missing event should not be an error
		o("multiple alarms, not all events found", async function () {
			const calendarId = restClientMock.getNextId()
			const event = makeCalendarEvent(calendarId)
			const missingEvent = makeCalendarEvent(calendarId)
			const alarm = makeUserAlarmInfo(event)
			const missingAlarm = makeUserAlarmInfo(missingEvent)
			restClientMock.addListInstances(event, alarm, missingAlarm)
			const actual = await calendarFacade.loadAlarmEvents()
			const expected = [{ event, userAlarmInfos: [alarm] }]
			assertSortedEquals(actual, expected)
		})
	})

	o.spec("sortByRecurrenceId", function () {
		o("sorts empty array", function () {
			const arr = []
			sortByRecurrenceId(arr)
			o(arr).deepEquals([])
		})

		o("sorts array with len 1", function () {
			const arr = [createTestEntity(CalendarEventTypeRef, { recurrenceId: new Date("2023-07-17T13:00") })] as Array<CalendarEventAlteredInstance>
			const expected = clone(arr)
			sortByRecurrenceId(arr)
			o(arr).deepEquals(expected)
		})

		o("sorts array that's not sorted", function () {
			const arr = [
				createTestEntity(CalendarEventTypeRef, { recurrenceId: new Date("2023-07-17T13:00") }),
				createTestEntity(CalendarEventTypeRef, { recurrenceId: new Date("2023-07-16T13:00") }),
			] as Array<CalendarEventAlteredInstance>
			const expected = clone(arr)
			const smaller = expected[1]
			expected[1] = expected[0]
			expected[0] = smaller
			sortByRecurrenceId(arr)
			o(arr).deepEquals(expected)
		})
	})

	o.spec("getEventsByUid", function () {
		let noncachingEntityClient: EntityClient
		const privateCalendarGroupRoot = createTestEntity(CalendarGroupRootTypeRef, {
			_id: PRIVATE_CALENDAR_ID,
		})
		const subscriptionGroupRoot = createTestEntity(CalendarGroupRootTypeRef, {
			_id: SUBSCRIPTION_CALENDAR_ID,
		})

		o.beforeEach(() => {
			noncachingEntityClient = object()
			calendarFacade = new CalendarFacade(userFacade, object(), object(), noncachingEntityClient, object(), object(), object(), alarmFacadeMock)

			when(noncachingEntityClient.load(CalendarGroupRootTypeRef, PRIVATE_CALENDAR_ID)).thenResolve(privateCalendarGroupRoot)
			when(noncachingEntityClient.load(CalendarGroupRootTypeRef, SUBSCRIPTION_CALENDAR_ID)).thenResolve(subscriptionGroupRoot)
			when(noncachingEntityClient.load(UserSettingsGroupRootTypeRef, matchers.anything())).thenResolve(
				createTestEntity(UserSettingsGroupRootTypeRef, {
					groupSettings: [
						createTestEntity(GroupSettingsTypeRef, {
							group: SUBSCRIPTION_CALENDAR_ID,
							sourceUrl: "dummyUrl",
						}),
					],
				}),
			)
		})

		o.test("fetch all calendars", async function () {
			// Arrange
			const groupsCaptor = matchers.captor()

			//Act
			await calendarFacade.getEventsByUid("dummyUid", CachingMode.Bypass, false)

			// Verify
			verify(noncachingEntityClient.load(CalendarGroupRootTypeRef, groupsCaptor.capture()), { times: 2 })
			const groupIds: Id[] = groupsCaptor.values!
			o.check(groupIds[0]).equals(PRIVATE_CALENDAR_ID)
			o.check(groupIds[1]).equals(SUBSCRIPTION_CALENDAR_ID)
		})

		o.test("fetch only private calendars", async function () {
			// Arrange
			const groupsCaptor = matchers.captor()

			//Act
			await calendarFacade.getEventsByUid("dummyUid", CachingMode.Bypass, true)

			// Verify
			verify(noncachingEntityClient.load(CalendarGroupRootTypeRef, groupsCaptor.capture()), { times: 1 })
			const groupIds: Id = groupsCaptor.value
			o.check(groupIds).equals(PRIVATE_CALENDAR_ID)
		})
	})
})
