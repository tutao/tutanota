import Stream from "mithril/stream"
import stream from "mithril/stream"
import { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel.js"
import {
	addDaysForRecurringEvent,
	calculateContactsAge,
	CalendarTimeRange,
	createRepeatRuleWithValues,
	generateUid,
	getEventEnd,
	getEventStart,
	getMonthRange,
	isBirthdayCalendar,
	isBirthdayEvent,
	isLongEvent,
} from "./CalendarUtils.js"
import { elementIdPart, getElementId, getListId, idToElementId, isSameId, isSameSingleId, listIdPart, OperationType } from "@tutao/meta"
import { DateTime } from "luxon"
import { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { EntityClient } from "../../../../platform-kit/network/EntityClient.js"
import { deepEqual, findAllAndRemove, isNotEmpty, mapAndFilterNull, stringToBase64 } from "@tutao/utils"
import { BIRTHDAY_CALENDAR_BASE_ID, DEFAULT_BIRTHDAY_CALENDAR_COLOR, DEFAULT_CALENDAR_COLOR, RepeatPeriod } from "@tutao/app-env"
import { NotAuthorizedError, NotFoundError } from "@tutao/rest-client/error"
import { EventController } from "../../api/main/EventController.js"

import { generateLocalEventElementId, getAllDayDateUTC } from "../../api/common/utils/CommonCalendarUtils.js"
import { ContactModel } from "../../contactsFunctionality/ContactModel.js"
import { LoginController } from "../../api/main/LoginController.js"
import { isoDateToBirthday, parseBirthdayIsoDate } from "../../api/common/utils/BirthdayUtils.js"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"
import { ProgressMonitorInterface } from "../../../../platform-kit/network/ProgressMonitorInterface"
import {
	Birthday,
	CalendarEvent,
	CalendarEventTypeRef,
	Contact,
	ContactTypeRef,
	createCalendarEvent,
	UserSettingsGroupRoot,
	UserSettingsGroupRootTypeRef,
} from "@tutao/entities/tutanota"
import { EntityUpdateData, isUpdateForTypeRef, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { lang } from "../../../../ui/utils/LanguageViewModel"

const LIMIT_PAST_EVENTS_YEARS = 100

const TAG = "[CalendarEventRepository]"

/** Map from timestamp of beginnings of days to events that occur on those days. */
export type DaysToEvents = ReadonlyMap<number, EventWrapper[]>

/** Object holding the year of birth if available and the corresponding event */
export type BirthdayEventRegistry = {
	baseYear: number | null
	event: CalendarEvent
}

interface ContactWrapper {
	contact: Contact
	birthday: Birthday
}

/**
 * Loads and keeps calendar events up to date.
 *
 * If you need to load calendar events there's a good chance you should just use this
 */
export class CalendarEventsRepository {
	/** timestamps of the beginning of months that we already loaded */
	private readonly loadedMonths: Map<number, string[]> = new Map() // First day of the month at midnight -> CalendarID
	private daysToEvents: Stream<DaysToEvents> = stream(new Map())
	private pendingLoadRequest: Promise<void> = Promise.resolve()
	/** number of the month (zero indexed) to birthday data */
	private monthsToBirthdayEvents: BirthdayEventRegistry[][] = [[], [], [], [], [], [], [], [], [], [], [], []]
	private birthdaysAreLoaded = false
	private calendarMemberships: string[]

	constructor(
		private readonly calendarModel: CalendarModel,
		private readonly calendarFacade: CalendarFacade,
		private readonly zone: string,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly contactModel: ContactModel,
		private readonly logins: LoginController,
	) {
		eventController.addEntityUpdatesListener({
			id: "CalendarEventsRepository",
			onEntityUpdatesReceived: (updates, eventOwnerGroupId) => this.onEntityUpdatesReceived(updates, eventOwnerGroupId),
			priority: ListenerPriority.NORMAL,
		})
		this.calendarMemberships = this.logins
			.getUserController()
			.getCalendarMemberships()
			.map((membership) => membership.group)
		// Detect when group infos has been reset and reset our data in turn.
		// There is probably another way, we could reduce and also compute symmetric difference.
		// This might fire right away but it should be harmless then.
		this.calendarModel.getCalendarInfosStream().map((infos) => {
			if (infos.size === 0) {
				this.loadedMonths.clear()
				this.daysToEvents(new Map())
			}
		})
	}

	getDaysToEvents(): Stream<DaysToEvents> {
		return this.daysToEvents
	}

	async canLoadBirthdaysCalendar(): Promise<boolean> {
		return this.logins.getUserController().isInternalUser() && (await this.logins.getUserController().isNewPaidPlan())
	}

	async forceLoadEventsAt(daysInMonths: Array<Date>): Promise<void> {
		for (const dayInMonth of daysInMonths) {
			const monthRange = getMonthRange(dayInMonth, this.zone)
			try {
				let calendarInfos = await this.calendarModel.getCalendarInfos()

				if (!this.loadedMonths.has(monthRange.start)) {
					this.loadedMonths.set(monthRange.start, Array.from(calendarInfos.keys()))
				}

				const eventsMap = await this.calendarFacade.updateEventMap(monthRange, calendarInfos, this.daysToEvents(), this.zone)
				this.replaceEvents(eventsMap)

				const utcMonthRange: CalendarTimeRange = {
					start: Date.UTC(dayInMonth.getFullYear(), dayInMonth.getMonth(), 1),
					// The 0th day is the last day of the previous month, giving us the end of the range
					end: Date.UTC(dayInMonth.getFullYear(), dayInMonth.getMonth() + 1, 0),
				}
				this.addBirthdaysEventsIfNeeded(getAllDayDateUTC(dayInMonth), utcMonthRange)
			} catch (e) {
				this.loadedMonths.delete(monthRange.start)
				throw e
			}
		}
	}

	/**
	 *
	 * @param daysInMonths - The first day of each month to be loaded.  In practice, these are is a JS Date representing midnight on the
	 * first day of the month, created using the CalendarViewModel's timezone.
	 * These can also come from the SearchViewModel, in which case it is a JSDate created using the default (device) timezone.
	 * @param canceled
	 * @param progressMonitor
	 * @param calendarToLoad
	 * @param isForceReload - In practice, this only seems to be set to true when there is a sync-status change
	 */
	async loadMonthsIfNeeded(
		daysInMonths: Array<Date>,
		canceled: AbortSignal,
		progressMonitor: ProgressMonitorInterface | null,
		calendarToLoad?: string, // how is it possible that this can be null?
		isForceReload: boolean = false,
	): Promise<void> {
		if (isForceReload) {
			this.pendingLoadRequest = Promise.resolve()
		}
		const promiseForThisLoadRequest = this.pendingLoadRequest.then(async () => {
			for (const dayInMonth of daysInMonths) {
				if (canceled.aborted) return

				const monthRange = getMonthRange(dayInMonth, this.zone)

				const utcMonthRange: CalendarTimeRange = {
					start: Date.UTC(dayInMonth.getFullYear(), dayInMonth.getMonth(), 1),
					// The 0th day is the last day of the previous month, giving us the end of the range
					end: Date.UTC(dayInMonth.getFullYear(), dayInMonth.getMonth() + 1, 0),
				}

				if (isForceReload) {
					let calendarInfos = await this.calendarModel.getCalendarInfos()
					const eventsMap = await this.calendarFacade.updateEventMap(monthRange, calendarInfos, this.daysToEvents(), this.zone)
					this.replaceEvents(eventsMap)
					this.addBirthdaysEventsIfNeeded(getAllDayDateUTC(dayInMonth), utcMonthRange)
				} else if (
					!this.loadedMonths.has(monthRange.start) ||
					(calendarToLoad != null && !this.isCalendarLoadedForRange(monthRange.start, calendarToLoad))
				) {
					try {
						let calendarInfos = await this.calendarModel.getCalendarInfos()

						const loadedMonth = this.loadedMonths.get(monthRange.start)
						if (!loadedMonth || (calendarToLoad && !loadedMonth.includes(calendarToLoad))) {
							this.loadedMonths.set(monthRange.start, Array.from(calendarInfos.keys()))
						}

						if (calendarToLoad != null) {
							const calendarToLoadInfo = calendarInfos.get(calendarToLoad)
							if (calendarToLoadInfo == null) {
								throw Error("Trying to load a calendar that doesn't exists")
							}

							calendarInfos = new Map<string, CalendarInfo>([[calendarToLoad, calendarToLoadInfo]])
						}

						const eventsMap = await this.calendarFacade.updateEventMap(monthRange, calendarInfos, this.daysToEvents(), this.zone)
						this.replaceEvents(eventsMap)
						this.addBirthdaysEventsIfNeeded(getAllDayDateUTC(dayInMonth), utcMonthRange)
					} catch (e) {
						this.loadedMonths.delete(monthRange.start)
						throw e
					}
				}
				progressMonitor?.workDone(1)
			}
		})
		this.pendingLoadRequest = promiseForThisLoadRequest
		await promiseForThisLoadRequest
	}

	private isCalendarLoadedForRange(rangeStart: number, calendarId: string | null | undefined): boolean {
		if (calendarId == null) {
			return false
		}

		return this.loadedMonths.get(rangeStart)?.includes(calendarId) ?? false
	}

	private async addOrUpdateEvent(calendarInfo: CalendarInfo | null, eventWrapper: EventWrapper) {
		if (calendarInfo == null) {
			return
		}

		const eventListId = getListId(eventWrapper.event)
		const shouldGoIntoLongEventsList =
			isSameSingleId(calendarInfo.groupRoot.longEvents, eventListId) ||
			isLongEvent(eventWrapper.event, eventWrapper.event.repeatRule?.timeZone ?? this.zone)
		if (shouldGoIntoLongEventsList) {
			this.removeExistingEvent(eventWrapper.event)

			for (const [firstDayTimestamp, _] of this.loadedMonths) {
				const loadedMonth = getMonthRange(new Date(firstDayTimestamp), this.zone)

				if (eventWrapper.event.repeatRule != null) {
					await this.addDaysForRecurringEvent(eventWrapper, loadedMonth)
				} else {
					await this.addDaysForEvent(eventWrapper, loadedMonth)
				}
			}

			return
		}

		// to prevent unnecessary churn, we only add the event if we have the months it covers loaded.
		const eventStartMonth = getMonthRange(getEventStart(eventWrapper.event, this.zone), this.zone)
		const eventEndMonth = getMonthRange(getEventEnd(eventWrapper.event, this.zone), this.zone)

		if (this.isCalendarLoadedForRange(eventStartMonth.start, eventWrapper.event._ownerGroup)) {
			await this.addDaysForEvent(eventWrapper, eventStartMonth)
		}
		// no short event covers more than two months, so this should cover everything.
		if (eventEndMonth.start !== eventStartMonth.start && this.isCalendarLoadedForRange(eventEndMonth.start, eventWrapper.event._ownerGroup)) {
			await this.addDaysForEvent(eventWrapper, eventEndMonth)
		}
	}

	private replaceEvents(newMap: DaysToEvents): void {
		// We rely on typescript ReadonlyMap type because freezing
		// this map throws "The object can not be cloned" on iOS
		// when the source of newMap is updateEventMap
		this.daysToEvents(newMap)
	}

	private cloneEvents(): Map<number, Array<EventWrapper>> {
		return new Map(Array.from(this.daysToEvents().entries()).map(([day, events]) => [day, events.slice()]))
	}

	private removeEventForCalendar(calendarId: string) {
		const isValidEvent = (ev: CalendarEvent) => !(ev._ownerGroup === calendarId)
		const mapExistingEvents = ([day, events]: [number, EventWrapper[]]): [number, EventWrapper[]] => [
			day,
			events.slice().filter((ev) => isValidEvent(ev.event)),
		]

		let filtered_events = new Map(Array.from(this.daysToEvents().entries()).map(mapExistingEvents))
		this.daysToEvents(filtered_events)
	}

	private removeBirthdayEventsForContact(contactId: string) {
		const encodedContactId = stringToBase64(contactId)

		const daysToEventsMap = this.daysToEvents() as Map<number, EventWrapper[]>
		let removedBirthDayEventInDaysToEvents = false
		for (const [key, eventsList] of daysToEventsMap.entries()) {
			let newIndex = 0
			for (let i = 0; i < eventsList.length; ++i) {
				const event = eventsList[i].event
				if (isBirthdayEvent(event.uid) && elementIdPart(event._id)?.includes(encodedContactId)) {
					removedBirthDayEventInDaysToEvents = true
				} else {
					eventsList[newIndex] = eventsList[i]
					++newIndex
				}
			}
			eventsList.length = newIndex
			if (eventsList.length === 0) {
				daysToEventsMap.delete(key)
				// NOTE: Deleting while iterating appears to be safe for JavaScript Maps. Sources:
				//          https://262.ecma-international.org/#sec-createmapiterator
				//          https://stackoverflow.com/questions/35940216/es6-is-it-dangerous-to-delete-elements-from-set-map-during-set-map-iteration,
			}
		}
		if (removedBirthDayEventInDaysToEvents) {
			this.daysToEvents(new Map(daysToEventsMap))
		}

		for (let monthIndex = 0; monthIndex < 12; ++monthIndex) {
			const events = this.monthsToBirthdayEvents[monthIndex]
			if (!events) {
				continue
			}

			let newIndex = 0
			for (let i = 0; i < events.length; ++i) {
				const event = events[i].event
				const keepEvent = !elementIdPart(event._id).includes(encodedContactId)
				if (keepEvent) {
					events[newIndex] = events[i]
					++newIndex
				}
			}
			events.length = newIndex
		}
	}

	private addDaysForRecurringEvent(event: EventWrapper, month: CalendarTimeRange): void {
		if (!isBirthdayCalendar(listIdPart(event.event._id)) && -DateTime.fromJSDate(event.event.startTime).diffNow("year").years > LIMIT_PAST_EVENTS_YEARS) {
			console.log("repeating event is too far into the past", event)
			return
		}

		const newMap = this.cloneEvents()

		addDaysForRecurringEvent(newMap, event, month, this.zone)

		this.replaceEvents(newMap)
	}

	private removeDaysForEvent(id: IdTuple): void {
		const newMap = this.cloneEvents()

		for (const dayEvents of newMap.values()) {
			findAllAndRemove(dayEvents, (e) => isSameId(e.event._id, id))
		}

		this.replaceEvents(newMap)
	}

	/**
	 * Removes {@param eventToRemove} from {@param events} using isSameEvent()
	 */
	private removeExistingEvent(eventToRemove: CalendarEvent) {
		const newMap = this.cloneEvents()

		for (const dayEvents of newMap.values()) {
			findAllAndRemove(dayEvents, (e) => isSameId(e.event._id, eventToRemove._id))
		}

		this.replaceEvents(newMap)
	}

	private async addDaysForEvent(event: EventWrapper, month: CalendarTimeRange) {
		const { addDaysForEventInstance } = await import("./CalendarUtils.js")
		const newMap = this.cloneEvents()
		addDaysForEventInstance(newMap, event, month, this.zone)
		this.replaceEvents(newMap)
	}

	private async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: string) {
		const calendarInfos = await this.calendarModel.getCalendarInfos()
		for (const update of updates) {
			if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
				await this.handleCalendarEventUpdate(update, eventOwnerGroupId, calendarInfos)
			} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				// Possible accepting/leaving a shared calendar, check if memberships has changed
				await this.handleMembershipChanges()
			} else if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				await this.handleCalendarGroupSettingsUpdate(update, calendarInfos)
			}
		}
	}

	private async handleCalendarGroupSettingsUpdate(update: EntityUpdateData, calendarInfos: ReadonlyMap<Id, CalendarInfo>) {
		const userSettingsGroupRoot = await this.entityClient.load(UserSettingsGroupRootTypeRef, idToElementId(update.instanceId))
		//get all loaded events and update them with new event wrappers that have the new color passed in
		const newDayToEventsMap = new Map<number, EventWrapper[]>()
		const dayToEventsEntries = Array.from(this.daysToEvents().entries())
		for (const entry of dayToEventsEntries) {
			const [day, events] = entry
			const newEventWrapperList = events.map((eventWrapper) => {
				return this.updateEventWrapperColor(eventWrapper, userSettingsGroupRoot)
			})
			newDayToEventsMap.set(day, newEventWrapperList)
		}

		this.daysToEvents(newDayToEventsMap)
	}

	private updateEventWrapperColor(eventWrapper: EventWrapper, userSettingsGroupRoot: UserSettingsGroupRoot) {
		let updatedCalendarColor = DEFAULT_CALENDAR_COLOR
		if (eventWrapper.event._ownerGroup) {
			if (eventWrapper.flags.isBirthdayEvent) {
				updatedCalendarColor = this.calendarModel.getBirthdayCalendarInfo().color
			} else {
				const groupSettings = userSettingsGroupRoot.groupSettings.find((groupSettings) => groupSettings.group === eventWrapper.event._ownerGroup)
				if (groupSettings && groupSettings.color) {
					updatedCalendarColor = groupSettings.color
				}
			}
		}
		const newEventWrapper: EventWrapper = {
			event: eventWrapper.event,
			flags: eventWrapper.flags,
			color: updatedCalendarColor,
		}
		return newEventWrapper
	}

	private async handleCalendarEventUpdate(update: EntityUpdateData, eventOwnerGroupId: string, calendarInfos: ReadonlyMap<Id, CalendarInfo>) {
		if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
			try {
				const event = await this.entityClient.load(CalendarEventTypeRef, [update.instanceListId!, update.instanceId])
				const wrapper: EventWrapper = {
					event,
					flags: {
						isGhost: !!event.pendingInvitation,
						hasAlarms: isNotEmpty(event.alarmInfos),
						isAlteredInstance: Boolean(event.recurrenceId),
					},
					color: calendarInfos.get(eventOwnerGroupId)?.color ?? DEFAULT_CALENDAR_COLOR,
				}
				await this.addOrUpdateEvent(calendarInfos.get(eventOwnerGroupId) ?? null, wrapper)
			} catch (e) {
				if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
					console.log(TAG, e.name, "updated event is not accessible anymore")
				}
				throw e
			}
		} else if (update.operation === OperationType.DELETE) {
			this.removeDaysForEvent([update.instanceListId!, update.instanceId])
		}
	}

	private async handleMembershipChanges() {
		const updatedMemberships = this.logins.getUserController().getCalendarMemberships()
		if (!deepEqual(this.calendarMemberships, updatedMemberships)) {
			const newCalendars = updatedMemberships.filter((membership) => !this.calendarMemberships.includes(membership.group))
			const removedCalendars = this.calendarMemberships.filter((membership) => !updatedMemberships.some((it) => it.group === membership))
			const dates = Array.from(this.loadedMonths.keys()).map((it) => new Date(it))

			await Promise.all(newCalendars.map((calendar) => this.loadMonthsIfNeeded(dates, new AbortController().signal, null, calendar.group)))
			for (const calendar of removedCalendars) {
				this.removeEventForCalendar(calendar)
			}

			this.calendarMemberships = updatedMemberships.map((it) => it.group)
		}
	}

	private createBirthdayEvent(contact: Contact, userId: Id, removeIfExists: boolean) {
		if (!contact.birthdayIso) {
			console.warn("Skipping birthday event creation. Trying to create a birthday event for an invalid contact.")
			return null
		}

		if (removeIfExists) {
			this.removeBirthdayEventsForContact(contact._id.join("/"))
		}

		const encodedContactId = stringToBase64(contact._id.join("/"))
		const calendarId = `${userId}#${BIRTHDAY_CALENDAR_BASE_ID}`
		const uid = generateUid(calendarId, Date.now())

		const eventTitle = lang.get("birthdayEvent_title", { "{name}": contact.firstName })

		const parseResult = parseBirthdayIsoDate(contact.birthdayIso)
		const birthdayYear = parseInt(parseResult.year ?? "1970")
		const birthdayMonthIndex = parseInt(parseResult.month) - 1
		const birthdayDay = parseInt(parseResult.day)

		const startDate = new Date(Date.UTC(birthdayYear, birthdayMonthIndex, birthdayDay))
		const endDate = new Date(Date.UTC(birthdayYear, birthdayMonthIndex, birthdayDay + 1))

		const newEvent = createCalendarEvent({
			sequence: "0",
			recurrenceId: null,
			sender: null,
			hashedUid: null,
			summary: eventTitle,
			startTime: startDate,
			endTime: endDate,
			location: "",
			description: "", // The only visible part of the event will be the title
			alarmInfos: [],
			organizer: null,
			attendees: [],
			invitedConfidentially: null,
			repeatRule: createRepeatRuleWithValues(RepeatPeriod.ANNUALLY, 1),
			uid,
			pendingInvitation: null,
			startTimeZone: null,
			endTimeZone: null,
		})

		newEvent._id = [calendarId, `${generateLocalEventElementId(newEvent.startTime.getTime(), contact._id.join("/"))}#${encodedContactId}`]
		newEvent._ownerGroup = calendarId

		let birthdayEventsInSameMonth = this.monthsToBirthdayEvents[birthdayMonthIndex]
		const index = birthdayEventsInSameMonth.findIndex((ev) => getElementId(ev.event) === getElementId(newEvent))
		if (index === -1) {
			birthdayEventsInSameMonth.push({ baseYear: birthdayYear, event: newEvent })
		} else {
			birthdayEventsInSameMonth[index] = { baseYear: birthdayYear, event: newEvent }
		}
		this.monthsToBirthdayEvents[birthdayMonthIndex] = birthdayEventsInSameMonth
		return newEvent
	}

	async loadContactsBirthdays(): Promise<{ valid: ContactWrapper[]; invalid: Contact[] } | undefined> {
		if (this.birthdaysAreLoaded) {
			// After a first load we don't need to load it again because we handle contact entity events in the CalendarViewModel
			console.info("Birthdays already loaded, skipping new load attempt.")
			return
		}
		const listId = await this.contactModel.getContactListId()

		if (listId == null) {
			console.warn("Missing listId during birthdays load")
			return { valid: [], invalid: [] }
		}

		const contacts = await this.entityClient.loadAll(ContactTypeRef, listId)
		const invalidContacts: Contact[] = []
		const filteredContacts = mapAndFilterNull<Contact, ContactWrapper>(contacts, (contact) => {
			if (contact.birthdayIso == null) {
				return null
			}

			const parsedContact = this.validateContactBirthday(contact)
			if (!parsedContact) {
				invalidContacts.push(contact)
				return null
			}

			return parsedContact
		}).sort((a, b) => new Date(`${a.birthday.month}/${a.birthday.day}`).getTime() - new Date(`${b.birthday.month}/${b.birthday.day}`).getTime())

		for (const { contact } of filteredContacts) {
			this.createBirthdayEvent(contact, this.logins.getUserController().userId, true)
		}

		console.info(`Birthday events loaded - ${filteredContacts.length} Valid contacts / ${invalidContacts.length} Invalid contacts`)
		this.birthdaysAreLoaded = true

		return { valid: filteredContacts, invalid: invalidContacts }
	}

	async handleContactEvent(operation: OperationType, id: IdTuple) {
		if (operation === OperationType.CREATE) {
			await this.loadContactAndUpdateBirthday(id, false)
		} else if (operation === OperationType.UPDATE) {
			await this.loadContactAndUpdateBirthday(id, true)
		} else if (operation === OperationType.DELETE) {
			this.removeBirthdayEventsForContact(id.join("/"))
		}

		console.info("Processed contact entity event, operation type", operation, "for contact id", id)
	}

	private async loadContactAndUpdateBirthday(contactId: IdTuple, removeIfExists: boolean) {
		const contact = await this.contactModel.loadContactFromId(contactId)

		const newEvent = this.createBirthdayEvent(contact, this.logins.getUserController().userId, removeIfExists)

		if (!newEvent) {
			return
		}

		const currentBirthdayDate = newEvent.startTime
		const utcMonthRange: CalendarTimeRange = {
			start: Date.UTC(currentBirthdayDate.getUTCFullYear(), currentBirthdayDate.getUTCMonth(), 1),
			// The 0th day is the last day of the previous month, giving us the end of the range
			end: Date.UTC(currentBirthdayDate.getUTCFullYear(), currentBirthdayDate.getUTCMonth() + 1, 0),
		}
		this.addBirthdaysEventsIfNeeded(currentBirthdayDate, utcMonthRange, true)
	}

	private validateContactBirthday(contact: Contact): ContactWrapper | null {
		try {
			const parsedBirthday = isoDateToBirthday(contact.birthdayIso!)
			return {
				contact,
				birthday: parsedBirthday,
			}
		} catch (_) {
			return null
		}
	}

	addBirthdaysEventsIfNeeded(selectedDate: Date, utcMonthRangeForRecurrence: CalendarTimeRange, removeEventOccurrences = false) {
		const selectedYear = selectedDate.getUTCFullYear()
		const selectedMonth = selectedDate.getUTCMonth()

		for (const calendarEvent of this.monthsToBirthdayEvents[selectedMonth]) {
			const age = calculateContactsAge(calendarEvent.baseYear, selectedYear)
			const ageString = age ? `(${lang.get("birthdayEventAge_title", { "{age}": age })})` : ""

			if (removeEventOccurrences) {
				this.removeDaysForEvent(calendarEvent.event._id)
			}
			this.addDaysForRecurringEvent(
				{
					event: {
						...calendarEvent.event,
						summary: `${calendarEvent.event.summary} ${ageString}`,
					},
					color: this.logins.getUserController().userSettingsGroupRoot.birthdayCalendarColor ?? DEFAULT_BIRTHDAY_CALENDAR_COLOR,
					flags: {
						isBirthdayEvent: true,
						isAlteredInstance: false,
						hasAlarms: false,
					},
				},
				utcMonthRangeForRecurrence,
			)
		}
	}
}
