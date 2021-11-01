// @flow

import o from "ospec"
import type {EventWithAlarmInfos} from "../../../../src/api/worker/facades/CalendarFacade"
import {CalendarFacade} from "../../../../src/api/worker/facades/CalendarFacade"
import {EntityRestClientMock} from "../EntityRestClientMock"
import {EntityRestCache} from "../../../../src/api/worker/rest/EntityRestCache"
import {downcast, isSameTypeRef, neverNull, noOp} from "@tutao/tutanota-utils"
import {UserManagementFacade} from "../../../../src/api/worker/facades/UserManagementFacade"
import {LoginFacade} from "../../../../src/api/worker/facades/LoginFacade"
import type {UserAlarmInfo} from "../../../../src/api/entities/sys/UserAlarmInfo"
import {createUserAlarmInfo, UserAlarmInfoTypeRef} from "../../../../src/api/entities/sys/UserAlarmInfo"
import {createCalendarEventRef} from "../../../../src/api/entities/sys/CalendarEventRef"
import {getElementId, getLetId, getListId} from "../../../../src/api/common/utils/EntityUtils"
import type {AlarmInfo} from "../../../../src/api/entities/sys/AlarmInfo"
import {createAlarmInfo} from "../../../../src/api/entities/sys/AlarmInfo"
import type {CalendarEvent} from "../../../../src/api/entities/tutanota/CalendarEvent"
import {CalendarEventTypeRef, createCalendarEvent} from "../../../../src/api/entities/tutanota/CalendarEvent"
import type {User} from "../../../../src/api/entities/sys/User"
import {createUser} from "../../../../src/api/entities/sys/User"
import {createUserAlarmInfoListType} from "../../../../src/api/entities/sys/UserAlarmInfoListType"
import {ProgressMonitor} from "../../../../src/api/common/utils/ProgressMonitor"
import {createPushIdentifierList, PushIdentifierListTypeRef} from "../../../../src/api/entities/sys/PushIdentifierList"
import {assertThrows, mockAttribute, unmockAttribute} from "@tutao/tutanota-test-utils"
import {ImportError} from "../../../../src/api/common/error/ImportError"
import {PushIdentifierTypeRef} from "../../../../src/api/entities/sys/PushIdentifier"


