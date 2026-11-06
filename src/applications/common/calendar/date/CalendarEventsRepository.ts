import Stream from "mithril/stream"
import stream from "mithril/stream"
import { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel.js"
import {
	addDaysForRecurringEvent,
	CalendarTimeRange,
	generateUid,
	getAllDayDatesFromBirthdayIso,
	getEventEnd,
	getEventStart,
	getMonthRange,
	isBirthdayCalendar,
	isLongEvent,
} from "./CalendarUtils.js"
import { getElementId, getListId, idToElementId, isSameId, isSameSingleId, ListElementId, listIdPart, OperationType } from "@tutao/meta"
import { DateTime } from "luxon"
import { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { EntityClient } from "../../../../platform-kit/network/EntityClient.js"
import { deepEqual, findAllAndRemove, isNotEmpty, stringToBase64 } from "@tutao/utils"
import { BIRTHDAY_CALENDAR_BASE_ID, DEFAULT_BIRTHDAY_CALENDAR_COLOR, DEFAULT_CALENDAR_COLOR, ProgrammingError } from "@tutao/app-env"
import { NotAuthorizedError, NotFoundError } from "@tutao/rest-client/error"
import { EventController } from "../../api/main/EventController.js"

import { generateLocalEventElementId } from "../../api/common/utils/CommonCalendarUtils.js"
import { ContactModel } from "../../contactsFunctionality/ContactModel.js"
import { LoginController } from "../../api/main/LoginController.js"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"
import { ProgressMonitorInterface } from "../../../../platform-kit/network/ProgressMonitorInterface"
import {
	CalendarEvent,
	CalendarEventTypeRef,
	Contact,
	ContactTypeRef,
	createCalendarEvent,
	UserSettingsGroupRoot,
	UserSettingsGroupRootTypeRef,
} from "@tutao/entities/tutanota"
import { EntityUpdateData, isUpdateForTypeRef, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

const LIMIT_PAST_EVENTS_YEARS = 100

const TAG = "[CalendarEventRepository]"

/** Map from timestamp of beginnings of days to events that occur on those days. */
export type DaysToEvents = Map<number, EventWrapper[]>

type BirthdayEventWrapper = {
	yyyymmdd: number
	event: CalendarEvent
	nextBirthdayReoccurrence: BirthdayEventWrapper | null
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
	private calendarMemberships: string[]
	private birthdaysLoadedFromContacts = false
	private contactElementIdToFirstBirthday = new Map<Id, BirthdayEventWrapper>()
	private monthIndexToFirstBirthdays: [
		BirthdayEventWrapper[],
		BirthdayEventWrapper[],
		BirthdayEventWrapper[],
		//
		BirthdayEventWrapper[],
		BirthdayEventWrapper[],
		BirthdayEventWrapper[],
		//
		BirthdayEventWrapper[],
		BirthdayEventWrapper[],
		BirthdayEventWrapper[],
		//
		BirthdayEventWrapper[],
		BirthdayEventWrapper[],
		BirthdayEventWrapper[],
	] = [[], [], [], [], [], [], [], [], [], [], [], []]

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
				this.addBirthdayEventsInMonthToEventMap(eventsMap as Map<number, EventWrapper[]>, dayInMonth)
				this.daysToEvents(eventsMap)
			} catch (e) {
				this.loadedMonths.delete(monthRange.start)
				throw e
			}
		}
	}

	async loadMonthsIfNeeded(
		daysInMonths: Array<Date>,
		canceled: AbortSignal,
		progressMonitor: ProgressMonitorInterface | null,
		calendarToLoad?: string,
		isForceReload: boolean = false,
	): Promise<void> {
		if (isForceReload) {
			this.pendingLoadRequest = Promise.resolve()
		}
		const promiseForThisLoadRequest = this.pendingLoadRequest.then(async () => {
			for (const dayInMonth of daysInMonths) {
				if (canceled.aborted) return

				const monthRange = getMonthRange(dayInMonth, this.zone)
				if (isForceReload) {
					let calendarInfos = await this.calendarModel.getCalendarInfos()
					const eventsMap = await this.calendarFacade.updateEventMap(monthRange, calendarInfos, this.daysToEvents(), this.zone)
					this.addBirthdayEventsInMonthToEventMap(eventsMap as Map<number, EventWrapper[]>, dayInMonth)
					this.daysToEvents(eventsMap)
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
						this.addBirthdayEventsInMonthToEventMap(eventsMap as Map<number, EventWrapper[]>, dayInMonth)
						this.daysToEvents(eventsMap)
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

	private addDaysForRecurringEvent(event: EventWrapper, month: CalendarTimeRange): void {
		if (!isBirthdayCalendar(listIdPart(event.event._id)) && -DateTime.fromJSDate(event.event.startTime).diffNow("year").years > LIMIT_PAST_EVENTS_YEARS) {
			console.log("repeating event is too far into the past", event)
			return
		}

		const newMap = this.cloneEvents()

		addDaysForRecurringEvent(newMap, event, month, this.zone)

		this.daysToEvents(newMap)
	}

	private removeDaysForEvent(id: IdTuple): void {
		const newMap = this.cloneEvents()

		for (const dayEvents of newMap.values()) {
			findAllAndRemove(dayEvents, (e) => isSameId(e.event._id, id))
		}

		this.daysToEvents(newMap)
	}

	/**
	 * Removes {@param eventToRemove} from {@param events} using isSameEvent()
	 */
	private removeExistingEvent(eventToRemove: CalendarEvent) {
		const newMap = this.cloneEvents()

		for (const dayEvents of newMap.values()) {
			findAllAndRemove(dayEvents, (e) => isSameId(e.event._id, eventToRemove._id))
		}

		this.daysToEvents(newMap)
	}

	private async addDaysForEvent(event: EventWrapper, month: CalendarTimeRange) {
		const { addDaysForEventInstance } = await import("./CalendarUtils.js")
		const newMap = this.cloneEvents()
		addDaysForEventInstance(newMap, event, month, this.zone)
		this.daysToEvents(newMap)
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
		const eventMap = this.daysToEvents()
		for (const events of eventMap.values()) {
			for (let i = 0; i < events.length; ++i) {
				events[i] = this.updateEventWrapperColor(events[i], userSettingsGroupRoot)
			}
		}
		// Notify observers that the map is updated
		this.daysToEvents(eventMap)
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

	async loadBirthdaysFromContacts() {
		if (this.birthdaysLoadedFromContacts) {
			// After a first load we don't need to load it again because we handle contact entity events in the CalendarViewModel
			console.info(`${TAG} Birthdays already loaded, skipping new load attempt.`)
			return
		}

		const listId = await this.contactModel.getContactListId()

		if (listId == null) {
			console.warn(`${TAG} Missing listId during birthdays load`)
			return
		}

		const contacts = await this.entityClient.loadAll(ContactTypeRef, listId)

		this.addBirthdaysFromContacts(contacts, this.logins.getUserController().userId)
		this.birthdaysLoadedFromContacts = true
	}

	async handleContactEvent(operation: OperationType, id: IdTuple) {
		if (operation === OperationType.CREATE) {
			const contact = await this.contactModel.loadContactFromId(id)
			this.createBirthdayForContact(contact, this.logins.getUserController().userId)
		} else if (operation === OperationType.UPDATE) {
			const contact = await this.contactModel.loadContactFromId(id)
			this.updateBirthdayForContact(contact, this.logins.getUserController().userId)
		} else if (operation === OperationType.DELETE) {
			this.removeBirthdaysForContact(id)
		}

		console.info("Processed contact entity event, operation type", operation, "for contact id", id)
	}

	private tryCreateBirthdayEventWrapperElseNull(contact: Contact, userId: Id): BirthdayEventWrapper | null {
		if (!contact.birthdayIso) {
			return null
		}

		const { startDate, endDate } = getAllDayDatesFromBirthdayIso(contact.birthdayIso!, this.zone)
		const year = startDate.getUTCFullYear()
		const monthIndex = startDate.getUTCMonth()
		const day = startDate.getUTCDate()
		const encodedContactId = stringToBase64(contact._id.join("/"))
		const calendarId = `${userId}#${BIRTHDAY_CALENDAR_BASE_ID}`
		const uid = generateUid(calendarId, Date.now())
		const eventTitle = this.calendarModel.getBirthdayEventTitle(contact.firstName)
		const listElementId: ListElementId = [calendarId, `${generateLocalEventElementId(startDate.getTime(), contact._id.join("/"))}#${encodedContactId}`]

		const eventWrapper: BirthdayEventWrapper = {
			yyyymmdd: year * 10000 + (monthIndex + 1) * 100 + day,
			event: createCalendarEvent({
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
				repeatRule: null,
				uid,
				pendingInvitation: null,
				startTimeZone: null,
				endTimeZone: null,
			}),
			nextBirthdayReoccurrence: null,
		}
		eventWrapper.event._id = listElementId
		eventWrapper.event._ownerGroup = calendarId

		return eventWrapper
	}

	private addBirthdaysFromContacts(contacts: Contact[], userId: Id) {
		for (const contact of contacts) {
			const birthday = this.tryCreateBirthdayEventWrapperElseNull(contact, userId)
			if (birthday) {
				const birthdayMonth = Math.floor(birthday.yyyymmdd / 100) % 100
				this.monthIndexToFirstBirthdays[birthdayMonth - 1].push(birthday)
				this.contactElementIdToFirstBirthday.set(getElementId(contact), birthday)
			}
		}

		const sortBirthdays = (a: BirthdayEventWrapper, b: BirthdayEventWrapper) => a.yyyymmdd - b.yyyymmdd
		for (let i = 0; i < 12; ++i) {
			this.monthIndexToFirstBirthdays[i].sort(sortBirthdays)
		}

		const eventMap = this.daysToEvents()
		let updatedEventMap = false

		for (const loadedMonthStartTimestamp of this.loadedMonths.keys()) {
			updatedEventMap ||= this.addBirthdayEventsInMonthToEventMap(eventMap, new Date(loadedMonthStartTimestamp))
		}

		if (updatedEventMap) {
			// Notify observers that the map is updated
			this.daysToEvents(eventMap)
		}
	}

	private addBirthdayEventsInMonthToEventMap(eventMap: Map<number, EventWrapper[]>, loadedMonthStartDate: Date): boolean {
		let updatedEventMap: boolean = false

		const loadedYear = loadedMonthStartDate.getFullYear()
		const loadedMonthIndex = loadedMonthStartDate.getMonth()
		const loadedMonth = loadedMonthIndex + 1

		const birthdaysInMonth = this.monthIndexToFirstBirthdays[loadedMonthIndex]
		for (const firstBirthday of birthdaysInMonth) {
			let yyyymmdd = firstBirthday.yyyymmdd
			const birthdayYear = Math.floor(yyyymmdd / 10000)
			yyyymmdd -= birthdayYear * 10000
			const birthdayMonth = Math.floor(yyyymmdd / 100)
			yyyymmdd -= birthdayMonth * 100
			const birthdayDay = yyyymmdd
			if (birthdayMonth !== loadedMonth) {
				throw new ProgrammingError(`${TAG} Birthday month and loaded month mismatch!`)
			}

			let age = loadedYear - birthdayYear
			if (age < 0) {
				continue
			}

			let birthdayReoccurrence: BirthdayEventWrapper
			if (loadedYear === birthdayYear) {
				birthdayReoccurrence = firstBirthday
			} else {
				birthdayReoccurrence = {
					yyyymmdd: loadedYear * 10000 + birthdayMonth * 100 + birthdayDay,
					event: firstBirthday.event,
					nextBirthdayReoccurrence: firstBirthday.nextBirthdayReoccurrence,
				}
				firstBirthday.nextBirthdayReoccurrence = birthdayReoccurrence
			}

			const eventMapKey = new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime()
			let eventsOnDay = eventMap.get(eventMapKey)
			if (!eventsOnDay) {
				eventsOnDay = []
				eventMap.set(eventMapKey, eventsOnDay)
			}

			let summary = firstBirthday.event.summary
			if (birthdayYear && age > 0) {
				summary += ` (${this.calendarModel.getAgeString(age)})`
			}

			eventsOnDay.push({
				event: {
					...firstBirthday.event,
					summary,
					startTime: new Date(Date.UTC(loadedYear, birthdayMonth - 1, birthdayDay)),
					endTime: new Date(Date.UTC(loadedYear, birthdayMonth - 1, birthdayDay + 1)),
				},
				color: this.logins.getUserController().userSettingsGroupRoot.birthdayCalendarColor ?? DEFAULT_BIRTHDAY_CALENDAR_COLOR,
				flags: {
					isBirthdayEvent: true,
					isAlteredInstance: false,
					hasAlarms: false,
				},
			})
			updatedEventMap = true
		}

		return updatedEventMap
	}

	private createBirthdayForContact(contact: Contact, userId: Id) {
		const birthday = this.tryCreateBirthdayEventWrapperElseNull(contact, userId)
		if (birthday) {
			let yyyymmdd = birthday.yyyymmdd
			const birthdayYear = Math.floor(yyyymmdd / 10000)
			yyyymmdd -= birthdayYear * 10000
			const birthdayMonth = Math.floor(yyyymmdd / 100)
			yyyymmdd -= birthdayMonth * 100
			const birthdayDay = yyyymmdd

			const birthdaysInSameMonth = this.monthIndexToFirstBirthdays[birthdayMonth - 1]
			let insertIndex = 0
			for (; insertIndex < birthdaysInSameMonth.length; ++insertIndex) {
				if (birthday.yyyymmdd >= birthdaysInSameMonth[insertIndex].yyyymmdd) {
					break
				}
			}
			birthdaysInSameMonth.splice(insertIndex, 0, birthday)
			this.contactElementIdToFirstBirthday.set(getElementId(contact), birthday)

			const eventMap = this.daysToEvents()
			let updatedEventMap = false

			for (const loadedMonthStartTimestamp of this.loadedMonths.keys()) {
				const loadedMonthStartDate = new Date(loadedMonthStartTimestamp)
				const loadedYear = loadedMonthStartDate.getFullYear()

				let age = loadedYear - birthdayYear
				if (age < 0) {
					continue
				}

				let birthdayReoccurrence: BirthdayEventWrapper
				if (loadedYear === birthdayYear) {
					birthdayReoccurrence = birthday
				} else {
					birthdayReoccurrence = {
						yyyymmdd: loadedYear * 10000 + birthdayMonth * 100 + birthdayDay,
						event: birthday.event,
						nextBirthdayReoccurrence: birthday.nextBirthdayReoccurrence,
					}
					birthday.nextBirthdayReoccurrence = birthdayReoccurrence
				}

				const eventMapKey = new Date(loadedYear, birthdayMonth - 1, birthdayDay).getTime()
				let eventsOnDay = eventMap.get(eventMapKey)
				if (!eventsOnDay) {
					eventsOnDay = []
					eventMap.set(eventMapKey, eventsOnDay)
				}

				let summary = birthday.event.summary
				if (birthdayYear && age > 0) {
					summary += ` (${this.calendarModel.getAgeString(age)})`
				}

				eventsOnDay.push({
					event: {
						...birthday.event,
						summary,
						startTime: new Date(Date.UTC(loadedYear, birthdayMonth - 1, birthdayDay)),
						endTime: new Date(Date.UTC(loadedYear, birthdayMonth - 1, birthdayDay + 1)),
					},
					color: this.logins.getUserController().userSettingsGroupRoot.birthdayCalendarColor ?? DEFAULT_BIRTHDAY_CALENDAR_COLOR,
					flags: {
						isBirthdayEvent: true,
						isAlteredInstance: false,
						hasAlarms: false,
					},
				})
				updatedEventMap = true
			}

			if (updatedEventMap) {
				// Notify observers that the map is updated
				this.daysToEvents(eventMap)
			}
		}
	}

	private removeBirthdaysForContact(contactId: IdTuple) {
		let birthday: BirthdayEventWrapper | undefined | null = this.contactElementIdToFirstBirthday.get(contactId[1])
		if (birthday) {
			const birthdayMonth = Math.floor(birthday.yyyymmdd / 100) % 100
			const birthdaysInSameMonth = this.monthIndexToFirstBirthdays[birthdayMonth - 1]
			const removeIndex = birthdaysInSameMonth.indexOf(birthday)
			if (removeIndex === -1) {
				console.warn(`${TAG} Birthday not found in array for month!`)
			} else {
				birthdaysInSameMonth.splice(removeIndex, 1)
			}

			const eventMap = this.daysToEvents()
			let updatedEventMap = false

			const encodedContactId = stringToBase64(contactId.join("/"))

			while (birthday) {
				let yyyymmdd = birthday.yyyymmdd
				const year = Math.floor(yyyymmdd / 10000)
				yyyymmdd -= year * 10000
				const month = Math.floor(yyyymmdd / 100)
				yyyymmdd -= month * 100
				const day = yyyymmdd

				if (year) {
					const eventMapKey = new Date(year, month - 1, day).getTime()
					const eventsOnDay = eventMap.get(eventMapKey)
					if (eventsOnDay) {
						let destinationIndex = 0
						for (let sourceIndex = 0; sourceIndex < eventsOnDay.length; ++sourceIndex) {
							const eventWrapper = eventsOnDay[sourceIndex]
							if (!eventWrapper.event._id[1].includes(encodedContactId)) {
								eventsOnDay[destinationIndex] = eventsOnDay[sourceIndex]
								++destinationIndex
							}
						}
						if (destinationIndex < eventsOnDay.length - 1) {
							console.warn(`${TAG} Found duplicate birthday events in the eventMap when removing a birthday on day ${birthday.yyyymmdd}!`)
						} else if (destinationIndex === eventsOnDay.length) {
							console.warn(`${TAG} Did not find expected birthday event to be removed in eventMap on day ${birthday.yyyymmdd}!`)
						}
						eventsOnDay.length = destinationIndex
					}
				}

				birthday = birthday.nextBirthdayReoccurrence
			}

			if (updatedEventMap) {
				// Notify observers that the map is updated
				this.daysToEvents(eventMap)
			}
		}
	}

	private updateBirthdayForContact(contact: Contact, userId: Id) {
		this.removeBirthdaysForContact(contact._id)
		this.createBirthdayForContact(contact, userId)
	}
}
