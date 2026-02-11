import o from "@tutao/otest"
import { CalendarEventsRepository, DaysToEvents } from "../../../src/common/calendar/date/CalendarEventsRepository"
import { matchers, object, when } from "testdouble"
import { getTimeZone } from "../../../src/common/calendar/date/CalendarUtils"
import { EventController } from "../../../src/common/api/main/EventController"
import { UserController } from "../../../src/common/api/main/UserController"
import { LoginController } from "../../../src/common/api/main/LoginController"
import { CalendarInfo, CalendarInfoBase, CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { EntityEventsListener, EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils"
import { DEFAULT_BIRTHDAY_CALENDAR_COLOR, DEFAULT_CALENDAR_COLOR, OperationType } from "../../../src/common/api/common/TutanotaConstants"
import {
	CalendarEventTypeRef,
	CalendarGroupRootTypeRef,
	GroupSettings,
	UserSettingsGroupRoot,
	UserSettingsGroupRootTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { createTestEntity } from "../TestUtils"
import { CalendarFacade } from "../../../src/common/api/worker/facades/lazy/CalendarFacade"
import { getFirstOrThrow, getStartOfDay } from "@tutao/tutanota-utils"
import { GroupMembership, UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs"
import { EventWrapper } from "../../../src/calendar-app/calendar/view/CalendarViewModel"

o.spec("CalendarEventRepositoryTest", function () {
	o.spec("entityEventsReceived", function () {
		const initialCalendarGroupId = "initialCalendarGroupId"
		const userGroupId = "userGroupId"
		const shotEventsListId = "shotEventsListId"
		const timezone = getTimeZone()

		const eventControllerMock: EventController = object()
		/**
		 * Holds the captured callback for handling entityUpdates
		 */
		let entityEventsListener: EntityEventsListener | null = null

		let userControllerMock: UserController
		let calendarFacade: CalendarFacade
		let loginControllerMock: LoginController
		let calendarModelMock: CalendarModel
		let entityClientMock: EntityClient
		let calendarInfosStreamMock: Stream<ReadonlyMap<Id, CalendarInfo>>
		let calendarEventsRepository: CalendarEventsRepository
		let initialCalendarInfos: Map<string, CalendarInfo>
		let initialCalendarMembership: GroupMembership

		o.beforeEach(function () {
			userControllerMock = object<UserController>()
			calendarFacade = object<CalendarFacade>()
			loginControllerMock = object()
			calendarModelMock = object()
			entityClientMock = object<EntityClient>()

			calendarInfosStreamMock = object()

			// Capturing the callback function passed as argument to addEntityListener at CalendarEventsRepository constructor
			when(eventControllerMock.addEntityListener(matchers.anything())).thenDo((listener) => {
				entityEventsListener = listener
			})

			initialCalendarMembership = object()
			initialCalendarMembership.group = initialCalendarGroupId
			when(userControllerMock.getCalendarMemberships()).thenReturn([initialCalendarMembership])
			when(loginControllerMock.getUserController()).thenReturn(userControllerMock)

			when(calendarModelMock.getCalendarInfosStream()).thenReturn(calendarInfosStreamMock)
			when(calendarInfosStreamMock.map(matchers.anything())).thenDo(() => {})

			const calendarInfo: CalendarInfo = object()
			calendarInfo.groupRoot = createTestEntity(CalendarGroupRootTypeRef, { shortEvents: shotEventsListId })
			initialCalendarInfos = new Map([[initialCalendarGroupId, calendarInfo]])
			when(calendarModelMock.getCalendarInfos()).thenResolve(initialCalendarInfos)

			calendarEventsRepository = new CalendarEventsRepository(
				calendarModelMock,
				calendarFacade,
				timezone,
				entityClientMock,
				eventControllerMock,
				object(),
				loginControllerMock,
			)
		})

		o.spec("createOrUpdateCalendarEvent", function () {
			o.test("new event happens on a not loaded month", async function () {
				// Arrange
				o.check(entityEventsListener != null).equals(true)

				const eventStartDate = new Date(2025, 7, 26)
				const event = createTestEntity(CalendarEventTypeRef, {
					_ownerGroup: initialCalendarGroupId,
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
				await calendarEventsRepository.loadMonthsIfNeeded([dateFarFromEvent], stream(false), null)

				// Act
				const calendarEventUpdate: EntityUpdateData = object()
				calendarEventUpdate.typeRef = CalendarEventTypeRef
				calendarEventUpdate.operation = OperationType.CREATE
				const updates: ReadonlyArray<EntityUpdateData> = [calendarEventUpdate]
				await entityEventsListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, null)

				// Assert
				const eventStartOfDay = getStartOfDay(eventStartDate).getTime()
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
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
					_ownerGroup: initialCalendarGroupId,
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
				await calendarEventsRepository.loadMonthsIfNeeded([eventStartDate], stream(false), null)

				// Act
				const calendarEventUpdate: EntityUpdateData = object()
				calendarEventUpdate.typeRef = CalendarEventTypeRef
				calendarEventUpdate.operation = OperationType.CREATE
				const updates: ReadonlyArray<EntityUpdateData> = [calendarEventUpdate]
				await entityEventsListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, null)

				// Assert
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				o(daysToEvents.size).equals(1)
				o.check(daysToEvents.get(startOfDay)?.length).equals(1)
				o.check(daysToEvents.get(startOfDay)?.[0].event).equals(event)
			})

			o.test("new event of a new calendar happens on a loaded month", async function () {
				// Arrange
				o.check(entityEventsListener != null).equals(true)

				const eventStartDate = new Date(2025, 7, 26, 10, 0, 0)
				const startOfDay = getStartOfDay(eventStartDate).getTime()
				const daysToEventsMock: DaysToEvents = new Map([[startOfDay, []]])
				when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
					daysToEventsMock, // Provide a initialized Map with an empty day
				)
				// Making sure EventRepository.daysToEvents and EventRepository.loadedMonths is initialized
				await calendarEventsRepository.loadMonthsIfNeeded([eventStartDate], stream(false), null)

				const newCalendarGroupId = "newCalendarGroupId"
				const newCalendarInfo: CalendarInfo = object()
				newCalendarInfo.groupRoot = createTestEntity(CalendarGroupRootTypeRef, { shortEvents: shotEventsListId })
				const calendarInfos = new Map(initialCalendarInfos).set(newCalendarGroupId, newCalendarInfo)
				when(calendarModelMock.getCalendarInfos()).thenResolve(calendarInfos)

				const event = createTestEntity(CalendarEventTypeRef, {
					_ownerGroup: newCalendarGroupId,
					_id: [shotEventsListId, "event"],
					startTime: eventStartDate,
					endTime: new Date(2025, 7, 26, 23, 0, 0),
				})
				when(entityClientMock.load(CalendarEventTypeRef, matchers.anything())).thenResolve(event)

				const userUpdateEventUpdate: EntityUpdateData = object()
				userUpdateEventUpdate.typeRef = UserTypeRef
				userUpdateEventUpdate.operation = OperationType.UPDATE
				when(userControllerMock.isUpdateForLoggedInUserInstance(userUpdateEventUpdate, userGroupId)).thenReturn(true)

				const newCalendarMembership: GroupMembership = object()
				newCalendarMembership.group = newCalendarGroupId
				when(userControllerMock.getCalendarMemberships()).thenReturn([initialCalendarMembership, newCalendarMembership])

				await entityEventsListener!.onEntityUpdatesReceived([userUpdateEventUpdate], userGroupId, null)

				// Act
				const calendarEventUpdate: EntityUpdateData = object()
				calendarEventUpdate.typeRef = CalendarEventTypeRef
				calendarEventUpdate.operation = OperationType.CREATE
				await entityEventsListener!.onEntityUpdatesReceived([calendarEventUpdate], newCalendarGroupId, null)

				// Assert
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				o(daysToEvents.size).equals(1)
				o.check(daysToEvents.get(startOfDay)?.length).equals(1)
				o.check(daysToEvents.get(startOfDay)?.[0].event).equals(event)
			})
		})
		o.spec("updateUserSettingsGroupRoot", function () {
			// Test Case for completely empty calendar
			let mockGroupSettings: GroupSettings
			let mockUserSettingsGroupRoot: UserSettingsGroupRoot = object()
			let wrappedEvent: EventWrapper

			o.beforeEach(function () {
				mockGroupSettings = object()
				mockGroupSettings._id = "groupSettingsId"
				mockGroupSettings.group = initialCalendarGroupId

				mockUserSettingsGroupRoot.groupSettings = [mockGroupSettings]
				when(entityClientMock.load(UserSettingsGroupRootTypeRef, matchers.anything())).thenResolve(mockUserSettingsGroupRoot)

				wrappedEvent = object<EventWrapper>()
				wrappedEvent.event = object()
				wrappedEvent.color = "some random color definition"
				wrappedEvent.flags = object()
				wrappedEvent.flags.isBirthdayEvent = false
				wrappedEvent.event._ownerGroup = initialCalendarGroupId
			})

			o.test("update on empty calendar", async function () {
				// arrange
				mockGroupSettings.color = "003CFF"

				// act
				const userSettingsGroupRootUpdate: EntityUpdateData = object()
				userSettingsGroupRootUpdate.typeRef = UserSettingsGroupRootTypeRef
				userSettingsGroupRootUpdate.operation = OperationType.UPDATE
				const updates: ReadonlyArray<EntityUpdateData> = [userSettingsGroupRootUpdate]
				await entityEventsListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, null)

				// assert

				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				o.check(daysToEvents.size).equals(0)
			})

			o.test("update event - default calendar color", async function () {
				mockGroupSettings.color = ""
				// test case for calendar with one simple event
				const eventWrapperArray: ReadonlyArray<EventWrapper> = [wrappedEvent]
				const daysToEventsMap: ReadonlyMap<number, ReadonlyArray<EventWrapper>> = new Map([[1, eventWrapperArray]])
				calendarEventsRepository.getDaysToEvents()(daysToEventsMap)

				// act
				const userSettingsGroupRootUpdate: EntityUpdateData = object()
				userSettingsGroupRootUpdate.typeRef = UserSettingsGroupRootTypeRef
				userSettingsGroupRootUpdate.operation = OperationType.UPDATE
				const updates: ReadonlyArray<EntityUpdateData> = [userSettingsGroupRootUpdate]
				await entityEventsListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, null)

				// assert
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				const [day, events] = getFirstOrThrow(Array.from(daysToEvents.entries()))
				o.check(getFirstOrThrow(events).color).equals(DEFAULT_CALENDAR_COLOR)
			})

			o.test("update event - apply color from settings", async function () {
				// test case for calendar with one simple event
				const eventWrapperArray: ReadonlyArray<EventWrapper> = [wrappedEvent]
				const daysToEventsMap: ReadonlyMap<number, ReadonlyArray<EventWrapper>> = new Map([[1, eventWrapperArray]])
				calendarEventsRepository.getDaysToEvents()(daysToEventsMap)

				const SETTINGS_COLOR = "FFFFFF"

				mockGroupSettings.color = SETTINGS_COLOR

				// act
				const userSettingsGroupRootUpdate: EntityUpdateData = object()
				userSettingsGroupRootUpdate.typeRef = UserSettingsGroupRootTypeRef
				userSettingsGroupRootUpdate.operation = OperationType.UPDATE
				const updates: ReadonlyArray<EntityUpdateData> = [userSettingsGroupRootUpdate]
				await entityEventsListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, null)

				// assert
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				const [day, events] = getFirstOrThrow(Array.from(daysToEvents.entries()))
				o.check(getFirstOrThrow(events).color).equals(SETTINGS_COLOR)
			})

			o.test("birthday calendar color is applied for birthday events", async function () {
				// test case for calendar with one simple event

				const birthdayCalendarInfoMock: CalendarInfoBase = object()
				birthdayCalendarInfoMock.color = DEFAULT_BIRTHDAY_CALENDAR_COLOR

				when(calendarModelMock.getBirthdayCalendarInfo()).thenReturn(birthdayCalendarInfoMock)

				wrappedEvent.flags.isBirthdayEvent = true
				const eventWrapperArray: ReadonlyArray<EventWrapper> = [wrappedEvent]
				const daysToEventsMap: ReadonlyMap<number, ReadonlyArray<EventWrapper>> = new Map([[1, eventWrapperArray]])
				calendarEventsRepository.getDaysToEvents()(daysToEventsMap)

				// act
				const userSettingsGroupRootUpdate: EntityUpdateData = object()
				userSettingsGroupRootUpdate.typeRef = UserSettingsGroupRootTypeRef
				userSettingsGroupRootUpdate.operation = OperationType.UPDATE
				const updates: ReadonlyArray<EntityUpdateData> = [userSettingsGroupRootUpdate]
				await entityEventsListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, null)

				// assert
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				const [day, events] = getFirstOrThrow(Array.from(daysToEvents.entries()))
				o.check(getFirstOrThrow(events).color).equals(DEFAULT_BIRTHDAY_CALENDAR_COLOR)
			})

			// test case for calendar with multiple events
			// test case for calendar with all day event
			// test case for calendar open in multiday
		})
	})
})
