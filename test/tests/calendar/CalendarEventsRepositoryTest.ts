import o from "@tutao/otest"
import { CalendarEventsRepository, DaysToEvents } from "../../../src/applications/common/calendar/date/CalendarEventsRepository"
import { matchers, object, when } from "testdouble"
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
	ContactTypeRef,
	GroupSettings,
	UserSettingsGroupRoot,
	UserSettingsGroupRootTypeRef,
} from "@tutao/entities/tutanota"
import { OperationType } from "../../../src/platform-kit/meta"

import { GroupMembership, UserTypeRef } from "@tutao/entities/sys"
import { EntityUpdateData, EntityUpdatesListener } from "../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ContactModel } from "../../../src/applications/common/contactsFunctionality/ContactModel"

o.spec("CalendarEventsRepository", function () {
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
	let entityClientMock: EntityClient
	let calendarInfosStreamMock: Stream<ReadonlyMap<Id, CalendarInfo>>
	let calendarEventsRepository: CalendarEventsRepository
	let initialCalendarInfos: Map<string, CalendarInfo>
	let initialCalendarMembership: GroupMembership
	let abortController: AbortController
	let contactModelMock: ContactModel

	o.beforeEach(function () {
		userControllerMock = object<UserController>()
		calendarFacade = object<CalendarFacade>()
		loginControllerMock = object()
		calendarModelMock = object()
		entityClientMock = object<EntityClient>()
		contactModelMock = object<ContactModel>()

		abortController = new AbortController()

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
				await calendarEventsRepository.loadMonthsIfNeeded([dateFarFromEvent], abortController.signal, null)

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
				await calendarEventsRepository.loadMonthsIfNeeded([eventStartDate], abortController.signal, null)

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
				await calendarEventsRepository.loadMonthsIfNeeded([eventStartDate], abortController.signal, null)

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
	o.spec("contact birthday events", function () {
		//
		// Mocking
		//

		const MOCK_CONTACT_LIST_ID = "mock_contact_list_id"

		o.beforeEach(function () {
			when(contactModelMock.getContactListId()).thenResolve(MOCK_CONTACT_LIST_ID)
			when(calendarFacade.updateEventMap(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenDo(
				(_, __, daysToEvents, ___) => daysToEvents,
			)
		})

		//
		// Helpers
		//
		const testContact = (birthdayIso: string, firstName: string, lastName: string) =>
			createTestEntity(ContactTypeRef, {
				_id: [MOCK_CONTACT_LIST_ID, `${firstName}${lastName}ID`],
				firstName: firstName,
				lastName: lastName,
				birthdayIso: birthdayIso,
			})
		const birthdayMonth = (contact: Contact) => parseInt(contact.birthdayIso!.split("-")[1])
		const birthdayDay = (contact: Contact) => parseInt(contact.birthdayIso!.split("-")[2])
		const birthdayYear = (contact: Contact) => parseInt(contact.birthdayIso!.split("-")[0])
		const birthdayAllDayDateLocal = (contact: Contact) => new Date(contact.birthdayIso! + "T00:00:00.000")
		const birthdayAllDayDateUTC = (contact: Contact) => new Date(contact.birthdayIso! + "T00:00:00.000Z")

		o.test("loadContactsBirthdays creates birthday progenitor event and reoccurrence events", async function () {
			let minYear = 10000
			let maxYear = 0
			const contacts: Contact[] = []
			let i = 0
			for (const birthdayIso of [
				"2000-04-30",
				// Same year
				"2001-05-01",
				"2001-06-02",
				// Same month
				"2001-07-01",
				"2001-07-02",
				// Same month, different year
				"2002-08-01",
				"2003-08-02",
				// Same day
				"2004-09-01",
				"2004-09-01",
				// Same day, different year
				"2005-10-01",
				"2006-10-01",
				// First day of year
				"2007-01-01",
				// Last day of year
				"2008-12-31",
			]) {
				const year = parseInt(birthdayIso.split("-")[0])
				minYear = Math.min(minYear, year)
				maxYear = Math.max(maxYear, year)
				testContact(birthdayIso, `firstName${i}`, `lastName${i}`)
				++i
			}

			when(entityClientMock.loadAll(ContactTypeRef, matchers.anything())).thenResolve(contacts)

			await calendarEventsRepository.loadContactsBirthdays()
			// Load all month in the relevant year range
			for (let year = minYear; year <= maxYear; ++year) {
				for (let month = 1; month <= 12; ++month) {
					await calendarEventsRepository.loadMonthsIfNeeded([new Date(year, month - 1, 1)], abortController.signal, null)
				}
			}

			const dayToEvents = calendarEventsRepository.getDaysToEvents()()
			// Check that the correct event was created for each contact
			for (const contact of contacts) {
				const birthdayInCurrentYearLocal = birthdayAllDayDateLocal(contact)
				const birthdayInCurrentYearUTC = birthdayAllDayDateUTC(contact)
				for (let year = Math.max(birthdayYear(contact), minYear); year <= maxYear; ++year) {
					birthdayInCurrentYearLocal.setFullYear(year)
					birthdayInCurrentYearUTC.setUTCFullYear(year)

					// Check that there are events on the day of the contact's birthday
					const birthdayKey = birthdayInCurrentYearLocal.getTime()
					const eventsOnBirthday = dayToEvents.get(birthdayKey)
					if (!eventsOnBirthday) {
						throw new Error(
							`No dayToEvents map entry, for timestamp key ${birthdayKey}, for ${contact.firstName} ${contact.lastName}'s birthday ${contact.birthdayIso}!`,
						)
					}
					// Check that the birthday event is included in the events on that day
					const birthdayEventWrapper = eventsOnBirthday.find((eventWrapper) => eventWrapper.event.summary.includes(contact.firstName))
					if (!birthdayEventWrapper) {
						throw new Error(`No birthday event found for ${contact.firstName} ${contact.lastName}, found in daysToEvents.get(${birthdayKey})`)
					}
					// Check that the birthday event is at the correct time
					const birthdayEvent = birthdayEventWrapper.event
					o.check(birthdayEvent.startTime.getTime()).equals(birthdayInCurrentYearUTC.getTime())
				}
			}
		})
		o.test("handleContactEvent creates birthday progenitor event and reoccurrence events", async function () {
			const newContact = testContact("2025-06-15", "New", "Contact")
			when(contactModelMock.loadContactFromId(newContact._id)).thenResolve(newContact)

			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

			const birthdayInCurrentYearLocal = birthdayAllDayDateLocal(newContact)
			const birthdayInCurrentYearUTC = birthdayAllDayDateUTC(newContact)
			for (let year = birthdayYear(newContact); year <= birthdayYear(newContact) + 30; ++year) {
				birthdayInCurrentYearLocal.setFullYear(year)
				birthdayInCurrentYearUTC.setUTCFullYear(year)

				await calendarEventsRepository.loadMonthsIfNeeded([new Date(year, birthdayMonth(newContact) - 1, 1)], abortController.signal, null)

				const daysToEvents = calendarEventsRepository.getDaysToEvents()()

				// Check that a reoccurrence of the birthday event exists for this year
				const dayKey = birthdayInCurrentYearLocal.getTime()
				const event = daysToEvents.get(dayKey)![0].event
				o.check(daysToEvents.get(dayKey)!.length).equals(1)
				// Check that the birthday event is at the correct time
				o.check(event.startTime.getTime()).equals(birthdayInCurrentYearUTC.getTime())
				// Check that birthday events include the contact's name
				o.check(event.summary.includes(newContact.firstName)).equals(true)
				// Check that the age of the contact is included in all re-occurrences of the birthday event that are
				// not the original progenitor ("age 0" is superfluous).
				if (year > birthdayYear(newContact)) {
					const expectedAge = year - birthdayYear(newContact)
					o.check(event.summary.includes(expectedAge.toString())).equals(true)
				}
			}
		})
		o.test("handleContactEvent creates birthday without year", async function () {
			const birthdayMonth = 6
			const birthdayDay = 16
			const newContact = testContact(`--0${birthdayMonth}-${birthdayDay}`, "New", "Contact")
			when(contactModelMock.loadContactFromId(newContact._id)).thenResolve(newContact)

			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, newContact._id)

			for (let year = 2000; year <= 2030; ++year) {
				await calendarEventsRepository.loadMonthsIfNeeded([new Date(year, birthdayMonth - 1, 1)], abortController.signal, null)

				const daysToEvents = calendarEventsRepository.getDaysToEvents()()

				// Check that a reoccurrence of the birthday event exists for this year
				const dayKey = new Date(year, birthdayMonth - 1, birthdayDay).getTime()
				const event = daysToEvents.get(dayKey)![0].event
				o.check(daysToEvents.get(dayKey)!.length).equals(1)
				// Check that the birthday event is at the correct time
				o.check(event.startTime.getTime()).equals(Date.UTC(year, birthdayMonth - 1, birthdayDay))
				// Check the summary is correct, not containing age
				o.check(event.summary).equals(`New's birthday`)
			}
		})
		o.test("handleContactEvent removes the old birthday event when updating an existing contact's birthday", async function () {
			//
			// Setup
			//

			const preexistingContact = testContact("2026-06-15", "Preexisting", "Contact")
			when(contactModelMock.loadContactFromId(preexistingContact._id)).thenResolve(preexistingContact)

			// Create the pre-existing contact
			await calendarEventsRepository.handleContactEvent(OperationType.CREATE, preexistingContact._id)

			// Sanity check: Ensure the pre-existing contact was added
			let daysToEvents = calendarEventsRepository.getDaysToEvents()()
			const oldDayKey = birthdayAllDayDateLocal(preexistingContact).getTime()
			o.check(daysToEvents.get(oldDayKey)!.length).equals(1)

			//
			// Test
			//

			// Update the pre-existing contact
			preexistingContact.birthdayIso = "2025-07-16"
			await calendarEventsRepository.handleContactEvent(OperationType.UPDATE, preexistingContact._id)

			// Check the daysToEvents mapping was updated correctly
			daysToEvents = calendarEventsRepository.getDaysToEvents()()
			const newDayKey = birthdayAllDayDateLocal(preexistingContact).getTime()
			o.check(daysToEvents.get(oldDayKey)).equals(undefined)
			o.check(daysToEvents.get(newDayKey)!.length).equals(1)
			o.check(daysToEvents.get(newDayKey)![0].event.startTime.getTime()).equals(birthdayAllDayDateUTC(preexistingContact).getTime())
		})
	})
})
