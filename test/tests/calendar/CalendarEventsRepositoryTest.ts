import o from "@tutao/otest"
import { CalendarEventsRepository, DaysToEvents } from "../../../src/common/calendar/date/CalendarEventsRepository"
import { matchers, object, when } from "testdouble"
import { getTimeZone } from "../../../src/common/calendar/date/CalendarUtils"
import { EntityEventsListener, EventController } from "../../../src/common/api/main/EventController"
import { UserController } from "../../../src/common/api/main/UserController"
import { LoginController } from "../../../src/common/api/main/LoginController"
import { CalendarInfo, CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils"
import { OperationType } from "../../../src/common/api/common/TutanotaConstants"
import { CalendarEventTypeRef, CalendarGroupRootTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { createTestEntity } from "../TestUtils"
import { CalendarFacade } from "../../../src/common/api/worker/facades/lazy/CalendarFacade"
import { getStartOfDay } from "@tutao/tutanota-utils"

o.spec("CalendarEventRepositoryTest", function () {
	o.spec("entityEventsReceived", function () {
		const eventOwnerGroupId = "ownerGroupId"
		const shotEventsListId = "shotEventsListId"
		const timezone = getTimeZone()

		const eventControllerMock: EventController = object()
		let entityEventsListener: EntityEventsListener | null = null

		o.spec("createOrUpdateCalendarEvent", function () {
			let userControllerMock: UserController
			let calendarFacade: CalendarFacade
			let loginControllerMock: LoginController
			let calendarModelMock: CalendarModel
			let entityClientMock: EntityClient
			let calendarInfosStreamMock: Stream<ReadonlyMap<Id, CalendarInfo>>
			let calendarEventsRepositoryMock: CalendarEventsRepository

			o.beforeEach(function () {
				userControllerMock = object()
				calendarFacade = object()
				loginControllerMock = object()
				calendarModelMock = object()
				entityClientMock = object()
				calendarInfosStreamMock = object()

				// Capturing the callback function passed as argument to addEntityListener at CalendarEventsRepository constructor
				when(eventControllerMock.addEntityListener(matchers.anything())).thenDo((listener) => {
					entityEventsListener = listener
				})

				when(userControllerMock.getCalendarMemberships()).thenReturn([])
				when(loginControllerMock.getUserController()).thenReturn(userControllerMock)

				when(calendarModelMock.getCalendarInfosStream()).thenReturn(calendarInfosStreamMock)
				when(calendarInfosStreamMock.map(matchers.anything())).thenDo(() => {})

				// Not sure why but after every test case getCalendarInfos lose its mock and starts to return undefined
				// Therefore we reset the mock for each test
				const calendarInfo: CalendarInfo = object()
				calendarInfo.groupRoot = createTestEntity(CalendarGroupRootTypeRef, { shortEvents: shotEventsListId })
				const calendarInfos = new Map([[eventOwnerGroupId, calendarInfo]])
				when(calendarModelMock.getCalendarInfos()).thenResolve(calendarInfos)

				calendarEventsRepositoryMock = new CalendarEventsRepository(
					calendarModelMock,
					calendarFacade,
					timezone,
					entityClientMock,
					eventControllerMock,
					object(),
					loginControllerMock,
				)
			})

			o.test("new event happens on a not loaded month", async function () {
				// Arrange
				o.check(entityEventsListener != null).equals(true)

				const eventStartDate = new Date(2025, 7, 26)
				const event = createTestEntity(CalendarEventTypeRef, {
					_ownerGroup: eventOwnerGroupId,
					_id: [shotEventsListId, "event"],
					startTime: eventStartDate,
					endTime: new Date(2025, 7, 27),
				})
				when(entityClientMock.load(CalendarEventTypeRef, matchers.anything())).thenResolve(event)

				const dateFarFromEvent = new Date(2025, 11, 13)
				const startOfDay = getStartOfDay(dateFarFromEvent).getTime()
				const daysToEventsMock: DaysToEvents = new Map([[startOfDay, []]])
				when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
					daysToEventsMock,
				)
				// Making sure EventRepository.daysToEvents and EventRepository.loadedMonths is initialized
				await calendarEventsRepositoryMock.loadMonthsIfNeeded([dateFarFromEvent], stream(false), null)

				// Act
				const calendarEventUpdate: EntityUpdateData = object()
				calendarEventUpdate.typeRef = CalendarEventTypeRef
				calendarEventUpdate.operation = OperationType.CREATE
				const updates: ReadonlyArray<EntityUpdateData> = [calendarEventUpdate]
				await entityEventsListener!(updates, eventOwnerGroupId)

				// Assert
				const eventStartOfDay = getStartOfDay(eventStartDate).getTime()
				const daysToEvents = calendarEventsRepositoryMock.getEventsForMonths()()
				// We expect only the initial dateFarFromEvent to be loaded
				o.check(daysToEvents.size).equals(1)
				// Calling entityEventsListener should not add the event since the previously loaded day is in another month
				o.check(daysToEvents.get(eventStartOfDay)).equals(undefined)
			})

			o.test("new event happens on a loaded month", async function () {
				// Arrange
				o.check(entityEventsListener != null).equals(true)

				const eventStartDate = new Date(2025, 7, 26, 10, 0, 0)
				const event = createTestEntity(CalendarEventTypeRef, {
					_ownerGroup: eventOwnerGroupId,
					_id: [shotEventsListId, "event"],
					startTime: eventStartDate,
					endTime: new Date(2025, 7, 26, 23, 0, 0),
				})
				when(entityClientMock.load(CalendarEventTypeRef, matchers.anything())).thenResolve(event)

				const startOfDay = getStartOfDay(eventStartDate).getTime()
				const daysToEventsMock: DaysToEvents = new Map([[startOfDay, []]])
				when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
					daysToEventsMock,
				)
				// Making sure EventRepository.daysToEvents and EventRepository.loadedMonths is initialized
				await calendarEventsRepositoryMock.loadMonthsIfNeeded([eventStartDate], stream(false), null)

				// Act
				const calendarEventUpdate: EntityUpdateData = object()
				calendarEventUpdate.typeRef = CalendarEventTypeRef
				calendarEventUpdate.operation = OperationType.CREATE
				const updates: ReadonlyArray<EntityUpdateData> = [calendarEventUpdate]
				await entityEventsListener!(updates, eventOwnerGroupId)

				// Assert
				const daysToEvents = calendarEventsRepositoryMock.getEventsForMonths()()
				o(daysToEvents.size).equals(1)
				o.check(daysToEvents.get(startOfDay)?.length).equals(1)
				o.check(daysToEvents.get(startOfDay)?.[0]).equals(event)
			})
		})
	})
})
