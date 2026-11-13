import o from "@tutao/otest"
import { CalendarEventsRepository, DaysToEvents } from "../../../src/applications/common/calendar/date/CalendarEventsRepository"
import { explain, matchers, object, when } from "testdouble"
import { getTimeZone } from "../../../src/applications/common/calendar/date/CalendarUtils"
import { EventController } from "../../../src/applications/common/api/main/EventController"
import { UserController } from "../../../src/applications/common/api/main/UserController"
import { LoginController } from "../../../src/applications/common/api/main/LoginController"
import { CalendarInfo, CalendarInfoBase, CalendarModel } from "../../../src/applications/calendar-app/calendar/model/CalendarModel"
import Stream from "mithril/stream"
import { DEFAULT_BIRTHDAY_CALENDAR_COLOR, DEFAULT_CALENDAR_COLOR } from "../../../src/platform-kit/app-env"
import { EntityClient } from "../../../src/platform-kit/network/EntityClient"
import { createTestEntity } from "../TestUtils"
import { CalendarFacade } from "../../../src/applications/common/api/worker/facades/lazy/CalendarFacade"
import { getFirstOrThrow, getStartOfDay } from "../../../src/platform-kit/utils"
import { EventWrapper } from "../../../src/applications/calendar-app/calendar/view/CalendarViewModel"

import {
	CalendarEventTypeRef,
	CalendarGroupRootTypeRef,
	Contact,
	GroupSettings,
	UserSettingsGroupRoot,
	UserSettingsGroupRootTypeRef,
} from "@tutao/entities/tutanota"
import { OperationType } from "../../../src/platform-kit/meta"

import { GroupMembership, UserTypeRef } from "@tutao/entities/sys"
import { EntityUpdateData, EntityUpdatesListener } from "../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ContactModel } from "../../../src/applications/common/contactsFunctionality/ContactModel"
import { load } from "@fingerprintjs/botd"

