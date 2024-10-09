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
	getEventEnd,
	getEventStart,
	getMonthRange,
	isBirthdayEvent,
	isClientOnlyCalendar,
} from "./CalendarUtils.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, createCalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { getListId, isSameId, listIdPart } from "../../api/common/utils/EntityUtils.js"
import { DateTime } from "luxon"
import { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { findAllAndRemove, incrementDate, isNotNull, stringToBase64 } from "@tutao/tutanota-utils"
import { CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID, OperationType, RepeatPeriod } from "../../api/common/TutanotaConstants.js"
import { NotAuthorizedError, NotFoundError } from "../../api/common/error/RestError.js"
import { EventController } from "../../api/main/EventController.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"
import { generateLocalEventElementId, getAllDayDateUTC } from "../../api/common/utils/CommonCalendarUtils.js"
import { ContactModel } from "../../contactsFunctionality/ContactModel.js"
import { LoginController } from "../../api/main/LoginController.js"

const LIMIT_PAST_EVENTS_YEARS = 100

const TAG = "[CalendarEventRepository]"

/** Map from timestamp of beginnings of days to events that occur on those days. */
export type DaysToEvents = ReadonlyMap<number, ReadonlyArray<CalendarEvent>>

/** Object holding the year of birth if available and the corresponding event */
export type BirthdayEventRegistry = {
	baseYear: number | null
	event: CalendarEvent
}

/**
 * Loads and keeps calendar events up to date.
 *
 * If you need to load calendar events there's a good chance you should just use this
 */
export class CalendarEventsRepository {
	/** timestamps of the beginning of months that we already loaded */
	private readonly loadedMonths = new Set<number>()
	private daysToEvents: Stream<DaysToEvents> = stream(new Map())
	private pendingLoadRequest: Promise<void> = Promise.resolve()

	private clientOnlyEvents: Map<number, BirthdayEventRegistry[]> = new Map()

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

	async loadMonthsIfNeeded(daysInMonths: Array<Date>, progressMonitor: IProgressMonitor, canceled: Stream<boolean>): Promise<void> {
		const promiseForThisLoadRequest = this.pendingLoadRequest.then(async () => {
			for (const dayInMonth of daysInMonths) {
				if (canceled()) return

				const monthRange = getMonthRange(dayInMonth, this.zone)

				if (!this.loadedMonths.has(monthRange.start)) {
					this.loadedMonths.add(monthRange.start)

					try {
						const calendarInfos = await this.calendarModel.getCalendarInfos()
						const eventsMap = await this.calendarFacade.updateEventMap(monthRange, calendarInfos, this.daysToEvents(), this.zone)
						this.replaceEvents(eventsMap)
						this.addBirthdaysEventsIfNeeded(dayInMonth, monthRange)
					} catch (e) {
						this.loadedMonths.delete(monthRange.start)
						throw e
					}
				}
				progressMonitor.workDone(1)
			}
		})
		this.pendingLoadRequest = promiseForThisLoadRequest
		await promiseForThisLoadRequest
	}

	private async addOrUpdateEvent(calendarInfo: CalendarInfo | null, event: CalendarEvent) {
		if (calendarInfo == null) {
			return
		}
		const eventListId = getListId(event)
		if (isSameId(calendarInfo.groupRoot.shortEvents, eventListId)) {
			// to prevent unnecessary churn, we only add the event if we have the months it covers loaded.
			const eventStartMonth = getMonthRange(getEventStart(event, this.zone), this.zone)
			const eventEndMonth = getMonthRange(getEventEnd(event, this.zone), this.zone)
			if (this.loadedMonths.has(eventStartMonth.start)) await this.addDaysForEvent(event, eventStartMonth)
			// no short event covers more than two months, so this should cover everything.
			if (eventEndMonth.start != eventStartMonth.start && this.loadedMonths.has(eventEndMonth.start)) await this.addDaysForEvent(event, eventEndMonth)
		} else if (isSameId(calendarInfo.groupRoot.longEvents, eventListId)) {
			this.removeExistingEvent(event)

			for (const firstDayTimestamp of this.loadedMonths) {
				const loadedMonth = getMonthRange(new Date(firstDayTimestamp), this.zone)

				if (event.repeatRule != null) {
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

	private cloneEvents(): Map<number, Array<CalendarEvent>> {
		return new Map(Array.from(this.daysToEvents().entries()).map(([day, events]) => [day, events.slice()]))
	}

	private addDaysForRecurringEvent(event: CalendarEvent, month: CalendarTimeRange): void {
		if (!isClientOnlyCalendar(listIdPart(event._id)) && -DateTime.fromJSDate(event.startTime).diffNow("year").years > LIMIT_PAST_EVENTS_YEARS) {
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
			findAllAndRemove(dayEvents, (e) => isSameId(e._id, id))
		}

		this.replaceEvents(newMap)
	}

	/**
	 * Removes {@param eventToRemove} from {@param events} using isSameEvent()
	 */
	private removeExistingEvent(eventToRemove: CalendarEvent) {
		const newMap = this.cloneEvents()

		for (const dayEvents of newMap.values()) {
			findAllAndRemove(dayEvents, (e) => isSameId(e._id, eventToRemove._id))
		}

		this.replaceEvents(newMap)
	}

	private async addDaysForEvent(event: CalendarEvent, month: CalendarTimeRange) {
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
						await this.addOrUpdateEvent(calendarInfos.get(eventOwnerGroupId) ?? null, event)
					} catch (e) {
						if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
							console.log(TAG, e.name, "updated event is not accessible anymore")
						}
						throw e
					}
				} else if (update.operation === OperationType.DELETE) {
					this.removeDaysForEvent([update.instanceListId, update.instanceId])
				}
			}
		}
	}

	public pushClientOnlyEvent(month: number, newEvent: CalendarEvent, baseYear: number | null) {
		let clientOnlyEventsOfThisMonth = this.clientOnlyEvents.get(month) ?? []
		clientOnlyEventsOfThisMonth.push({ baseYear, event: newEvent })
		this.clientOnlyEvents.set(month, clientOnlyEventsOfThisMonth)
	}

	private createClientOnlyBirthdayEvent(contact: Contact, userId: Id) {
		const encodedContactId = stringToBase64(contact._id.join("/"))
		const calendarId = `${userId}#${CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID}`
		const uid = generateUid(calendarId, Date.now())

		const eventTitle = this.calendarModel.getBirthdayEventTitle(contact.firstName)

		// Set the year because we can have birthdays without year
		if (contact.birthdayIso?.startsWith("--")) {
			contact.birthdayIso = contact.birthdayIso.replace("-", "1970")
		}

		const birthday = new Date(contact.birthdayIso!)

		// Set up start and end date base on UTC.
		// Also increments a copy of startDate by one day and set it as endDate
		const startDate = getAllDayDateUTC(new Date(birthday))
		const endDate = getAllDayDateUTC(incrementDate(new Date(startDate), 1))

		const newEvent = createCalendarEvent({
			sequence: "0",
			recurrenceId: null,
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

	async loadContactsBirthdays(forceReload: boolean = false) {
		// Do not reload birthdays
		if (this.clientOnlyEvents.size > 0 && !forceReload) {
			return
		}

		// Always work with an empty map of birthdays
		this.clientOnlyEvents.clear()

		const listId = await this.contactModel.getContactListId()
		if (listId == null) return []

		const dateRegex = /\d{2}-\d{2}$/

		const contacts = await this.entityClient.loadAll(ContactTypeRef, listId)
		const filteredContacts = contacts
			.filter((contact) => isNotNull(contact.birthdayIso))
			.sort((a, b) => {
				const dateA = a.birthdayIso?.match(dateRegex)
				const dateB = b.birthdayIso?.match(dateRegex)
				return new Date(dateA![0]).getTime() - new Date(dateB![0]).getTime()
			})

		for (const contact of filteredContacts) {
			const newEvent = this.createClientOnlyBirthdayEvent(contact, this.logins.getUserController().userId)
			this.pushClientOnlyEvent(newEvent.startTime.getMonth(), newEvent, extractYearFromBirthday(contact.birthdayIso))
		}

		return filteredContacts
	}

	refreshBirthdayCalendar(date: Date) {
		const month = getMonthRange(date, this.zone)
		this.addBirthdaysEventsIfNeeded(date, month, true)
	}

	addBirthdaysEventsIfNeeded(selectedDate: Date, monthRangeForRecurrence: CalendarTimeRange, removeEventOccurrences = false) {
		const clientOnlyEventsThisMonth = this.clientOnlyEvents.get(selectedDate.getMonth())
		const birthdaysOfThisMonth = clientOnlyEventsThisMonth?.filter((birthdayEvent) => isBirthdayEvent(birthdayEvent.event.uid))
		if (birthdaysOfThisMonth) {
			for (const calendarEvent of birthdaysOfThisMonth) {
				const age = calculateContactsAge(calendarEvent.baseYear, selectedDate.getFullYear())
				const ageString = age ? `(${this.calendarModel.getAgeString(age)})` : ""

				if (removeEventOccurrences) {
					this.removeDaysForEvent(calendarEvent.event._id)
				}
				this.addDaysForRecurringEvent({ ...calendarEvent.event, summary: `${calendarEvent.event.summary} ${ageString}` }, monthRangeForRecurrence)
			}
		}
	}
}