o.spec("CalendarFacadeTest", async function () {

	let userAlarmInfoListId: Id
	let user: User
	let loginFacade: LoginFacade
	let userManagementFacade: UserManagementFacade
	let restClientMock: EntityRestClientMock
	let entityRestCache: EntityRestCache
	let calendarFacade: CalendarFacade
	let progressMonitor: ProgressMonitor
	let entityRequest: Function
	let requestSpy: any
	let sendAlarmNotificationsMock
	let loadAllMock
	let enitityClientLoadAllMock
	let entityRequestMock
	let workerMock


	function sortEventsWithAlarmInfos(eventsWithAlarmInfos: Array<EventWithAlarmInfos>) {
		const idCompare = (el1, el2) => getLetId(el1).join("").localeCompare(getLetId(el2).join(""))

		eventsWithAlarmInfos.sort((a, b) => idCompare(a.event, b.event))

		for (let {userAlarmInfos} of eventsWithAlarmInfos) {
			userAlarmInfos.sort(idCompare)
		}
	}

	// We have to sort because deepEquals takes list order into account
	function assertSortedEquals(actual, expected) {
		o(sortEventsWithAlarmInfos(actual)).deepEquals(sortEventsWithAlarmInfos(expected))
	}


	function makeEvent(listId: Id, elementId?: Id): CalendarEvent {
		return createCalendarEvent({
			_id: [listId, elementId || restClientMock.getNextId()]
		})
	}

	function makeUserAlarmInfo(event: CalendarEvent): UserAlarmInfo {
		return createUserAlarmInfo({
			_id: [userAlarmInfoListId, restClientMock.getNextId()],
			alarmInfo: makeAlarmInfo(event)
		})
	}

	function makeAlarmInfo(event: CalendarEvent): AlarmInfo {
		return createAlarmInfo({
			calendarRef: createCalendarEventRef({
				elementId: getElementId(event),
				listId: getListId(event)
			})
		})
	}

	o.beforeEach(async function () {
		restClientMock = new EntityRestClientMock()
		userAlarmInfoListId = restClientMock.getNextId()

		user = createUser({
			alarmInfoList: createUserAlarmInfoListType({
				alarms: userAlarmInfoListId
			}),
			pushIdentifierList: createPushIdentifierList({list: "pushIdentifierList"}),
			userGroup: downcast({
				group: "Id"
			})
		})
		loginFacade = downcast({
			getLoggedInUser: () => user
		})
		userManagementFacade = downcast({})

		entityRestCache = downcast(restClientMock)
		workerMock = downcast({
			sendProgress: () => Promise.resolve()
		})
		calendarFacade = new CalendarFacade(loginFacade, userManagementFacade, entityRestCache, workerMock)
	})


	o.spec("saveCalendarEvents", async function () {
		o.beforeEach(async function () {
			progressMonitor = downcast({
				workDone: noOp
			})

			loadAllMock = function (typeRef, listId, start) {
				if (isSameTypeRef(typeRef, PushIdentifierTypeRef)) {
					return Promise.resolve(neverNull(user.pushIdentifierList).list)
				}
				throw new Error("should not be called with typeRef: " + typeRef)
			}
			entityRequest = function () {
				return Promise.resolve()
			}//dummy overwrite in test
			requestSpy = o.spy(function () {
				return entityRequest.apply(this, arguments)
			})

			sendAlarmNotificationsMock = mockAttribute(calendarFacade, calendarFacade._sendAlarmNotifications, () => Promise.resolve())
			enitityClientLoadAllMock = mockAttribute(calendarFacade._entity, calendarFacade._entity.loadAll, loadAllMock)
			entityRequestMock = mockAttribute(restClientMock, restClientMock.entityRequest, requestSpy)
		})
		o.afterEach(async function () {
			unmockAttribute(enitityClientLoadAllMock)
			unmockAttribute(entityRequestMock)
			unmockAttribute(sendAlarmNotificationsMock)
		})

		o("save events with alarms posts all alarms in one post multiple", async function () {
				entityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
					if (isSameTypeRef(typeRef, CalendarEventTypeRef)) {
						o(entity.length).equals(2)
						o(entity[0].alarmInfos).deepEquals([[userAlarmInfoListId, "1"]])
						o(entity[1].alarmInfos).deepEquals([[userAlarmInfoListId, "2"], [userAlarmInfoListId, "3"]])
						return Promise.resolve(["eventId1", "eventId2"])
					} else if (isSameTypeRef(typeRef, UserAlarmInfoTypeRef)) {
						o(entity.length).equals(3)
						return Promise.resolve(["1", "2", "3"])
					}
				}

				const listId = "listID"
				const event1 = makeEvent(listId, "eventId1")
				const event2 = makeEvent(listId, "eventId2")
				const eventsWrapper = [
					{
						event: event1,
						alarms: [makeAlarmInfo(event1)]
					},
					{
						event: event2,
						alarms: [makeAlarmInfo(event2), makeAlarmInfo(event2)]
					}

				]
				await calendarFacade._saveCalendarEvents(eventsWrapper)
				o(calendarFacade._sendAlarmNotifications.callCount).equals(1)
				o(calendarFacade._sendAlarmNotifications.args[0].length).equals(3)
				o(entityRestCache.entityRequest.callCount).equals(2)
			}
		)


		o("If alarms cannot be saved a user error is thrown and events are not created", async function () {
				entityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
					if (isSameTypeRef(typeRef, UserAlarmInfoTypeRef)) {
						return Promise.reject(new Error("could not create alarms"))
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
						alarms: [makeAlarmInfo(event1)]
					},
					{
						event: event2,
						alarms: [makeAlarmInfo(event2), makeAlarmInfo(event2)]
					}

				]
				const result = await assertThrows(ImportError, async () => await calendarFacade._saveCalendarEvents(eventsWrapper))
				o(result.numFailed).equals(2)
				o(calendarFacade._sendAlarmNotifications.callCount).equals(0)
				o(entityRestCache.entityRequest.callCount).equals(1)

			}
		)

		o("If not all events can be saved a user error is thrown", async function () {
				const listId1 = "listID1"
				const listId2 = "listID2"
				entityRequest = function (typeRef, method, listId, id, entity, queryParameter, extraHeaders) {
					if (isSameTypeRef(typeRef, CalendarEventTypeRef)) {
						if (listId === listId1) {
							return Promise.reject(new Error("Could not save event"))
						} else if (listId === listId2) {
							return Promise.resolve(["eventId2"])
						} else {
							throw new Error("Unknown id")
						}
					} else if (isSameTypeRef(typeRef, UserAlarmInfoTypeRef)) {
						o(entity.length).equals(3)
						return Promise.resolve(["1", "2", "3"])
					}
					throw new Error("should not be reached")
				}

				const event1 = makeEvent(listId1, "eventId1")
				const event2 = makeEvent(listId2, "eventId2")
				const eventsWrapper = [
					{
						event: event1,
						alarms: [makeAlarmInfo(event1)]
					},
					{
						event: event2,
						alarms: [makeAlarmInfo(event2), makeAlarmInfo(event2)]
					}

				]
				const result = await assertThrows(ImportError, async () => await calendarFacade._saveCalendarEvents(eventsWrapper))
				o(result.numFailed).equals(1)
				o(calendarFacade._sendAlarmNotifications.callCount).equals(1)
				o(calendarFacade._sendAlarmNotifications.args[0].length).equals(2)
				o(entityRestCache.entityRequest.callCount).equals(3)
			}
		)
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
			const expected = [{event, userAlarmInfos: [alarm]}]
			assertSortedEquals(actual, expected)
		})
		o("multiple alarms, same event", async function () {
			const calendarId = restClientMock.getNextId()
			const event = makeEvent(calendarId)
			const alarm1 = makeUserAlarmInfo(event)
			const alarm2 = makeUserAlarmInfo(event)
			restClientMock.addListInstances(event, alarm1, alarm2)
			const actual = await calendarFacade.loadAlarmEvents()
			const expected = [{event, userAlarmInfos: [alarm1, alarm2]}]
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
				{event: event1, userAlarmInfos: [alarm1]},
				{event: event2, userAlarmInfos: [alarm2, alarm3]}
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
				{event: event1, userAlarmInfos: [alarm1]},
				{event: event2, userAlarmInfos: [alarm2, alarm3]},
				{event: event3, userAlarmInfos: [alarm4]}
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
				{event: event1, userAlarmInfos: [alarm1]},
				{event: event2, userAlarmInfos: [alarm2, alarm3]},
				{event: clashEvent1, userAlarmInfos: [alarm4]},
				{event: clashEvent2, userAlarmInfos: [alarm5, alarm6]}
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
			const expected = [{event, userAlarmInfos: [alarm]}]
			assertSortedEquals(actual, expected)
		})
	})
})