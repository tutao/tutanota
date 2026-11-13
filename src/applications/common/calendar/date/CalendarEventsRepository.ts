import Stream from "mithril/stream"
import stream from "mithril/stream"
import { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel.js"
import {
	addDaysForEventInstance,
	addDaysForRecurringEvent,
	CalendarTimeRange,
	generateUid,
	getAllDayDatesFromBirthdayIso,
	isBirthdayCalendar,
	isLongEvent,
} from "./CalendarUtils.js"
import { getElementId, getListId, idToElementId, isSameId, isSameSingleId, ListElementId, listIdPart, OperationType } from "@tutao/meta"
import { DateTime } from "luxon"
import { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { EntityClient } from "../../../../platform-kit/network/EntityClient.js"
import { deepEqual, findAllAndRemove, isNotEmpty, stringToBase64 } from "@tutao/utils"
import { BIRTHDAY_CALENDAR_BASE_ID, DEFAULT_BIRTHDAY_CALENDAR_COLOR, DEFAULT_CALENDAR_COLOR } from "@tutao/app-env"
import { NotAuthorizedError, NotFoundError } from "@tutao/rest-client/error"
import { EventController } from "../../api/main/EventController.js"

import { generateLocalEventElementId, isAllDayEventByTimes } from "../../api/common/utils/CommonCalendarUtils.js"
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

/**
 * Loads and keeps calendar events up to date.
 *
 * If you need to load calendar events there's a good chance you should just use this
 */
export class CalendarEventsRepository {
	/** timestamps of the beginning of months that we already loaded */
	private daysToEvents: Stream<DaysToEvents> = stream(new Map())
	private pendingLoadRequest: Promise<void> = Promise.resolve()
	private calendarMemberships: string[]
	private monthYYYYMMToLoadedCalendarIds = new Map<number, string[]>()
	private birthdaysLoadedFromContacts = false
	private contactIdToBirthdayMonth = new Map<Id, number>()
	private monthToBirthdayEventProgenitors: [
		// This array is just a placeholder because there is no month with number 0
		CalendarEvent[],
		//
		CalendarEvent[],
		CalendarEvent[],
		CalendarEvent[],
		//
		CalendarEvent[],
		CalendarEvent[],
		CalendarEvent[],
		//
		CalendarEvent[],
		CalendarEvent[],
		CalendarEvent[],
		//
		CalendarEvent[],
		CalendarEvent[],
		CalendarEvent[],
	] = [[], [], [], [], [], [], [], [], [], [], [], [], []]

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
				this.monthYYYYMMToLoadedCalendarIds.clear()
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

	async forceLoadEventsAt(yearMonthPairs: [number, number][]): Promise<void> {
		for (const [year, month] of yearMonthPairs) {
			try {
				let calendarInfos = await this.calendarModel.getCalendarInfos()
				await this.loadMonth(year, month, calendarInfos)
			} catch (e) {
				this.monthYYYYMMToLoadedCalendarIds.delete(encodeYYYYMM(year, month))
				throw e
			}
		}
	}

	async loadMonthsIfNeeded(
		yearMonthPairs: [number, number][],
		canceled: AbortSignal,
		progressMonitor: ProgressMonitorInterface | null,
		calendarToLoad?: string,
		isForceReload: boolean = false,
	): Promise<void> {
		if (isForceReload) {
			this.pendingLoadRequest = Promise.resolve()
		}
		const promiseForThisLoadRequest = this.pendingLoadRequest.then(async () => {
			for (const [year, month] of yearMonthPairs) {
				if (canceled.aborted) return

				if (isForceReload) {
					let calendarInfos = await this.calendarModel.getCalendarInfos()
					await this.loadMonth(year, month, calendarInfos)
				} else if (!this.isCalendarLoadedForMonth(year, month, calendarToLoad)) {
					try {
						let calendarInfos = await this.calendarModel.getCalendarInfos()

						if (calendarToLoad != null) {
							const calendarToLoadInfo = calendarInfos.get(calendarToLoad)
							if (calendarToLoadInfo == null) {
								throw Error("Trying to load a calendar that doesn't exists")
							}

							calendarInfos = new Map<string, CalendarInfo>([[calendarToLoad, calendarToLoadInfo]])
						}

						await this.loadMonth(year, month, calendarInfos)
					} catch (e) {
						this.monthYYYYMMToLoadedCalendarIds.delete(year * 100 + month)
						throw e
					}
				}
				progressMonitor?.workDone(1)
			}
		})
		this.pendingLoadRequest = promiseForThisLoadRequest
		await promiseForThisLoadRequest
	}

	private addOrUpdateEvent(calendarInfo: CalendarInfo | null, eventWrapper: EventWrapper) {
		if (calendarInfo == null) {
			return
		}

		const eventListId = getListId(eventWrapper.event)
		const shouldGoIntoLongEventsList =
			isSameSingleId(calendarInfo.groupRoot.longEvents, eventListId) ||
			isLongEvent(eventWrapper.event, eventWrapper.event.repeatRule?.timeZone ?? this.zone)
		if (shouldGoIntoLongEventsList) {
			this.removeExistingEvent(eventWrapper.event)

			for (const yyyymm of this.monthYYYYMMToLoadedCalendarIds.keys()) {
				const [year, month] = decodeYYYYMM(yyyymm)
				const monthRange = getMonthRange(year, month)

				if (eventWrapper.event.repeatRule != null) {
					if (
						!isBirthdayCalendar(listIdPart(eventWrapper.event._id)) &&
						-DateTime.fromJSDate(eventWrapper.event.startTime).diffNow("year").years > LIMIT_PAST_EVENTS_YEARS
					) {
						console.log("repeating event is too far into the past", eventWrapper)
						return
					}

					const newMap = this.cloneEvents()

					addDaysForRecurringEvent(newMap, eventWrapper, monthRange, this.zone)

					this.daysToEvents(newMap)
				} else {
					this.addDaysForEvent(eventWrapper, monthRange)
				}
			}

			return
		}

		// to prevent unnecessary churn, we only add the event if we have the months it covers loaded.
		let startYear: number
		let startMonth: number
		let endYear: number
		let endMonth: number
		if (isAllDayEventByTimes(eventWrapper.event.startTime, eventWrapper.event.endTime)) {
			startYear = eventWrapper.event.startTime.getUTCFullYear()
			startMonth = eventWrapper.event.startTime.getUTCMonth() + 1

			const endJSDate = eventWrapper.event.endTime
			endJSDate.setUTCDate(endJSDate.getUTCDate() - 1)
			endYear = endJSDate.getUTCFullYear()
			endMonth = endJSDate.getUTCMonth() + 1
		} else {
			startYear = eventWrapper.event.startTime.getFullYear()
			startMonth = eventWrapper.event.startTime.getMonth() + 1
			endYear = eventWrapper.event.endTime.getFullYear()
			endMonth = eventWrapper.event.endTime.getMonth() + 1
		}

		if (this.isCalendarLoadedForMonth(startYear, startMonth, eventWrapper.event._ownerGroup)) {
			this.addDaysForEvent(eventWrapper, getMonthRange(startYear, startMonth))
		}
		// no short event covers more than two months, so this should cover everything.
		if ((startYear !== endYear || startMonth !== endMonth) && this.isCalendarLoadedForMonth(endYear, endMonth, eventWrapper.event._ownerGroup)) {
			this.addDaysForEvent(eventWrapper, getMonthRange(endYear, endMonth))
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

	private addDaysForEvent(event: EventWrapper, month: CalendarTimeRange) {
		const newMap = this.cloneEvents()
		addDaysForEventInstance(newMap, event, month, this.zone)
		this.daysToEvents(newMap)
	}

	private async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: string) {
		let calendarInfos: ReadonlyMap<Id, CalendarInfo> | null = null
		for (const update of updates) {
			if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
				if (!calendarInfos) {
					calendarInfos = await this.calendarModel.getCalendarInfos()
				}
				await this.handleCalendarEventUpdate(update, eventOwnerGroupId, calendarInfos)
			} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				// Possible accepting/leaving a shared calendar, check if memberships has changed
				await this.handleMembershipChanges()
			} else if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				await this.handleCalendarGroupSettingsUpdate(update)
			}
		}
	}

	private async handleCalendarGroupSettingsUpdate(update: EntityUpdateData) {
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
				this.addOrUpdateEvent(calendarInfos.get(eventOwnerGroupId) ?? null, wrapper)
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

			const yearMonthPairsToLoaded: [number, number][] = []
			for (const yyyymm of this.monthYYYYMMToLoadedCalendarIds.keys()) {
				yearMonthPairsToLoaded.push(decodeYYYYMM(yyyymm))
			}
			await Promise.all(
				newCalendars.map((calendar) => this.loadMonthsIfNeeded(yearMonthPairsToLoaded, new AbortController().signal, null, calendar.group)),
			)

			for (const calendar of removedCalendars) {
				this.removeEventForCalendar(calendar)
			}

			this.calendarMemberships = updatedMemberships.map((it) => it.group)
		}
	}

	private async loadMonth(year: number, month: number, calendarInfos: ReadonlyMap<string, CalendarInfo>) {
		const eventsMap = await this.calendarFacade.updateEventMap(getMonthRange(year, month), calendarInfos, this.daysToEvents(), this.zone)

		// Add birthday events for the month to the event map
		const birthdayEventsInMonth = this.monthToBirthdayEventProgenitors[month]
		for (const birthdayEvent of birthdayEventsInMonth) {
			const birthYear = birthdayEvent.startTime.getUTCFullYear()
			const birthdayMonth = birthdayEvent.startTime.getUTCMonth() + 1
			if (year >= birthYear) {
				this.addBirthdayOccurrenceToEventMap(year, birthdayMonth, birthdayEvent, eventsMap)
			}
		}

		// Mark the month as loaded
		const yyyymm = encodeYYYYMM(year, month)
		let loadedCalendarIds = this.monthYYYYMMToLoadedCalendarIds.get(yyyymm)
		let deduplicate
		if (loadedCalendarIds) {
			loadedCalendarIds.push(...calendarInfos.keys())
			deduplicate = true
		} else {
			loadedCalendarIds = [...calendarInfos.keys()]
			this.monthYYYYMMToLoadedCalendarIds.set(yyyymm, loadedCalendarIds)
		}
		// Sort and deduplicate loadedCalendarIds
		loadedCalendarIds.sort()
		if (deduplicate && loadedCalendarIds.length > 1) {
			let previousCalendarId = loadedCalendarIds[0]
			let destinationIndex = 0
			for (let sourceIndex = 1; sourceIndex < loadedCalendarIds.length; ++sourceIndex) {
				const calendarId = loadedCalendarIds[sourceIndex]
				if (calendarId !== previousCalendarId) {
					loadedCalendarIds[destinationIndex] = calendarId
					++destinationIndex
					previousCalendarId = calendarId
				}
			}
			loadedCalendarIds.length = destinationIndex
		}

		this.daysToEvents(eventsMap)
	}

	private isCalendarLoadedForMonth(year: number, month: number, calendarId: string | null | undefined): boolean {
		if (calendarId == null) {
			return false
		}

		const loadedCalendarIds = this.monthYYYYMMToLoadedCalendarIds.get(encodeYYYYMM(year, month))
		if (loadedCalendarIds) {
			return loadedCalendarIds.includes(calendarId)
		} else {
			return false
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

		const eventMap = this.daysToEvents()
		let updatedEventMap = false
		const userId = this.logins.getUserController().userId
		for (const contact of contacts) {
			if (this.createBirthdayForContact(contact, userId, eventMap)) {
				updatedEventMap = true
			}
		}
		if (updatedEventMap) {
			this.daysToEvents(eventMap)
		}
		this.birthdaysLoadedFromContacts = true
	}

	async handleContactEvent(operation: OperationType, id: IdTuple) {
		let updatedEventMap = false
		const eventMap = this.daysToEvents()

		if (operation === OperationType.CREATE) {
			const contact = await this.contactModel.loadContactFromId(id)
			updatedEventMap = this.createBirthdayForContact(contact, this.logins.getUserController().userId, eventMap)
		} else if (operation === OperationType.UPDATE) {
			const contact = await this.contactModel.loadContactFromId(id)
			updatedEventMap = this.removeBirthdaysForContact(id, eventMap)
			if (this.createBirthdayForContact(contact, this.logins.getUserController().userId, eventMap)) {
				updatedEventMap = true
			}
		} else if (operation === OperationType.DELETE) {
			updatedEventMap = this.removeBirthdaysForContact(id, eventMap)
		}

		if (updatedEventMap) {
			this.daysToEvents(eventMap)
		}

		console.info(`${TAG} Processed contact entity event, operation type`, operation, "for contact id", id)
	}

	private createBirthdayForContact(contact: Contact, userId: Id, eventMap: Map<number, EventWrapper[]>): boolean {
		if (!contact.birthdayIso) {
			return false
		}

		const { startDate, endDate } = getAllDayDatesFromBirthdayIso(contact.birthdayIso!, this.zone)
		const encodedContactId = stringToBase64(contact._id.join("/"))
		const calendarId = `${userId}#${BIRTHDAY_CALENDAR_BASE_ID}`
		const uid = generateUid(calendarId, Date.now())
		const summary = lang.get("birthdayEvent_title", {
			"{name}": contact.firstName,
		})
		const listElementId: ListElementId = [calendarId, `${generateLocalEventElementId(startDate.getTime(), contact._id.join("/"))}#${encodedContactId}`]

		const birthdayEventProgenitor = createCalendarEvent({
			sequence: "0",
			recurrenceId: null,
			sender: null,
			hashedUid: null,
			summary: summary,
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
		})
		birthdayEventProgenitor._id = listElementId
		birthdayEventProgenitor._ownerGroup = calendarId

		const birthYear = startDate.getUTCFullYear()
		const birthdayMonth = startDate.getUTCMonth() + 1

		this.contactIdToBirthdayMonth.set(getElementId(contact), birthdayMonth)
		this.monthToBirthdayEventProgenitors[birthdayMonth].push(birthdayEventProgenitor)

		let updatedEventMap = false
		for (const yyyymm of this.monthYYYYMMToLoadedCalendarIds.keys()) {
			const [year, month] = decodeYYYYMM(yyyymm)
			if (year >= birthYear && month === birthdayMonth) {
				if (this.addBirthdayOccurrenceToEventMap(year, birthdayMonth, birthdayEventProgenitor, eventMap)) {
					updatedEventMap = true
				}
			}
		}

		return updatedEventMap
	}

	private removeBirthdaysForContact(contactId: IdTuple, eventMap: Map<number, EventWrapper[]>): boolean {
		let birthdayMonth = this.contactIdToBirthdayMonth.get(contactId[1])
		if (!birthdayMonth) {
			return false
		}

		let updatedEventMap = false

		const encodedContactId = stringToBase64(contactId.join("/"))

		const birthdayEventsInMonth = this.monthToBirthdayEventProgenitors[birthdayMonth]
		let removedFromBirthdayEventsInMonth = false
		let destinationIndex = 0
		for (let sourceIndex = 0; sourceIndex < birthdayEventsInMonth.length; ++sourceIndex) {
			const event = birthdayEventsInMonth[sourceIndex]
			if (getElementId(event).includes(encodedContactId)) {
				birthdayEventsInMonth[destinationIndex] = event
				++destinationIndex
				removedFromBirthdayEventsInMonth = true

				const birthYear = event.startTime.getUTCFullYear()
				birthdayMonth = event.startTime.getUTCMonth() + 1
				const birthdayDay = event.startTime.getDate()
				for (const yyyymm of this.monthYYYYMMToLoadedCalendarIds.keys()) {
					const [year, month] = decodeYYYYMM(yyyymm)
					if (year >= birthYear && month === birthdayMonth) {
						const eventMapKey = getEventMapKey(year, birthdayMonth, birthdayDay)
						const eventsOnDay = eventMap.get(eventMapKey)
						if (eventsOnDay) {
							let removedEventFromEventsOnDay = false
							let destinationIndex = 0
							for (let sourceIndex = 0; sourceIndex < eventsOnDay.length; ++sourceIndex) {
								const eventWrapper = eventsOnDay[sourceIndex]
								if (getElementId(eventWrapper.event).includes(encodedContactId)) {
									if (removedEventFromEventsOnDay) {
										// If you see this warning, it's a bug: fix it
										console.warn(
											`${TAG} Duplicate birthday event "${eventWrapper.event.summary}" in eventMap on day ${year}-${birthdayMonth}-${birthdayDay} with key=${eventMapKey}`,
										)
									}
									removedEventFromEventsOnDay = true
								} else {
									eventsOnDay[destinationIndex] = eventWrapper
									++destinationIndex
								}
							}
							if (destinationIndex <= 0) {
								eventMap.delete(eventMapKey)
							} else {
								eventsOnDay.length = destinationIndex
							}
							updatedEventMap = removedEventFromEventsOnDay
						} else {
							// If you see this warning, it's a bug: fix it
							console.warn(
								`${TAG} Expected birthday occurrences for contact with id=${contactId[1]} on day ${year}-${birthdayMonth}-${birthdayDay}`,
							)
						}
					}
				}
			} else if (removedFromBirthdayEventsInMonth) {
				// If you see this warning, it's a bug: fix it
				console.warn(`${TAG} Duplicate birthday event "${event.summary}" in month=${birthdayMonth} in monthToFirstBirthdays`)
			} else {
				removedFromBirthdayEventsInMonth = true
			}
		}
		if (!removedFromBirthdayEventsInMonth) {
			// If you see this warning, it's a bug: fix it
			console.warn(`${TAG} Expected to find birthday event in month=${birthdayMonth} in monthToFirstBirthdays`)
		}
		birthdayEventsInMonth.length = destinationIndex

		return updatedEventMap
	}

	private addBirthdayOccurrenceToEventMap(
		year: number,
		month: number,
		birthdayEventProgenitor: CalendarEvent,
		eventMap: Map<number, EventWrapper[]>,
	): boolean {
		const birthYear = birthdayEventProgenitor.startTime.getUTCFullYear()
		const age = year - birthYear
		if (age < 0) {
			return false
		}
		const birthdayMonth = birthdayEventProgenitor.startTime.getUTCMonth() + 1
		if (birthdayMonth !== month) {
			// If you see this warning, it's a bug: fix it
			console.warn(`${TAG} Birthday month=${birthdayMonth} of "${birthdayEventProgenitor.summary}" does not match month=${month}!`)
			return false
		}
		const birthdayDay = birthdayEventProgenitor.startTime.getUTCDate()

		const eventMapKey = getEventMapKey(year, birthdayMonth, birthdayDay)
		let eventsOnDay = eventMap.get(eventMapKey)
		if (!eventsOnDay) {
			eventsOnDay = []
			eventMap.set(eventMapKey, eventsOnDay)
		}

		let event: CalendarEvent
		if (year === birthYear) {
			event = birthdayEventProgenitor
		} else {
			event = {
				...birthdayEventProgenitor,
				summary:
					birthYear && age > 0
						? `${birthdayEventProgenitor.summary} (${lang.get("birthdayEventAge_title", { "{age}": age })})`
						: birthdayEventProgenitor.summary,
				startTime: getAllDateUTCFromYearMonthDay(year, birthdayMonth, birthdayDay),
				endTime: getAllDateUTCFromYearMonthDay(year, birthdayMonth, birthdayDay + 1),
			}
		}

		// TODO: Insert maintaining events sort-order?
		eventsOnDay.push({
			event,
			color: this.logins.getUserController().userSettingsGroupRoot.birthdayCalendarColor ?? DEFAULT_BIRTHDAY_CALENDAR_COLOR,
			flags: {
				isBirthdayEvent: true,
				isAlteredInstance: false,
				hasAlarms: false,
			},
		})
		return true
	}
}

