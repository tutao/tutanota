import Stream from "mithril/stream"
import stream from "mithril/stream"
import { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel.js"
import { IProgressMonitor } from "../../api/common/utils/ProgressMonitor.js"
import {
	addDaysForRecurringEvent,
	calculateContactsAge,
	CalendarTimeRange,
	createRepeatRuleWithValues,
	extractYearFromBirthday,
	generateUid,
	getAllDayDatesUTCFromIso,
	getEventEnd,
	getEventStart,
	getMonthRange,
	isBirthdayCalendar,
	isBirthdayEvent,
} from "./CalendarUtils.js"
import { Birthday, CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, createCalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { elementIdPart, getElementId, getListId, isSameId, listIdPart } from "../../api/common/utils/EntityUtils.js"
import { DateTime } from "luxon"
import { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { deepEqual, findAllAndRemove, mapAndFilterNull, stringToBase64 } from "@tutao/tutanota-utils"
import { BIRTHDAY_CALENDAR_BASE_ID, OperationType, RepeatPeriod } from "../../api/common/TutanotaConstants.js"
import { NotAuthorizedError, NotFoundError } from "../../api/common/error/RestError.js"
import { EventController } from "../../api/main/EventController.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"
import { generateLocalEventElementId } from "../../api/common/utils/CommonCalendarUtils.js"
import { ContactModel } from "../../contactsFunctionality/ContactModel.js"
import { LoginController } from "../../api/main/LoginController.js"
import { isoDateToBirthday } from "../../api/common/utils/BirthdayUtils.js"
import { EventRenderWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"

const LIMIT_PAST_EVENTS_YEARS = 100

const TAG = "[CalendarEventRepository]"

/** Map from timestamp of beginnings of days to events that occur on those days. */
export type DaysToEvents = ReadonlyMap<number, ReadonlyArray<EventRenderWrapper>>

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
	private clientOnlyEvents: Map<number, BirthdayEventRegistry[]> = new Map()
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
		eventController.addEntityListener((updates, eventOwnerGroupId) => this.entityEventsReceived(updates, eventOwnerGroupId))
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

	getEventsForMonths(): Stream<DaysToEvents> {
		return this.daysToEvents
	}

	getBirthdayEvents(): Map<number, BirthdayEventRegistry[]> {
		return this.clientOnlyEvents
	}

	async canLoadBirthdaysCalendar(): Promise<boolean> {
		return await this.logins.getUserController().isNewPaidPlan()
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
				this.addBirthdaysEventsIfNeeded(dayInMonth, monthRange)
			} catch (e) {
				this.loadedMonths.delete(monthRange.start)
				throw e
			}
		}
	}

	async loadMonthsIfNeeded(
		daysInMonths: Array<Date>,
		canceled: Stream<boolean>,
		progressMonitor: IProgressMonitor | null,
		calendarToLoad?: string,
	): Promise<void> {
		const promiseForThisLoadRequest = this.pendingLoadRequest.then(async () => {
			for (const dayInMonth of daysInMonths) {
				if (canceled()) return

				const monthRange = getMonthRange(dayInMonth, this.zone)
				if (!this.loadedMonths.has(monthRange.start) || (calendarToLoad != null && !this.isCalendarLoadedForRange(monthRange.start, calendarToLoad))) {
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
						this.addBirthdaysEventsIfNeeded(dayInMonth, monthRange)
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

	private async addOrUpdateEvent(calendarInfo: CalendarInfo | null, event: EventRenderWrapper) {
		if (calendarInfo == null) {
			return
		}
		const eventListId = getListId(event.event)
		if (isSameId(calendarInfo.groupRoot.shortEvents, eventListId)) {
			// to prevent unnecessary churn, we only add the event if we have the months it covers loaded.
			const eventStartMonth = getMonthRange(getEventStart(event.event, this.zone), this.zone)
			const eventEndMonth = getMonthRange(getEventEnd(event.event, this.zone), this.zone)
			if (this.isCalendarLoadedForRange(eventStartMonth.start, event.event._ownerGroup)) {
				await this.addDaysForEvent(event, eventStartMonth)
			}
			// no short event covers more than two months, so this should cover everything.
			if (eventEndMonth.start !== eventStartMonth.start && this.isCalendarLoadedForRange(eventEndMonth.start, event.event._ownerGroup)) {
				await this.addDaysForEvent(event, eventEndMonth)
			}
		} else if (isSameId(calendarInfo.groupRoot.longEvents, eventListId)) {
			this.removeExistingEvent(event.event)

			for (const [firstDayTimestamp, _] of this.loadedMonths) {
				const loadedMonth = getMonthRange(new Date(firstDayTimestamp), this.zone)

				if (event.event.repeatRule != null) {
					await this.addDaysForRecurringEvent(event, loadedMonth)
				} else {
					await this.addDaysForEvent(event, loadedMonth)
				}
			}
		}
	}

	private replaceEvents(newMap: DaysToEvents): void {
		// We rely on typescript ReadonlyMap type because freezing
		// this map throws "The object can not be cloned" on iOS
		// when the source of newMap is updateEventMap
		this.daysToEvents(newMap)
	}

	private cloneEvents(): Map<number, Array<EventRenderWrapper>> {
		return new Map(Array.from(this.daysToEvents().entries()).map(([day, events]) => [day, events.slice()]))
	}

	private removeEventForCalendar(calendarId: string) {
		const isValidEvent = (ev: CalendarEvent) => !(ev._ownerGroup === calendarId)
		const mapExistingEvents = ([day, events]: [number, EventRenderWrapper[]]): [number, EventRenderWrapper[]] => [
			day,
			events.slice().filter((ev) => isValidEvent(ev.event)),
		]

		let filtered_events = new Map(Array.from(this.daysToEvents().entries()).map(mapExistingEvents))
		this.daysToEvents(filtered_events)
	}

	private removeBirthdayEventsForContact(contactId: string, month: number | null) {
		const encodedContactId = stringToBase64(contactId)
		const isValidEvent = (ev: CalendarEvent) => {
			return !(isBirthdayEvent(ev.uid) && elementIdPart(ev._id)?.includes(encodedContactId))
		}
		const mapExistingEvents = ([day, events]: [number, EventRenderWrapper[]]): [number, EventRenderWrapper[]] => [
			day,
			events.slice().filter((ev) => isValidEvent(ev.event)),
		]

		let filtered_events = new Map(Array.from(this.daysToEvents().entries()).map(mapExistingEvents))
		this.daysToEvents(filtered_events)

		let monthToSearch = month ?? 0
		while (monthToSearch < 12) {
			let found = false
			let clientOnlyEventsOfThisMonth = (this.clientOnlyEvents.get(monthToSearch) ?? []).filter((ev) => {
				const isContactEvent = elementIdPart(ev.event._id).includes(encodedContactId)
				if (isContactEvent) {
					found = true
				}

				return !isContactEvent
			})

			this.clientOnlyEvents.set(monthToSearch, clientOnlyEventsOfThisMonth)

			if (found) break
			monthToSearch += 1
		}
	}

	private addDaysForRecurringEvent(event: EventRenderWrapper, month: CalendarTimeRange): void {
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

	private async addDaysForEvent(event: EventRenderWrapper, month: CalendarTimeRange) {
		const { addDaysForEventInstance } = await import("./CalendarUtils.js")
		const newMap = this.cloneEvents()
		addDaysForEventInstance(newMap, event, month, this.zone)
		this.replaceEvents(newMap)
	}

	private async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: string) {
		const calendarInfos = await this.calendarModel.getCalendarInfos()
		for (const update of updates) {
			if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
				if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
					try {
						const event = await this.entityClient.load(CalendarEventTypeRef, [update.instanceListId, update.instanceId])
						const wrapper = {
							event,
							isGhost: calendarInfos.get(eventOwnerGroupId)?.groupRoot.pendingEvents?.list === update.instanceListId,
						}
						await this.addOrUpdateEvent(calendarInfos.get(eventOwnerGroupId) ?? null, wrapper)
					} catch (e) {
						if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
							console.log(TAG, e.name, "updated event is not accessible anymore")
						}
						throw e
					}
				} else if (update.operation === OperationType.DELETE) {
					this.removeDaysForEvent([update.instanceListId, update.instanceId])
				}
			} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				// Possible accepting/leaving a shared calendar, check if memberships has changed
				await this.handleMembershipChanges()
			}
		}
	}

	private async handleMembershipChanges() {
		const updatedMemberships = this.logins.getUserController().getCalendarMemberships()
		if (!deepEqual(this.calendarMemberships, updatedMemberships)) {
			const newCalendars = updatedMemberships.filter((membership) => !this.calendarMemberships.includes(membership.group))
			const removedCalendars = this.calendarMemberships.filter((membership) => !updatedMemberships.some((it) => it.group === membership))
			const dates = Array.from(this.loadedMonths.keys()).map((it) => new Date(it))

			await Promise.all(newCalendars.map((calendar) => this.loadMonthsIfNeeded(dates, stream(false), null, calendar.group)))
			for (const calendar of removedCalendars) {
				this.removeEventForCalendar(calendar)
			}

			this.calendarMemberships = updatedMemberships.map((it) => it.group)
		}
	}

	public pushClientOnlyEvent(month: number, newEvent: CalendarEvent, baseYear: number | null) {
		let clientOnlyEventsOfThisMonth = this.clientOnlyEvents.get(month) ?? []
		const index = clientOnlyEventsOfThisMonth.findIndex((ev) => getElementId(ev.event) === getElementId(newEvent))
		if (index === -1) {
			clientOnlyEventsOfThisMonth.push({ baseYear, event: newEvent })
		} else {
			clientOnlyEventsOfThisMonth[index] = { baseYear, event: newEvent }
		}
		this.clientOnlyEvents.set(month, clientOnlyEventsOfThisMonth)
	}

	private createClientOnlyBirthdayEvent(contact: Contact, userId: Id) {
		if (!contact.birthdayIso) {
			console.warn("Skipping birthday event creation. Trying to create a birthday event for an invalid contact.")
			return null
		}

		const encodedContactId = stringToBase64(contact._id.join("/"))
		const calendarId = `${userId}#${BIRTHDAY_CALENDAR_BASE_ID}`
		const uid = generateUid(calendarId, Date.now())

		const eventTitle = this.calendarModel.getBirthdayEventTitle(contact.firstName)
		const { startDate, endDate } = getAllDayDatesUTCFromIso(contact.birthdayIso!, this.zone)

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
		})

		newEvent._id = [calendarId, `${generateLocalEventElementId(newEvent.startTime.getTime(), contact._id.join("/"))}#${encodedContactId}`]
		newEvent._ownerGroup = calendarId
		return newEvent
	}

	async loadContactsBirthdays(): Promise<{ valid: ContactWrapper[]; invalid: Contact[] } | undefined> {
		if (this.clientOnlyEvents.size) {
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
			const newEvent = this.createClientOnlyBirthdayEvent(contact, this.logins.getUserController().userId)
			if (newEvent) {
				this.pushClientOnlyEvent(newEvent.startTime.getMonth(), newEvent, extractYearFromBirthday(contact.birthdayIso))
			}
		}

		console.info(`Birthday events loaded - ${filteredContacts.length} Valid contacts / ${invalidContacts.length} Invalid contacts`)
		return { valid: filteredContacts, invalid: invalidContacts }
	}

	async handleContactEvent(operation: OperationType, id: IdTuple) {
		if (operation === OperationType.CREATE) {
			await this.loadContactAndUpdateBirthday(id, false)
		} else if (operation === OperationType.UPDATE) {
			await this.loadContactAndUpdateBirthday(id, true)
		} else if (operation === OperationType.DELETE) {
			this.removeBirthdayEventsForContact(id.join("/"), null)
		}

		console.info("Processed contact entity event, operation type", operation, "for contact id", id)
	}

	private async loadContactAndUpdateBirthday(contactId: IdTuple, removeIfExists: boolean) {
		const contact = await this.contactModel.loadContactFromId(contactId)

		const newEvent = this.createClientOnlyBirthdayEvent(contact, this.logins.getUserController().userId)

		if (!newEvent) {
			return
		}

		const currentBirthdayDate = new Date(newEvent.startTime)
		currentBirthdayDate.setFullYear(new Date().getFullYear())

		if (removeIfExists) {
			this.removeBirthdayEventsForContact(contactId.join("/"), currentBirthdayDate.getMonth())
		}

		this.pushClientOnlyEvent(newEvent.startTime.getMonth(), newEvent, extractYearFromBirthday(contact.birthdayIso))

		const monthRange = getMonthRange(currentBirthdayDate, this.zone)
		this.addBirthdaysEventsIfNeeded(currentBirthdayDate, monthRange, true)
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

	addBirthdaysEventsIfNeeded(selectedDate: Date, monthRangeForRecurrence: CalendarTimeRange, removeEventOccurrences = false) {
		const clientOnlyEventsThisMonth: Array<BirthdayEventRegistry> | undefined = this.clientOnlyEvents.get(selectedDate.getMonth())
		const birthdaysOfThisMonth = clientOnlyEventsThisMonth?.filter((birthdayEvent) => isBirthdayEvent(birthdayEvent.event.uid))
		if (birthdaysOfThisMonth) {
			for (const calendarEvent of birthdaysOfThisMonth) {
				const age = calculateContactsAge(calendarEvent.baseYear, selectedDate.getFullYear())
				const ageString = age ? `(${this.calendarModel.getAgeString(age)})` : ""

				if (removeEventOccurrences) {
					this.removeDaysForEvent(calendarEvent.event._id)
				}
				this.addDaysForRecurringEvent(
					{
						event: {
							...calendarEvent.event,
							summary: `${calendarEvent.event.summary} ${ageString}`,
						},
						isGhost: false,
					},
					monthRangeForRecurrence,
				)
			}
		}
	}
}