o.spec("CalendarEventRepositoryTest", function () {
	const initialCalendarGroupId = "initialCalendarGroupId"
	const userGroupId = "userGroupId"
	const shotEventsListId = "shotEventsListId"
	const timezone = getTimeZone()

	const eventControllerMock: EventController = object()
	/**
	 * Holds the captured callback for handling entityUpdates
	 */
	let entityUpdatesListener: EntityUpdatesListener | null = null

	let userControllerMock: UserController
	let calendarFacade: CalendarFacade
	let loginControllerMock: LoginController
	let calendarModelMock: CalendarModel
	let contactModelMock: ContactModel
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
		contactModelMock = object<ContactModel>()
		entityClientMock = object<EntityClient>()

		calendarInfosStreamMock = object()

		// Capturing the callback function passed as argument to addEntityListener at CalendarEventsRepository constructor
		when(eventControllerMock.addEntityUpdatesListener(matchers.anything())).thenDo((listener) => {
			entityUpdatesListener = listener
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
			contactModelMock,
			loginControllerMock,
		)
	})

	o.spec("loadMonth", function () {
		o.test("calls CalendarFacade.updateEventMap with correct arguments", async function () {
			const calendarInfos = new Map()
			when(calendarModelMock.getCalendarInfos()).thenResolve(calendarInfos)

			const eventMap: DaysToEvents = new Map()
			const monthRangeCaptor = matchers.captor()
			const calendarInfosCaptor = matchers.captor()
			const timeZoneCaptor = matchers.captor()
			when(
				calendarFacade.updateEventMap(monthRangeCaptor.capture(), calendarInfosCaptor.capture(), matchers.anything(), timeZoneCaptor.capture()),
			).thenResolve(eventMap)

			const monthsToLoad: [number, number][] = [
				[2026, 1], // Month with 31 days
				[2026, 4], // Month with 30 days

				[2026, 2], // February on a non leap-year
				[2024, 2], // February on a leap-year

				[2026, 12], // Last month of year on a non leap-year
				[2024, 12], // Last month of year on a leap-year
			]
			await calendarEventsRepository.loadMonthsIfNeeded(monthsToLoad, null, null)

			o.check(explain(calendarFacade.updateEventMap).callCount).equals(monthsToLoad.length)

			o.check(monthRangeCaptor.values?.[0]).deepEquals({ start: new Date(2026, 1 - 1, 1).getTime(), end: new Date(2026, 2 - 1, 1).getTime() })
			o.check(monthRangeCaptor.values?.[1]).deepEquals({ start: new Date(2026, 4 - 1, 1).getTime(), end: new Date(2026, 5 - 1, 1).getTime() })
			o.check(monthRangeCaptor.values?.[2]).deepEquals({ start: new Date(2026, 2 - 1, 1).getTime(), end: new Date(2026, 3 - 1, 1).getTime() })
			o.check(monthRangeCaptor.values?.[3]).deepEquals({ start: new Date(2024, 2 - 1, 1).getTime(), end: new Date(2024, 3 - 1, 1).getTime() })
			o.check(monthRangeCaptor.values?.[4]).deepEquals({ start: new Date(2026, 12 - 1, 1).getTime(), end: new Date(2027, 1 - 1, 1).getTime() })
			o.check(monthRangeCaptor.values?.[5]).deepEquals({ start: new Date(2024, 12 - 1, 1).getTime(), end: new Date(2025, 1 - 1, 1).getTime() })

			for (let i = 0; i < monthsToLoad.length; ++i) {
				o.check(calendarInfosCaptor.values?.[i]).equals(calendarInfos)
				o.check(timeZoneCaptor.values?.[i]).equals(timezone)
			}
		})
	})
	o.spec("onEntityUpdatesReceived", function () {
		o.spec("createOrUpdateCalendarEvent", function () {
			o.test("new event happens on a not loaded month", async function () {
				// Arrange
				o.check(entityUpdatesListener != null).equals(true)

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
				await calendarEventsRepository.loadMonthsIfNeeded([[dateFarFromEvent.getFullYear(), dateFarFromEvent.getMonth() + 1]], null, null)

				// Act
				const calendarEventUpdate: EntityUpdateData = object()
				calendarEventUpdate.typeRef = CalendarEventTypeRef
				calendarEventUpdate.operation = OperationType.CREATE
				const updates: ReadonlyArray<EntityUpdateData> = [calendarEventUpdate]
				await entityUpdatesListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, true)

				// Assert
				const eventStartOfDay = getStartOfDay(eventStartDate).getTime()
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				// We expect only the initial dateFarFromEvent to be loaded
				o.check(daysToEvents.size).equals(1)
				// Calling entityUpdatesListener should not add the event since the previously loaded day is in another month
				o.check(daysToEvents.get(eventStartOfDay)).equals(undefined)
			})

			o.test("new event happens on a loaded month", async function () {
				// Arrange
				o.check(entityUpdatesListener != null).equals(true)

				const eventStartYear = 2025
				const eventStartMonth = 8
				const eventStartDate = new Date(eventStartYear, eventStartMonth - 1, 26, 10, 0, 0)
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
				await calendarEventsRepository.loadMonthsIfNeeded([[eventStartYear, eventStartMonth]], null, null)

				// Act
				const calendarEventUpdate: EntityUpdateData = object()
				calendarEventUpdate.typeRef = CalendarEventTypeRef
				calendarEventUpdate.operation = OperationType.CREATE
				const updates: ReadonlyArray<EntityUpdateData> = [calendarEventUpdate]
				await entityUpdatesListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, true)

				// Assert
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				o(daysToEvents.size).equals(1)
				o.check(daysToEvents.get(startOfDay)?.length).equals(1)
				o.check(daysToEvents.get(startOfDay)?.[0].event).equals(event)
			})

			o.test("new event of a new calendar happens on a loaded month", async function () {
				// Arrange
				o.check(entityUpdatesListener != null).equals(true)

				const eventStartDate = new Date(2025, 7, 26, 10, 0, 0)
				const startOfDay = getStartOfDay(eventStartDate).getTime()
				const daysToEventsMock: DaysToEvents = new Map([[startOfDay, []]])
				when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
					daysToEventsMock, // Provide a initialized Map with an empty day
				)
				// Making sure EventRepository.daysToEvents and EventRepository.loadedMonths is initialized
				await calendarEventsRepository.loadMonthsIfNeeded([[eventStartDate.getFullYear(), eventStartDate.getMonth() + 1]], null, null)

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

				await entityUpdatesListener!.onEntityUpdatesReceived([userUpdateEventUpdate], userGroupId, true)

				// Act
				const calendarEventUpdate: EntityUpdateData = object()
				calendarEventUpdate.typeRef = CalendarEventTypeRef
				calendarEventUpdate.operation = OperationType.CREATE
				await entityUpdatesListener!.onEntityUpdatesReceived([calendarEventUpdate], newCalendarGroupId, true)

				// Assert
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				o(daysToEvents.size).equals(1)
				o.check(daysToEvents.get(startOfDay)?.length).equals(1)
				o.check(daysToEvents.get(startOfDay)?.[0].event).equals(event)
			})
		})
		o.spec("handleMembershipChanges", function () {
			o.test("when receiving a new calendar membership, the event map is updated with events from the new calendar", async function () {
				const oldCalendarMembership: GroupMembership = object()
				oldCalendarMembership.group = "old"
				const newCalendarMembership: GroupMembership = object()
				newCalendarMembership.group = "new"

				when(userControllerMock.getCalendarMemberships()).thenReturn([oldCalendarMembership])

				when(calendarModelMock.getCalendarInfos()).thenResolve(new Map([[oldCalendarMembership.group, object()]]))

				calendarEventsRepository = new CalendarEventsRepository(
					calendarModelMock,
					calendarFacade,
					timezone,
					entityClientMock,
					eventControllerMock,
					contactModelMock,
					loginControllerMock,
				)

				await calendarEventsRepository.loadMonthsIfNeeded(
					[
						[2026, 1],
						[2026, 2],
					],
					null,
					null,
				)

				o.check(explain(calendarFacade.updateEventMap).callCount).equals(2)

				when(userControllerMock.isUpdateForLoggedInUserInstance(matchers.anything(), matchers.anything())).thenReturn(true)
				when(userControllerMock.getCalendarMemberships()).thenReturn([oldCalendarMembership, newCalendarMembership])

				const newCalendarInfo = object()
				when(calendarModelMock.getCalendarInfos()).thenResolve(
					new Map([
						[oldCalendarMembership.group, object()],
						[newCalendarMembership.group, newCalendarInfo],
					]) as ReadonlyMap<string, CalendarInfo>,
				)

				const eventMap: DaysToEvents = new Map()
				const monthRangeCaptor = matchers.captor()
				const calendarInfosCaptor = matchers.captor()
				const timeZoneCaptor = matchers.captor()
				when(
					calendarFacade.updateEventMap(monthRangeCaptor.capture(), calendarInfosCaptor.capture(), matchers.anything(), timeZoneCaptor.capture()),
				).thenResolve(eventMap)

				const entityUpdate: EntityUpdateData = object()
				if (!entityUpdatesListener) {
					throw new Error("entityUpdatesListener must be initialized for test")
				}
				await entityUpdatesListener.onEntityUpdatesReceived([entityUpdate], "foo", true)

				o.check(explain(calendarFacade.updateEventMap).callCount).equals(4)

				o.check(monthRangeCaptor.values?.[0]).deepEquals({ start: new Date(2026, 1 - 1, 1).getTime(), end: new Date(2026, 2 - 1, 1).getTime() })
				o.check(calendarInfosCaptor.values?.[0]).deepEquals(new Map([[newCalendarMembership.group, newCalendarInfo]]))
				o.check(timeZoneCaptor.values?.[0]).equals(timezone)

				o.check(monthRangeCaptor.values?.[1]).deepEquals({ start: new Date(2026, 2 - 1, 1).getTime(), end: new Date(2026, 3 - 1, 1).getTime() })
				o.check(calendarInfosCaptor.values?.[1]).deepEquals(new Map([[newCalendarMembership.group, newCalendarInfo]]))
				o.check(timeZoneCaptor.values?.[1]).equals(timezone)
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
				await entityUpdatesListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, true)

				// assert

				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				o.check(daysToEvents.size).equals(0)
			})

			o.test("update event - default calendar color", async function () {
				mockGroupSettings.color = ""
				// test case for calendar with one simple event
				const daysToEventsMap = new Map([[1, [wrappedEvent]]])
				calendarEventsRepository.getDaysToEvents()(daysToEventsMap)

				// act
				const userSettingsGroupRootUpdate: EntityUpdateData = object()
				userSettingsGroupRootUpdate.typeRef = UserSettingsGroupRootTypeRef
				userSettingsGroupRootUpdate.operation = OperationType.UPDATE
				const updates: ReadonlyArray<EntityUpdateData> = [userSettingsGroupRootUpdate]
				await entityUpdatesListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, true)

				// assert
				const daysToEvents = calendarEventsRepository.getDaysToEvents()()
				const [day, events] = getFirstOrThrow(Array.from(daysToEvents.entries()))
				o.check(getFirstOrThrow(events).color).equals(DEFAULT_CALENDAR_COLOR)
			})

			o.test("update event - apply color from settings", async function () {
				// test case for calendar with one simple event
				const daysToEventsMap = new Map([[1, [wrappedEvent]]])
				calendarEventsRepository.getDaysToEvents()(daysToEventsMap)

				const SETTINGS_COLOR = "FFFFFF"

				mockGroupSettings.color = SETTINGS_COLOR

				// act
				const userSettingsGroupRootUpdate: EntityUpdateData = object()
				userSettingsGroupRootUpdate.typeRef = UserSettingsGroupRootTypeRef
				userSettingsGroupRootUpdate.operation = OperationType.UPDATE
				const updates: ReadonlyArray<EntityUpdateData> = [userSettingsGroupRootUpdate]
				await entityUpdatesListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, true)

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
				const daysToEventsMap = new Map([[1, [wrappedEvent]]])
				calendarEventsRepository.getDaysToEvents()(daysToEventsMap)

				// act
				const userSettingsGroupRootUpdate: EntityUpdateData = object()
				userSettingsGroupRootUpdate.typeRef = UserSettingsGroupRootTypeRef
				userSettingsGroupRootUpdate.operation = OperationType.UPDATE
				const updates: ReadonlyArray<EntityUpdateData> = [userSettingsGroupRootUpdate]
				await entityUpdatesListener!.onEntityUpdatesReceived(updates, initialCalendarGroupId, true)

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
	o.spec("Birthdays", function () {
		o.test("A birthday event will be created if the contact's birth year and month are loaded", async function () {
			const birthdayYear = 2000
			const birthdayMonth = 11
			const birthdayDay = 22

			const newContact = {
				firstName: "Alice",
				birthdayIso: `${birthdayYear}-${birthdayMonth}-${birthdayDay}`,
				_id: ["something", "something"],
			} as unknown as Contact

			when(contactModelMock.loadContactFromId(matchers.anything())).thenResolve(newContact)

			const eventMap: DaysToEvents = new Map()
			when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)

			await calendarEventsRepository.loadMonthsIfNeeded([[birthdayYear, birthdayMonth]], null, null)

			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

			const eventMapKey = new Date(birthdayYear, birthdayMonth - 1, birthdayDay).getTime()
			const eventsOnDay = eventMap.get(eventMapKey)
			o.check(eventsOnDay?.length).equals(1)
			o.check(eventsOnDay?.[0].event.summary).equals("Alice's birthday")
		})
		o.test("A birthday event will be created when loading a new year+month where the month matches a birthday's month", async function () {
			const birthdayYear = 2000
			const birthdayMonth = 11
			const birthdayDay = 22

			const newContact = {
				firstName: "Alice",
				birthdayIso: `${birthdayYear}-${birthdayMonth}-${birthdayDay}`,
				_id: ["something", "something"],
			} as unknown as Contact

			when(contactModelMock.loadContactFromId(matchers.anything())).thenResolve(newContact)

			const eventMap: DaysToEvents = new Map()
			when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)

			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

			const expectedAge = 30
			const loadedYear = birthdayYear + expectedAge
			await calendarEventsRepository.loadMonthsIfNeeded([[loadedYear, birthdayMonth]], null, null)

			const eventsOnDay = eventMap.get(new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime())
			o.check(eventsOnDay?.length).equals(1)
			o.check(eventsOnDay?.[0].event.summary).equals(`Alice's birthday (${expectedAge} years old)`)
		})
		o.test("A birthday event will NOT be created when loading a new year+month year is before the birth year", async function () {
			const birthdayYear = 2000
			const birthdayMonth = 11
			const birthdayDay = 22

			const newContact = {
				firstName: "Alice",
				birthdayIso: `${birthdayYear}-${birthdayMonth}-${birthdayDay}`,
				_id: ["something", "something"],
			} as unknown as Contact

			when(contactModelMock.loadContactFromId(matchers.anything())).thenResolve(newContact)

			const eventMap: DaysToEvents = new Map()
			when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)

			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

			const loadedYear = birthdayYear - 1
			await calendarEventsRepository.loadMonthsIfNeeded([[loadedYear, birthdayMonth]], null, null)

			o.check(eventMap.get(new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime())).equals(undefined)
		})
		o.spec("Birthday events will be created on loaded year+months where the month matches the birthday month", function () {
			const birthdayYear = 2000
			const birthdayMonth = 11
			const birthdayDay = 22

			const newContact = {
				firstName: "Alice",
				birthdayIso: `${birthdayYear}-${birthdayMonth}-${birthdayDay}`,
				_id: ["something", "something"],
			} as unknown as Contact

			const maxLoadedYear = 2100

			const eventMap: DaysToEvents = new Map()

			o.beforeEach(function () {
				when(contactModelMock.loadContactFromId(matchers.anything())).thenResolve(newContact)

				eventMap.clear()
				when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)
			})

			o.test("Test with months loaded before the contact creation", async function () {
				for (let yearToLoad = birthdayYear + 1; yearToLoad <= maxLoadedYear; ++yearToLoad) {
					await calendarEventsRepository.loadMonthsIfNeeded([[yearToLoad, birthdayMonth]], null, null)
				}

				await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

				for (let loadedYear = birthdayYear + 1; loadedYear <= maxLoadedYear; ++loadedYear) {
					const eventsOnDay = eventMap.get(new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime())
					o.check(eventsOnDay?.length).equals(1)
					o.check(eventsOnDay?.[0].event.summary).equals(`Alice's birthday (${loadedYear - birthdayYear} years old)`)
				}
			})
			o.test("Test with contact creation before loading months", async function () {
				const eventMap: DaysToEvents = new Map()
				when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)

				await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

				for (let year = birthdayYear + 1; year <= maxLoadedYear; ++year) {
					await calendarEventsRepository.loadMonthsIfNeeded([[year, birthdayMonth]], null, null)

					const eventsOnDay = eventMap.get(new Date(year, birthdayMonth - 1, birthdayDay).getTime())
					o.check(eventsOnDay?.length).equals(1)
					o.check(eventsOnDay?.[0].event.summary).equals(`Alice's birthday (${year - birthdayYear} years old)`)
				}
			})
		})
		o.spec(
			"Birthday events, for birthdays where no year is specified, will be created for all loaded year+months where the month matches the birthday month",
			function () {
				const birthdayMonth = 11
				const birthdayDay = 22

				const newContact = {
					firstName: "Alice",
					// --MM-DD specifies a birthday without a provided year
					birthdayIso: `--${birthdayMonth}-${birthdayDay}`,
					_id: ["something", "something"],
				} as unknown as Contact

				const minLoadedYear = 1900
				const maxLoadedYear = 2100

				const eventMap: DaysToEvents = new Map()

				o.beforeEach(function () {
					when(contactModelMock.loadContactFromId(matchers.anything())).thenResolve(newContact)

					eventMap.clear()
					when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
						eventMap,
					)
				})

				o.test("Test with months loaded before the contact creation", async function () {
					for (let yearToLoad = minLoadedYear; yearToLoad <= maxLoadedYear; ++yearToLoad) {
						await calendarEventsRepository.loadMonthsIfNeeded([[yearToLoad, birthdayMonth]], null, null)
					}

					await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

					for (let loadedYear = minLoadedYear; loadedYear <= maxLoadedYear; ++loadedYear) {
						const eventsOnDay = eventMap.get(new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime())
						o.check(eventsOnDay?.length).equals(1)
						o.check(eventsOnDay?.[0].event.summary).equals(`Alice's birthday`)
					}
				})
				o.test("Test with contact creation before loading months", async function () {
					await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

					for (let year = minLoadedYear; year <= maxLoadedYear; ++year) {
						await calendarEventsRepository.loadMonthsIfNeeded([[year, birthdayMonth]], null, null)

						const eventsOnDay = eventMap.get(new Date(year, birthdayMonth - 1, birthdayDay).getTime())
						o.check(eventsOnDay?.length).equals(1)
						o.check(eventsOnDay?.[0].event.summary).equals(`Alice's birthday`)
					}
				})
			},
		)
		o.test("Deleting a contact removes the birthday event on the day of birth", async function () {
			const birthdayYear = 2000
			const birthdayMonth = 11
			const birthdayDay = 22

			const newContact = {
				firstName: "Alice",
				birthdayIso: `${birthdayYear}-${birthdayMonth}-${birthdayDay}`,
				_id: ["something", "something"],
			} as unknown as Contact

			when(contactModelMock.loadContactFromId(matchers.anything())).thenResolve(newContact)

			const eventMap: DaysToEvents = new Map()
			when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)

			await calendarEventsRepository.loadMonthsIfNeeded([[birthdayYear, birthdayMonth]], null, null)

			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

			// Sanity check that the event was actually added
			const eventsOnDay = eventMap.get(new Date(birthdayYear, birthdayMonth - 1, birthdayDay).getTime())
			o.check(eventsOnDay?.[0].event.summary).equals("Alice's birthday")

			await calendarEventsRepository.handleContactEvent(OperationType.DELETE, newContact._id)

			o.check(eventMap.get(new Date(birthdayYear, birthdayMonth - 1, birthdayDay).getTime())).equals(undefined)
		})
		o.spec("Deleting a contact removes the birthday events in loaded years after the event", function () {
			const birthdayYear = 2000
			const birthdayMonth = 11
			const birthdayDay = 22

			const newContact = {
				firstName: "Alice",
				birthdayIso: `${birthdayYear}-${birthdayMonth}-${birthdayDay}`,
				_id: ["something", "something"],
			} as unknown as Contact

			const minLoadedYear = 1900
			const maxLoadedYear = 2100

			const eventMap: DaysToEvents = new Map()

			o.beforeEach(function () {
				when(contactModelMock.loadContactFromId(matchers.anything())).thenResolve(newContact)

				eventMap.clear()
				when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)
			})
			o.test("for a birthday with a specified year", async function () {
				for (let yearToLoad = birthdayYear; yearToLoad <= maxLoadedYear; ++yearToLoad) {
					await calendarEventsRepository.loadMonthsIfNeeded([[yearToLoad, birthdayMonth]], null, null)
				}

				await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

				// Sanity check that the event was actually added
				o.check(eventMap.get(new Date(maxLoadedYear, birthdayMonth - 1, birthdayDay).getTime())?.length).equals(1)

				await calendarEventsRepository.handleContactEvent(OperationType.DELETE, newContact._id)

				for (let loadedYear = birthdayYear; loadedYear <= maxLoadedYear; ++loadedYear) {
					o.check(eventMap.get(new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime())).equals(undefined)
				}
			})
			o.test("for a birthday with an unspecified year", async function () {
				for (let yearToLoad = minLoadedYear; yearToLoad <= maxLoadedYear; ++yearToLoad) {
					await calendarEventsRepository.loadMonthsIfNeeded([[yearToLoad, birthdayMonth]], null, null)
				}

				await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

				// Sanity check that the event was actually added
				o.check(eventMap.get(new Date(maxLoadedYear, birthdayMonth - 1, birthdayDay).getTime())?.length).equals(1)

				await calendarEventsRepository.handleContactEvent(OperationType.DELETE, newContact._id)

				for (let loadedYear = minLoadedYear; loadedYear <= maxLoadedYear; ++loadedYear) {
					o.check(eventMap.get(new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime())).equals(undefined)
				}
			})
		})
		o.test("Deleting multiple birthdays in the same month works", async function () {
			const birthdayMonth = 11

			const aliceBirthdayYear = 2000
			const aliceBirthdayDay = 2

			const bobBirthdayYear = 2001
			const bobBirthdayDay = 3

			const aliceContact = {
				firstName: "Alice",
				birthdayIso: `${aliceBirthdayYear}-${birthdayMonth}-${aliceBirthdayDay}`,
				_id: ["contacts", "alice"],
			} as unknown as Contact
			const bobContact = {
				firstName: "Bob",
				birthdayIso: `${bobBirthdayYear}-${birthdayMonth}-${bobBirthdayDay}`,
				_id: ["contacts", "bob"],
			} as unknown as Contact

			when(contactModelMock.loadContactFromId(aliceContact._id)).thenResolve(aliceContact)
			when(contactModelMock.loadContactFromId(bobContact._id)).thenResolve(bobContact)

			const eventMap: DaysToEvents = new Map()
			when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)

			const loadedYear = 2026
			await calendarEventsRepository.loadMonthsIfNeeded([[loadedYear, birthdayMonth]], null, null)

			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, aliceContact._id)
			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, bobContact._id)

			// Sanity check that events were actually added
			let eventsOnDay = eventMap.get(new Date(loadedYear, birthdayMonth - 1, aliceBirthdayDay).getTime())
			o.check(eventsOnDay?.[0].event.summary).equals("Alice's birthday (26 years old)")
			eventsOnDay = eventMap.get(new Date(loadedYear, birthdayMonth - 1, bobBirthdayDay).getTime())
			o.check(eventsOnDay?.[0].event.summary).equals("Bob's birthday (25 years old)")

			await calendarEventsRepository.handleContactEvent(OperationType.DELETE, aliceContact._id)
			await calendarEventsRepository.handleContactEvent(OperationType.DELETE, bobContact._id)

			o.check(eventMap.get(new Date(loadedYear, birthdayMonth - 1, aliceBirthdayDay).getTime())).equals(undefined)
			o.check(eventMap.get(new Date(loadedYear, birthdayMonth - 1, bobBirthdayDay).getTime())).equals(undefined)
		})
		o.test("Deleting multiple birthdays on the same day works", async function () {
			const birthdayMonth = 11
			const birthdayDay = 22

			const aliceBirthdayYear = 2000
			const bobBirthdayYear = 2001

			const aliceContact = {
				firstName: "Alice",
				birthdayIso: `${aliceBirthdayYear}-${birthdayMonth}-${birthdayDay}`,
				_id: ["contacts", "alice"],
			} as unknown as Contact
			const bobContact = {
				firstName: "Bob",
				birthdayIso: `${bobBirthdayYear}-${birthdayMonth}-${birthdayDay}`,
				_id: ["contacts", "bob"],
			} as unknown as Contact

			when(contactModelMock.loadContactFromId(aliceContact._id)).thenResolve(aliceContact)
			when(contactModelMock.loadContactFromId(bobContact._id)).thenResolve(bobContact)

			const eventMap: DaysToEvents = new Map()
			when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)

			const loadedYear = 2026
			await calendarEventsRepository.loadMonthsIfNeeded([[loadedYear, birthdayMonth]], null, null)

			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, aliceContact._id)
			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, bobContact._id)

			// Sanity check that events were actually added
			const eventsOnDay = eventMap.get(new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime())
			o.check(eventsOnDay?.length).equals(2)
			o.check(eventsOnDay?.[0].event.summary).equals("Alice's birthday (26 years old)")
			o.check(eventsOnDay?.[1].event.summary).equals("Bob's birthday (25 years old)")

			await calendarEventsRepository.handleContactEvent(OperationType.DELETE, aliceContact._id)
			await calendarEventsRepository.handleContactEvent(OperationType.DELETE, bobContact._id)

			o.check(eventMap.get(new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime())).equals(undefined)
			o.check(eventMap.get(new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime())).equals(undefined)
		})
		o.test("Duplicate birthday events are NOT added after forcing a month to be loaded a second time", async function () {
			const birthdayYear = 2000
			const birthdayMonth = 11
			const birthdayDay = 22

			const newContact = {
				firstName: "Alice",
				birthdayIso: `${birthdayYear}-${birthdayMonth}-${birthdayDay}`,
				_id: ["something", "something"],
			} as unknown as Contact

			when(contactModelMock.loadContactFromId(matchers.anything())).thenResolve(newContact)

			const eventMap: DaysToEvents = new Map()
			when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(eventMap)

			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

			await calendarEventsRepository.loadMonthsIfNeeded([[birthdayYear, birthdayMonth]], null, null)
			await calendarEventsRepository.loadMonthsIfNeeded([[birthdayYear, birthdayMonth]], null, null, true)

			const eventMapKey = new Date(birthdayYear, birthdayMonth - 1, birthdayDay).getTime()
			const eventsOnDay = eventMap.get(eventMapKey)
			o.check(eventsOnDay?.length).equals(1)
			o.check(eventsOnDay?.[0].event.summary).equals("Alice's birthday")
		})
	})
})
