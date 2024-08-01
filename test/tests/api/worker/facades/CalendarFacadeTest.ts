import o from "@tutao/otest"
import type { CalendarEventAlteredInstance, EventWithUserAlarmInfos } from "../../../../../src/common/api/worker/facades/lazy/CalendarFacade.js"
import { CalendarFacade, sortByRecurrenceId } from "../../../../../src/common/api/worker/facades/lazy/CalendarFacade.js"
import { EntityRestClientMock } from "../rest/EntityRestClientMock.js"
import { DefaultEntityRestCache } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import { clone, downcast, isSameTypeRef, neverNull, noOp } from "@tutao/tutanota-utils"
import type { AlarmInfo, User, UserAlarmInfo } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import {
	AlarmInfoTypeRef,
	CalendarEventRefTypeRef,
	PushIdentifierListTypeRef,
	PushIdentifierTypeRef,
	UserAlarmInfoListTypeTypeRef,
	UserAlarmInfoTypeRef,
	UserTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { getElementId, getLetId, getListId } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import type { CalendarEvent } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { CalendarEventTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { ProgressMonitor } from "../../../../../src/common/api/common/utils/ProgressMonitor.js"
import { assertThrows, mockAttribute, spy, unmockAttribute } from "@tutao/tutanota-test-utils"
import { ImportError } from "../../../../../src/common/api/common/error/ImportError.js"
import { SetupMultipleError } from "../../../../../src/common/api/common/error/SetupMultipleError.js"
import { InstanceMapper } from "../../../../../src/common/api/worker/crypto/InstanceMapper.js"
import { GroupManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/GroupManagementFacade.js"
import { object } from "testdouble"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade"
import { InfoMessageHandler } from "../../../../../src/common/gui/InfoMessageHandler.js"
import { ConnectionError } from "../../../../../src/common/api/common/error/RestError.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { createTestEntity } from "../../../TestUtils.js"

o.spec("CalendarFacadeTest", function () {
	let userAlarmInfoListId: Id
	let user: User
	let userFacade: UserFacade
	let groupManagementFacade: GroupManagementFacade
	let restClientMock: EntityRestClientMock
	let entityRestCache: DefaultEntityRestCache
	let calendarFacade: CalendarFacade
	let progressMonitor: ProgressMonitor
	let entityRequest: Function
	let requestSpy: any
	let sendAlarmNotificationsMock
	let loadAllMock
	let enitityClientLoadAllMock
	let entityRequestMock
	let workerMock
	let nativeMock
	let instanceMapper
	let serviceExecutor: IServiceExecutor
	let cryptoFacade: CryptoFacade
	let infoMessageHandler: InfoMessageHandler

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

	function makeEvent(listId: Id, elementId?: Id): CalendarEvent {
		return createTestEntity(CalendarEventTypeRef, {
			_id: [listId, elementId || restClientMock.getNextId()],
			uid: `${listId}-${elementId}`,
		})
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
		})
		userFacade = downcast({
			getLoggedInUser: () => user,
		})
		groupManagementFacade = downcast({})

		entityRestCache = downcast(restClientMock)
		workerMock = downcast({
			sendProgress: () => Promise.resolve(),
		})
		nativeMock = downcast({
			invokeNative: spy(() => Promise.resolve()),
		})
		instanceMapper = new InstanceMapper()
		serviceExecutor = object()
		cryptoFacade = object()
		infoMessageHandler = object()
		calendarFacade = new CalendarFacade(
			userFacade,
			groupManagementFacade,
			entityRestCache,
			new EntityClient(entityRestCache),
			nativeMock,
			workerMock,
			instanceMapper,
			serviceExecutor,
			cryptoFacade,
			infoMessageHandler,
		)
	})

	o.spec("saveCalendarEvents", function () {
		o.beforeEach(async function () {
			progressMonitor = downcast({
				workDone: noOp,
			})

			loadAllMock = function (typeRef, listId, start) {
				if (isSameTypeRef(typeRef, PushIdentifierTypeRef)) {
					return Promise.resolve(neverNull(user.pushIdentifierList).list)
				}
				throw new Error("should not be called with typeRef: " + typeRef)
			}
			entityRequest = function () {
				return Promise.resolve()
			} //dummy overwrite in test
			requestSpy = spy(function () {
				return entityRequest.apply(this, arguments)
			})

			// @ts-ignore
			sendAlarmNotificationsMock = mockAttribute(calendarFacade, calendarFacade.sendAlarmNotifications, () => Promise.resolve())
			enitityClientLoadAllMock = mockAttribute(calendarFacade.cachingEntityClient, calendarFacade.cachingEntityClient.loadAll, loadAllMock)
			entityRequestMock = mockAttribute(restClientMock, restClientMock.setupMultiple, requestSpy)
		})
		o.afterEach(async function () {
			unmockAttribute(enitityClientLoadAllMock)
			unmockAttribute(entityRequestMock)
			unmockAttribute(sendAlarmNotificationsMock)
		})

		o("save events with alarms posts all alarms in one post multiple", async function () {
			entityRequest = function (listId, instances) {
				const typeRef = instances[0]?._type
				if (isSameTypeRef(typeRef, CalendarEventTypeRef)) {
					o(instances.length).equals(2)
					o(instances[0].alarmInfos).deepEquals([[userAlarmInfoListId, "1"]])
					o(instances[1].alarmInfos).deepEquals([
						[userAlarmInfoListId, "2"],
						[userAlarmInfoListId, "3"],
					])
					return Promise.resolve(["eventId1", "eventId2"])
				} else if (isSameTypeRef(typeRef, UserAlarmInfoTypeRef)) {
					o(instances.length).equals(3)
					return Promise.resolve(["1", "2", "3"])
				}
			}

			const listId = "listID"
			const event1 = makeEvent(listId, "eventId1")
			const event2 = makeEvent(listId, "eventId2")
			const eventsWrapper = [
				{
					event: event1,
					alarms: [makeAlarmInfo(event1)],
				},
				{
					event: event2,
					alarms: [makeAlarmInfo(event2), makeAlarmInfo(event2)],
				},
			]
			// @ts-ignore
			await calendarFacade.saveCalendarEvents(eventsWrapper, () => Promise.resolve())
			// @ts-ignore
			o(calendarFacade.sendAlarmNotifications.callCount).equals(1)
			// @ts-ignore
			o(calendarFacade.sendAlarmNotifications.args[0].length).equals(3)
			// @ts-ignore
			o(entityRestCache.setupMultiple.callCount).equals(2)
		})

		o("If alarms cannot be saved a user error is thrown and events are not created", async function () {
			entityRequest = function (listId, instances) {
				const typeRef = instances[0]?._type
				if (isSameTypeRef(typeRef, UserAlarmInfoTypeRef)) {
					return Promise.reject(new SetupMultipleError("could not create alarms", [new Error("failed")], instances))
				} else {
					throw new Error("Wrong typeref")
				}
			}

			const listId = "listID"
			const event1 = makeEvent(listId, "eventId1")
			const event2 = makeEvent(listId, "eventId2")
			const eventsWrapper = [
				{
					event: event1,
					alarms: [makeAlarmInfo(event1)],
				},
				{
					event: event2,
					alarms: [makeAlarmInfo(event2), makeAlarmInfo(event2)],
				},
			]
			// @ts-ignore
			const result = await assertThrows(ImportError, async () => await calendarFacade.saveCalendarEvents(eventsWrapper, () => Promise.resolve()))
			o(result.numFailed).equals(2)
			// @ts-ignore
			o(calendarFacade.sendAlarmNotifications.callCount).equals(0)
			// @ts-ignore
			o(entityRestCache.setupMultiple.callCount).equals(1)
		})

		o("If not all events can be saved and no connection error is present, an ImportError is thrown", async function () {
			const listId1 = "listID1"
			const listId2 = "listID2"
			entityRequest = function (listId, instances) {
				const typeRef = instances[0]?._type
				if (isSameTypeRef(typeRef, CalendarEventTypeRef)) {
					if (listId === listId1) {
						return Promise.reject(new SetupMultipleError("could not save event", [new Error("failed")], instances))
					} else if (listId === listId2) {
						return Promise.resolve(["eventId2"])
					} else {
						throw new Error("Unknown id")
					}
				} else if (isSameTypeRef(typeRef, UserAlarmInfoTypeRef)) {
					o(instances.length).equals(3)
					return Promise.resolve(["1", "2", "3"])
				}
				throw new Error("should not be reached")
			}

			const event1 = makeEvent(listId1, "eventId1")
			const event2 = makeEvent(listId2, "eventId2")
			const eventsWrapper = [
				{
					event: event1,
					alarms: [makeAlarmInfo(event1)],
				},
				{
					event: event2,
					alarms: [makeAlarmInfo(event2), makeAlarmInfo(event2)],
				},
			]
			// @ts-ignore
			const result = await assertThrows(ImportError, async () => await calendarFacade.saveCalendarEvents(eventsWrapper, () => Promise.resolve()))
			o(result.numFailed).equals(1)
			// @ts-ignore
			o(calendarFacade.sendAlarmNotifications.callCount).equals(1)
			// @ts-ignore
			o(calendarFacade.sendAlarmNotifications.args[0].length).equals(2)
			// @ts-ignore
			o(entityRestCache.setupMultiple.callCount).equals(3)
		})
		o("If not all events can be saved and a connection error is present, it is thrown", async function () {
			const listId1 = "listID1"
			const listId2 = "listID2"
			entityRequest = function (listId, instances) {
				const typeRef = instances[0]?._type
				if (isSameTypeRef(typeRef, CalendarEventTypeRef)) {
					if (listId === listId1) {
						return Promise.reject(
							new SetupMultipleError("could not save event", [new Error("failed"), new ConnectionError("no connection")], instances),
						)
					} else if (listId === listId2) {
						return Promise.resolve(["eventId2"])
					} else {
						throw new Error("Unknown id")
					}
				} else if (isSameTypeRef(typeRef, UserAlarmInfoTypeRef)) {
					o(instances.length).equals(3)
					return Promise.resolve(["1", "2", "3"])
				}
				throw new Error("should not be reached")
			}

			const event1 = makeEvent(listId1, "eventId1")
			const event2 = makeEvent(listId2, "eventId2")
			const eventsWrapper = [
				{
					event: event1,
					alarms: [makeAlarmInfo(event1)],
				},
				{
					event: event2,
					alarms: [makeAlarmInfo(event2), makeAlarmInfo(event2)],
				},
			]
			// @ts-ignore
			await assertThrows(ConnectionError, async () => await calendarFacade.saveCalendarEvents(eventsWrapper, () => Promise.resolve()))
			// @ts-ignore
			o(calendarFacade.sendAlarmNotifications.callCount).equals(1)
			// @ts-ignore
			o(calendarFacade.sendAlarmNotifications.args[0].length).equals(2)
			// @ts-ignore
			o(entityRestCache.setupMultiple.callCount).equals(3)
		})
	})

	o.spec("loadAlarmEvents", function () {
		o("no alarms", async function () {
			o(await calendarFacade.loadAlarmEvents()).deepEquals([])
		})
		o("one alarm", async function () {
			const calendarId = restClientMock.getNextId()
			const event = makeEvent(calendarId)
			const alarm = makeUserAlarmInfo(event)
			restClientMock.addListInstances(event, alarm)
			const actual = await calendarFacade.loadAlarmEvents()
			const expected = [{ event, userAlarmInfos: [alarm] }]
			assertSortedEquals(actual, expected)
		})
		o("multiple alarms, same event", async function () {
			const calendarId = restClientMock.getNextId()
			const event = makeEvent(calendarId)
			const alarm1 = makeUserAlarmInfo(event)
			const alarm2 = makeUserAlarmInfo(event)
			restClientMock.addListInstances(event, alarm1, alarm2)
			const actual = await calendarFacade.loadAlarmEvents()
			const expected = [{ event, userAlarmInfos: [alarm1, alarm2] }]
			assertSortedEquals(actual, expected)
		})
		o("multiple alarms, different events", async function () {
			const calendarId = restClientMock.getNextId()
			const event1 = makeEvent(calendarId)
			const event2 = makeEvent(calendarId)
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
			const event1 = makeEvent(calendarId1)
			const event2 = makeEvent(calendarId2)
			const event3 = makeEvent(calendarId2)
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

			const event1 = makeEvent(calendarId1)
			const event2 = makeEvent(calendarId2)
			const clashEvent1 = makeEvent(calendarId1, clashingEventId)
			const clashEvent2 = makeEvent(calendarId2, clashingEventId)

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
			const event = makeEvent(calendarId)
			const missingEvent = makeEvent(calendarId)
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
})