function getEventMapKey(year: number, month: number, day: number): number {
	const dayDate = new Date(0)
	// We use setFullYear instead of the Date constructor to avoid years 0-99 being converted to 1900-1999
	dayDate.setFullYear(year, month - 1, day)
	dayDate.setHours(0, 0, 0, 0)
	return dayDate.getTime()
}

function getMonthRange(year: number, month: number): CalendarTimeRange {
	const startDate = new Date(0)
	const endDate = new Date(0)
	// We use setUTCFullYear instead of the Date constructor to avoid years 0-99 being converted to 1900-1999
	startDate.setFullYear(year, month - 1, 1)
	endDate.setFullYear(year, month, 1)
	return {
		start: startDate.setHours(0, 0, 0, 0),
		end: endDate.setHours(0, 0, 0, 0),
	}
}

function getAllDateUTCFromYearMonthDay(year: number, month: number, day: number) {
	const date = new Date(0)
	// We use setUTCFullYear instead of the Date constructor to avoid years 0-99 being converted to 1900-1999
	date.setUTCFullYear(year, month - 1, day)
	return date
}

function encodeYYYYMM(year: number, month: number): number {
	return year * 100 + month
}

function decodeYYYYMM(yyyymm: number): [number, number] {
	return [Math.floor(yyyymm / 100), yyyymm % 100]
}
