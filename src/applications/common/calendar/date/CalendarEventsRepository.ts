import Stream from "mithril/stream"
import stream from "mithril/stream"
import { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel.js"
import { addDaysForRecurringEvent, CalendarTimeRange, getEventEnd, getEventStart, getMonthRange, isBirthdayCalendar, isLongEvent } from "./CalendarUtils.js"
import { getListId, idToElementId, isSameId, isSameSingleId, listIdPart, OperationType } from "@tutao/meta"
import { DateTime } from "luxon"
import { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { EntityClient } from "../../../../platform-kit/network/EntityClient.js"
import { deepEqual, findAllAndRemove, isNotEmpty } from "@tutao/utils"
import { DEFAULT_CALENDAR_COLOR } from "@tutao/app-env"
import { NotAuthorizedError, NotFoundError } from "@tutao/rest-client/error"
import { EventController } from "../../api/main/EventController.js"

import { LoginController } from "../../api/main/LoginController.js"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"
import { ProgressMonitorInterface } from "../../../../platform-kit/network/ProgressMonitorInterface"
import { CalendarEvent, CalendarEventTypeRef, UserSettingsGroupRoot, UserSettingsGroupRootTypeRef } from "@tutao/entities/tutanota"
import { EntityUpdateData, isUpdateForTypeRef, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

const LIMIT_PAST_EVENTS_YEARS = 100

const TAG = "[CalendarEventRepository]"

/** Map from timestamp of beginnings of days to events that occur on those days. */
export type DaysToEvents = ReadonlyMap<number, ReadonlyArray<EventWrapper>>

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

	constructor(
		private readonly calendarModel: CalendarModel,
		private readonly calendarFacade: CalendarFacade,
		private readonly zone: string,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
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
					this.replaceEvents(eventsMap)
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
		const newDayToEventsMap = new Map<number, ReadonlyArray<EventWrapper>>()
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
}
