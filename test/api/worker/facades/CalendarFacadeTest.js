// @flow

import o from "ospec"
import {CalendarFacade} from "../../../../src/api/worker/facades/CalendarFacade"
import {EntityRestClientMock} from "../EntityRestClientMock"
import {EntityRestCache} from "../../../../src/api/worker/rest/EntityRestCache"
import {downcast} from "@tutao/tutanota-utils"
import {UserManagementFacade} from "../../../../src/api/worker/facades/UserManagementFacade"
import {LoginFacade} from "../../../../src/api/worker/facades/LoginFacade"
import {createUserAlarmInfo} from "../../../../src/api/entities/sys/UserAlarmInfo"
import {createCalendarEventRef} from "../../../../src/api/entities/sys/CalendarEventRef"
import {elementIdPart, getElementId, getLetId, getListId, listIdPart} from "../../../../src/api/common/utils/EntityUtils"
import {createAlarmInfo} from "../../../../src/api/entities/sys/AlarmInfo"
import {createCalendarEvent} from "../../../../src/api/entities/tutanota/CalendarEvent"
import type {User} from "../../../../src/api/entities/sys/User"
import {createUser} from "../../../../src/api/entities/sys/User"
import {createUserAlarmInfoListType} from "../../../../src/api/entities/sys/UserAlarmInfoListType"
import type {CalendarEvent} from "../../../../src/api/entities/tutanota/CalendarEvent"
import type {UserAlarmInfo} from "../../../../src/api/entities/sys/UserAlarmInfo"
import type {EventWithAlarmInfos} from "../../../../src/api/worker/facades/CalendarFacade"

o.spec("CalendarFacadeTest", function () {

	o.spec("loadAlarmEvents", function () {

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

		let userAlarmInfoListId: Id
		let user: User
		let loginFacade: LoginFacade
		let userManagementFacade: UserManagementFacade
		let restClientMock: EntityRestClientMock
		let entityRestCache: EntityRestCache
		let calendarFacade: CalendarFacade

		o.beforeEach(function () {

			restClientMock = new EntityRestClientMock()

			userAlarmInfoListId = restClientMock.getNextId()
			user = createUser({
				alarmInfoList: createUserAlarmInfoListType({
					alarms: userAlarmInfoListId
				})
			})
			loginFacade = downcast({
				getLoggedInUser: () => user
			})
			userManagementFacade = downcast({})
			entityRestCache = downcast(restClientMock)
			calendarFacade = new CalendarFacade(loginFacade, userManagementFacade, entityRestCache)
		})


		function makeEvent(listId: Id, elementId?: Id): CalendarEvent {
			return createCalendarEvent({
				_id: [listId, elementId || restClientMock.getNextId()]
			})
		}

		function makeUserAlarmInfo(event: CalendarEvent): UserAlarmInfo {
			return createUserAlarmInfo({
				_id: [userAlarmInfoListId, restClientMock.getNextId()],
				alarmInfo: createAlarmInfo({
					calendarRef: createCalendarEventRef({
						elementId: getElementId(event),
						listId: getListId(event)
					})
				})
			})
		}

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