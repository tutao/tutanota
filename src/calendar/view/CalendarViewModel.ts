import {
	$Promisable,
	assertNotNull,
	clone,
	DAY_IN_MILLIS,
	findAllAndRemove,
	findAndRemove,
	freezeMap,
	getStartOfDay,
	groupBy,
	groupByAndMapUniquely,
	LazyLoaded,
	neverNull,
	promiseMap,
	symmetricDifference,
} from "@tutao/tutanota-utils"
import { CalendarEvent, CalendarEventTypeRef, UserSettingsGroupRootTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { getWeekStart, GroupType, OperationType, WeekStart } from "../../api/common/TutanotaConstants"
import { NotAuthorizedError, NotFoundError } from "../../api/common/error/RestError"
import { getElementId, getListId, isSameId, listIdPart } from "../../api/common/utils/EntityUtils"
import { LoginController } from "../../api/main/LoginController"
import { IProgressMonitor, NoopProgressMonitor } from "../../api/common/utils/ProgressMonitor"
import type { ReceivedGroupInvitation } from "../../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, UserTypeRef } from "../../api/entities/sys/TypeRefs.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { CalendarTimeRange } from "../date/CalendarUtils"
import {
	addDaysForEventInstance,
	addDaysForRecurringEvent,
	getDiffIn60mIntervals,
	getEventStart,
	getMonthRange,
	isEventBetweenDays,
	isSameEventInstance,
} from "../date/CalendarUtils"
import { DateTime } from "luxon"
import { geEventElementMaxId, getEventElementMinId, isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils"
import {
	areRepeatRulesEqual,
	CalendarEventModel,
	CalendarOperation,
	EventSaveResult,
	getNonOrganizerAttendees,
} from "../date/eventeditor/CalendarEventModel.js"
import { askIfShouldSendCalendarUpdatesToAttendees } from "./CalendarGuiUtils"
import { ReceivedGroupInvitationsModel } from "../../sharing/model/ReceivedGroupInvitationsModel"
import type { CalendarInfo, CalendarModel } from "../model/CalendarModel"
import type { EntityUpdateData } from "../../api/main/EventController"
import { EventController, isUpdateForTypeRef } from "../../api/main/EventController"
import { EntityClient } from "../../api/common/EntityClient"
import { ProgressTracker } from "../../api/main/ProgressTracker"
import { DeviceConfig } from "../../misc/DeviceConfig"
import type { EventDragHandlerCallbacks } from "./EventDragHandler"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"

export type EventsOnDays = {
	days: Array<Date>
	shortEvents: Array<Array<CalendarEvent>>
	longEvents: Array<CalendarEvent>
}

/** container to for the information needed to render & handle a reschedule with drag-and-drop */
export type DraggedEvent = {
	/** the event instance the user grabbed with the mouse */
	originalEvent: CalendarEvent
	/** the temporary event that's shown during the drag */
	eventClone: CalendarEvent
}

export type MouseOrPointerEvent = MouseEvent | PointerEvent
export type CalendarEventBubbleClickHandler = (arg0: CalendarEvent, arg1: MouseOrPointerEvent) => unknown
type EventsForDays = Map<number, Array<CalendarEvent>>
export const LIMIT_PAST_EVENTS_YEARS = 100
export type CalendarEventEditModelsFactory = (mode: CalendarOperation, event: CalendarEvent) => Promise<CalendarEventModel | null>

export class CalendarViewModel implements EventDragHandlerCallbacks {
	// Should not be changed directly but only through the URL
	readonly selectedDate: Stream<Date>

	/** Mmap from group/groupRoot ID to the calendar info */
	_calendarInfos: LazyLoaded<ReadonlyMap<Id, CalendarInfo>>
	_eventsForDays: EventsForDays
	readonly _loadedMonths: Set<number> // first ms of the month

	_hiddenCalendars: Set<Id>
	readonly _calendarInvitations: ReceivedGroupInvitationsModel<GroupType.Calendar>
	readonly _calendarModel: CalendarModel
	readonly _entityClient: EntityClient
	// Events that have been dropped but still need to be rendered as temporary while waiting for entity updates.
	readonly _transientEvents: Array<CalendarEvent>
	_draggedEvent: DraggedEvent | null
	readonly _redrawStream: Stream<void>
	readonly _deviceConfig: DeviceConfig

	constructor(
		private readonly logins: LoginController,
		private readonly createCalendarEventEditModel: CalendarEventEditModelsFactory,
		calendarModel: CalendarModel,
		entityClient: EntityClient,
		eventController: EventController,
		progressTracker: ProgressTracker,
		deviceConfig: DeviceConfig,
		calendarInvitations: ReceivedGroupInvitationsModel<GroupType.Calendar>,
		private readonly timeZone: string,
	) {
		this._calendarModel = calendarModel
		this._entityClient = entityClient
		this._transientEvents = []

		const userId = logins.getUserController().user._id

		this._loadedMonths = new Set()
		this._eventsForDays = freezeMap(new Map())
		this._deviceConfig = deviceConfig
		this._hiddenCalendars = new Set(this._deviceConfig.getHiddenCalendars(userId))
		this.selectedDate = stream(getStartOfDay(new Date()))
		this._redrawStream = stream()
		this._draggedEvent = null
		this._calendarInvitations = calendarInvitations
		// load all calendars. if there is no calendar yet, create one
		// we load three instances per calendar / CalendarGroupRoot / GroupInfo / Group + 3
		// for each calendar we load short events for three months +3
		const workPerCalendar = 3 + 3
		const totalWork = logins.getUserController().getCalendarMemberships().length * workPerCalendar
		const monitorHandle = progressTracker.registerMonitorSync(totalWork)
		let progressMonitor: IProgressMonitor = neverNull(progressTracker.getMonitor(monitorHandle))
		this._calendarInfos = new LazyLoaded(() =>
			this._calendarModel.loadOrCreateCalendarInfo(progressMonitor).then((it) => {
				this._redraw()

				return it
			}),
		).load()
		this.selectedDate.map((d) => {
			const thisMonthStart = getMonthRange(d, this.timeZone).start
			const previousMonthDate = new Date(thisMonthStart)
			previousMonthDate.setMonth(new Date(thisMonthStart).getMonth() - 1)
			const nextMonthDate = new Date(thisMonthStart)
			nextMonthDate.setMonth(new Date(thisMonthStart).getMonth() + 1)

			this._loadMonthIfNeeded(new Date(thisMonthStart))
				.then(() => progressMonitor.workDone(1))
				.then(() => this._loadMonthIfNeeded(nextMonthDate))
				.then(() => progressMonitor.workDone(1))
				.then(() => this._loadMonthIfNeeded(previousMonthDate))
				.finally(() => {
					progressMonitor.completed()
					// We don't want to report progress after initial month, it shows completed progress bar for a second every time the
					// month is switched. Doesn't make sense to report more than 100% completion anyway.
					progressMonitor = new NoopProgressMonitor()
				})
		})
		eventController.addEntityListener((updates, eventOwnerGroupId) => {
			return this._entityEventReceived(updates, eventOwnerGroupId)
		})

		calendarInvitations.init()
	}

	get calendarInvitations(): Stream<Array<ReceivedGroupInvitation>> {
		return this._calendarInvitations.invitations
	}

	get calendarInfos(): LazyLoaded<ReadonlyMap<Id, CalendarInfo>> {
		return this._calendarInfos
	}

	get hiddenCalendars(): ReadonlySet<Id> {
		return this._hiddenCalendars
	}

	get eventsForDays(): EventsForDays {
		return this._eventsForDays
	}

	get redraw(): Stream<void> {
		return this._redrawStream
	}

	get weekStart(): WeekStart {
		return getWeekStart(this.logins.getUserController().userSettingsGroupRoot)
	}

	onDragStart(originalEvent: CalendarEvent, timeToMoveBy: number) {
		let eventClone = clone(originalEvent)
		updateTemporaryEventWithDiff(eventClone, originalEvent, timeToMoveBy)
		this._draggedEvent = {
			originalEvent,
			eventClone,
		}
	}

	onDragUpdate(timeToMoveBy: number) {
		if (this._draggedEvent) {
			updateTemporaryEventWithDiff(this._draggedEvent.eventClone, this._draggedEvent.originalEvent, timeToMoveBy)
		}
	}

	/**
	 * This is called when the event is dropped.
	 */
	async onDragEnd(timeToMoveBy: number, mode: CalendarOperation | null): Promise<void> {
		//if the time of the dragged event is the same as of the original we only cancel the drag
		if (timeToMoveBy !== 0 && mode != null) {
			if (this._draggedEvent == null) return

			const { originalEvent, eventClone } = this._draggedEvent
			this._draggedEvent = null
			updateTemporaryEventWithDiff(eventClone, originalEvent, timeToMoveBy)

			this._addTransientEvent(eventClone)

			try {
				const didUpdate = await this.moveEvent(originalEvent, timeToMoveBy, mode)

				if (didUpdate !== EventSaveResult.Saved) {
					this._removeTransientEvent(eventClone)
				}
			} catch (e) {
				this._removeTransientEvent(eventClone)

				throw e
			}
		} else {
			this._draggedEvent = null
		}
	}

	get temporaryEvents(): Array<CalendarEvent> {
		return this._transientEvents.concat(this._draggedEvent ? [this._draggedEvent.eventClone] : [])
	}

	setHiddenCalendars(newHiddenCalendars: Set<Id>) {
		this._hiddenCalendars = newHiddenCalendars

		this._deviceConfig.setHiddenCalendars(this.logins.getUserController().user._id, [...newHiddenCalendars])
	}

	/**
	 * Get calendar infos, creating a new calendar info if none exist
	 * Not async because we want to return the result directly if it is available when called
	 * otherwise we return a promise
	 */
	getCalendarInfosCreateIfNeeded(): $Promisable<ReadonlyMap<Id, CalendarInfo>> {
		if (this._calendarInfos.isLoaded() && this.calendarInfos.getLoaded().size > 0) {
			return this._calendarInfos.getLoaded()
		}

		return Promise.resolve().then(async () => {
			const calendars = await this._calendarInfos.getAsync()

			if (calendars.size > 0) {
				return calendars
			} else {
				await this._calendarModel.createCalendar("", null)
				this._calendarInfos = new LazyLoaded(() => this._calendarModel.loadCalendarInfos(new NoopProgressMonitor()))
				return this._calendarInfos.getAsync()
			}
		})
	}

	/**
	 * Given an event and days, return the long and short events of that range of days
	 * we detect events that should be removed based on their UID + start and end time
	 *
	 * @param days: The range of days from which events should be returned
	 * @returns    shortEvents: Array<Array<CalendarEvent>>, short events per day
	 *             longEvents: Array<CalendarEvent>: long events over the whole range,
	 *             days: Array<Date>: the original days that were passed in
	 */
	getEventsOnDaysToRender(days: Array<Date>): EventsOnDays {
		// addDaysForRecurringEvents produces some weeks that have non-referentially-identical objects for the same event instance (occurrence)
		// in particular, this happens for the weeks straddling a month border because each month adds a different clone of the occurrence to its part of the week
		// this means we can't use a set to deduplicate these.

		/** A map from event id and start time to the event instance. It is not enough to just use an id because different occurrences will have the same id. */
		const longEvents: Map<string, CalendarEvent> = new Map()
		let shortEvents: Array<Array<CalendarEvent>> = []
		// It might be the case that a UID is shared by events across calendars, so we need to differentiate them by list ID aswell
		const transientEventUidsByCalendar = groupByAndMapUniquely(
			this._transientEvents,
			(event) => getListId(event),
			(event) => event.uid,
		)

		const sortEvent = (event: CalendarEvent, shortEventsForDay: Array<CalendarEvent>) => {
			if (isAllDayEvent(event) || getDiffIn60mIntervals(event.startTime, event.endTime) >= 24) {
				longEvents.set(getElementId(event) + event.startTime.toString(), event)
			} else {
				shortEventsForDay.push(event)
			}
		}

		for (const day of days) {
			const shortEventsForDay: CalendarEvent[] = []
			const eventsForDay = this._eventsForDays.get(day.getTime()) || []

			for (const event of eventsForDay) {
				if (transientEventUidsByCalendar.get(getListId(event))?.has(event.uid)) {
					continue
				}

				if (
					this._draggedEvent?.originalEvent !== event &&
					!this._hiddenCalendars.has(assertNotNull(event._ownerGroup, "event without ownerGroup in getEventsOnDays"))
				) {
					// this is not the dragged event (not rendered) and does not belong to a hidden calendar, so we should render it.
					sortEvent(event, shortEventsForDay)
				}
			}

			for (const event of this._transientEvents) {
				if (isEventBetweenDays(event, day, day, this.timeZone)) {
					sortEvent(event, shortEventsForDay)
				}
			}

			const temporaryEvent = this._draggedEvent?.eventClone

			if (temporaryEvent && isEventBetweenDays(temporaryEvent, day, day, this.timeZone)) {
				console.log("add temp", day, temporaryEvent)
				sortEvent(temporaryEvent, shortEventsForDay)
			}

			shortEvents.push(shortEventsForDay)
		}

		const longEventsArray = Array.from(longEvents.values())
		return {
			days,
			longEvents: longEventsArray,
			shortEvents: shortEvents,
		}
	}

	async deleteCalendar(calendar: CalendarInfo): Promise<void> {
		await this._calendarModel.deleteCalendar(calendar)
	}

	_addTransientEvent(event: CalendarEvent) {
		this._transientEvents.push(event)
	}

	_removeTransientEvent(event: CalendarEvent) {
		findAndRemove(this._transientEvents, (transient) => transient.uid === event.uid)
	}

	/**
	 * move an event to a new start time
	 * @param event the actually dragged event (may be a repeated instance)
	 * @param diff the amount of milliseconds to shift the event by
	 * @param mode which parts of the series should be rescheduled?
	 */
	private async moveEvent(event: CalendarEvent, diff: number, mode: CalendarOperation): Promise<EventSaveResult> {
		if (event.uid == null) {
			throw new ProgrammingError("called moveEvent for an event without uid")
		}

		const editModel = await this.createCalendarEventEditModel(mode, event)
		if (editModel == null) {
			return EventSaveResult.Failed
		}
		editModel.editModels.whenModel.rescheduleEvent({ millisecond: diff })

		if (getNonOrganizerAttendees(event).length > 0) {
			const response = await askIfShouldSendCalendarUpdatesToAttendees()
			if (response === "yes") {
				editModel.editModels.whoModel.shouldSendUpdates = true
			} else if (response === "cancel") {
				return EventSaveResult.Failed
			}
		}

		// Errors are handled in the individual views
		return await editModel.apply()
	}

	_addOrUpdateEvent(calendarInfo: CalendarInfo | null, event: CalendarEvent) {
		if (calendarInfo == null) {
			return
		}
		const eventListId = getListId(event)
		const eventMonth = getMonthRange(getEventStart(event, this.timeZone), this.timeZone)
		if (isSameId(calendarInfo.groupRoot.shortEvents, eventListId) && this._loadedMonths.has(eventMonth.start)) {
			// If the month is not loaded, we don't want to put it into events.
			// We will put it there when we load the month
			this._addDaysForEvent(event, eventMonth)
		} else if (isSameId(calendarInfo.groupRoot.longEvents, eventListId)) {
			const loadedLongEvents = calendarInfo.longEvents.getLoaded()
			this._removeExistingEvent(loadedLongEvents, event)

			loadedLongEvents.push(event)

			for (const firstDayTimestamp of this._loadedMonths) {
				const loadedMonth = getMonthRange(new Date(firstDayTimestamp), this.timeZone)

				if (event.repeatRule != null) {
					this._addDaysForRecurringEvent(event, loadedMonth)
				} else {
					this._addDaysForEvent(event, loadedMonth)
				}
			}
		}
	}

	_entityEventReceived<T>(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		return this._calendarInfos.getAsync().then((calendarInfos) => {
			const addedOrUpdatedEventsUpdates: EntityUpdateData[] = [] // we try to make get multiple requests for calendar events potentially created by post multiple

			return promiseMap(updates, (update) => {
				if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
					this._redraw()
				}

				if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
					if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
						addedOrUpdatedEventsUpdates.push(update)
					} else if (update.operation === OperationType.DELETE) {
						this._removeDaysForEvent([update.instanceListId, update.instanceId], eventOwnerGroupId)

						this._redraw()
					}
				} else if (
					isUpdateForTypeRef(UserTypeRef, update) && // only process update event received for the user group - to not process user update from admin membership.
					isSameId(eventOwnerGroupId, this.logins.getUserController().user.userGroup.group)
				) {
					if (update.operation === OperationType.UPDATE) {
						const calendarMemberships = this.logins.getUserController().getCalendarMemberships()
						return this._calendarInfos.getAsync().then((calendarInfos) => {
							// Remove calendars we no longer have membership in
							calendarInfos.forEach((ci, group) => {
								if (calendarMemberships.every((mb) => group !== mb.group)) {
									this._hiddenCalendars.delete(group)
								}
							})
							const oldGroupIds = new Set(calendarInfos.keys())
							const newGroupIds = new Set(calendarMemberships.map((m) => m.group))
							const diff = symmetricDifference(oldGroupIds, newGroupIds)

							if (diff.size !== 0) {
								this._loadedMonths.clear()

								this._replaceEvents(new Map())

								this._calendarInfos = new LazyLoaded(() => this._calendarModel.loadCalendarInfos(new NoopProgressMonitor())).load()
								return this._calendarInfos
									.getAsync()
									.then(() => {
										const selectedDate = this.selectedDate()
										const previousMonthDate = new Date(selectedDate)
										previousMonthDate.setMonth(selectedDate.getMonth() - 1)
										const nextMonthDate = new Date(selectedDate)
										nextMonthDate.setMonth(selectedDate.getMonth() + 1)
										return this._loadMonthIfNeeded(selectedDate)
											.then(() => this._loadMonthIfNeeded(nextMonthDate))
											.then(() => this._loadMonthIfNeeded(previousMonthDate))
									})
									.then(() => this._redraw())
							}
						})
					}
				} else if (isUpdateForTypeRef(GroupInfoTypeRef, update)) {
					this._calendarInfos.getAsync().then((calendarInfos) => {
						const calendarInfo = calendarInfos.get(eventOwnerGroupId)

						//only process the GroupInfo update if the id is the same as calendarInfo.groupInfo._id
						if (calendarInfo && isSameId(calendarInfo.groupInfo._id, [update.instanceListId, update.instanceId])) {
							return this._entityClient.load(GroupInfoTypeRef, [update.instanceListId, update.instanceId]).then((groupInfo) => {
								calendarInfo.groupInfo = groupInfo
								this._redraw()
							})
						}
					})
				}
			}).then(async () => {
				// handle potential post multiple updates in get multiple requests
				// this is only necessary until post multiple updates are dealt with in EntityRestCache
				const updatesPerList = groupBy(addedOrUpdatedEventsUpdates, (update) => update.instanceListId)
				for (const [instanceListId, updates] of updatesPerList) {
					const ids = updates.map((update) => update.instanceId)
					try {
						const events = await this._entityClient.loadMultiple(CalendarEventTypeRef, instanceListId, ids)
						for (const event of events) {
							this._addOrUpdateEvent(calendarInfos.get(neverNull(event._ownerGroup)) ?? null, event)
							this._removeTransientEvent(event)
						}
						this._redraw()
					} catch (e) {
						if (e instanceof NotAuthorizedError) {
							// return updates that are not in cache Range if NotAuthorizedError (for those updates that are in cache range)
							console.log("NotAuthorizedError for event in entityEventsReceived of view", e)
						} else if (e instanceof NotFoundError) {
							console.log("Not found event in entityEventsReceived of view", e)
						} else {
							throw e
						}
					}
				}
			})
		})
	}

	async _loadMonthIfNeeded(dayInMonth: Date): Promise<void> {
		const month = getMonthRange(dayInMonth, this.timeZone)

		if (!this._loadedMonths.has(month.start)) {
			this._loadedMonths.add(month.start)

			try {
				await this._loadEvents(month)
			} catch (e) {
				this._loadedMonths.delete(month.start)

				throw e
			} finally {
				this._redraw()
			}
		}
	}

	async _loadEvents(month: CalendarTimeRange): Promise<any> {
		const calendarInfos = await this._calendarInfos.getAsync()

		// Because of the timezones and all day events, we might not load an event which we need to display.
		// So we add a margin on 24 hours to be sure we load everything we need. We will filter matching
		// events anyway.
		const startId = getEventElementMinId(month.start - DAY_IN_MILLIS)
		const endId = geEventElementMaxId(month.end + DAY_IN_MILLIS)
		// We collect events from all calendars together and then replace map synchronously.
		// This is important to replace the map synchronously to not get race conditions because we load different months in parallel.
		// We could replace map more often instead of aggregating events but this would mean creating even more (cals * months) maps.
		//
		// Note: there may be issues if we get entity update before other calendars finish loading but the chance is low and we do not
		// take care of this now.
		const aggregateEvents: CalendarEvent[] = []
		for (const calendarInfo of calendarInfos.values()) {
			const { groupRoot, longEvents } = calendarInfo
			const [shortEventsResult, longEventsResult] = await Promise.all([
				this._entityClient.loadReverseRangeBetween(CalendarEventTypeRef, groupRoot.shortEvents, endId, startId, 200),
				longEvents.getAsync(),
			])
			aggregateEvents.push(...shortEventsResult.elements, ...longEventsResult)
		}
		const newEvents = this._cloneEvents()
		for (const e of aggregateEvents) {
			const zone = this.timeZone
			if (e.repeatRule) {
				addDaysForRecurringEvent(newEvents, e, month, zone)
			} else {
				addDaysForEventInstance(newEvents, e, month, zone)
			}
		}
		this._replaceEvents(newEvents)
	}

	/**
	 * Removes {@param eventToRemove} from {@param events} using isSameEvent()
	 * also removes it from {@code this._eventsForDays} if end time does not match
	 */
	_removeExistingEvent(events: Array<CalendarEvent>, eventToRemove: CalendarEvent) {
		const indexOfOldEvent = events.findIndex((el) => isSameEventInstance(el, eventToRemove))

		if (indexOfOldEvent == -1) {
			return
		}
		const oldEvent = events[indexOfOldEvent]
		// in some cases, we need to remove all references to an event from the events map to make sure everything that needs to be removed is removed.
		// specifically, this is the case when there are now less days than before that the event occurs on:
		// * end time changed
		// * repeat rule gained exclusions
		// * repeat rule changed end condition or the interval
		// when the start time changes, the ID of the event is also changed, so it is not a problem - we'll completely re-create it and all references.
		if (oldEvent.endTime.getTime() !== eventToRemove.endTime.getTime() || !areRepeatRulesEqual(oldEvent.repeatRule, eventToRemove.repeatRule)) {
			const newMap = this._cloneEvents()

			newMap.forEach(
				(
					dayEvents, // finding all because event can overlap with itself so a day can have multiple occurrences of the same event in it
				) => findAllAndRemove(dayEvents, (e) => isSameId(e._id, oldEvent._id)),
			)

			this._replaceEvents(newMap)
		}

		events.splice(indexOfOldEvent, 1)
	}

	_addDaysForEvent(event: CalendarEvent, month: CalendarTimeRange) {
		const newMap = this._cloneEvents()
		addDaysForEventInstance(newMap, event, month, this.timeZone)
		this._replaceEvents(newMap)
	}

	_replaceEvents(newMap: EventsForDays) {
		this._eventsForDays = freezeMap(newMap)
	}

	_cloneEvents(): EventsForDays {
		return new Map(this._eventsForDays)
	}

	_addDaysForRecurringEvent(event: CalendarEvent, month: CalendarTimeRange) {
		if (-DateTime.fromJSDate(event.startTime).diffNow("year").years > LIMIT_PAST_EVENTS_YEARS) {
			console.log("repeating event is too far into the past", event)
			return
		}

		const newMap = this._cloneEvents()

		addDaysForRecurringEvent(newMap, event, month, this.timeZone)

		this._replaceEvents(newMap)
	}

	_removeDaysForEvent(id: IdTuple, ownerGroupId: Id) {
		const newMap = this._cloneEvents()

		newMap.forEach((dayEvents) => findAllAndRemove(dayEvents, (e) => isSameId(e._id, id)))

		this._replaceEvents(newMap)

		if (this._calendarInfos.isLoaded()) {
			const infos = this._calendarInfos.getLoaded()

			const info = infos.get(ownerGroupId)

			if (info) {
				if (isSameId(listIdPart(id), info.groupRoot.longEvents)) {
					findAndRemove(info.longEvents.getLoaded(), (e) => isSameId(e._id, id))
				}
			}
		}
	}

	_redraw() {
		// Need to pass some argument to make it a "set" operation
		this._redrawStream(undefined)
	}
}

function updateTemporaryEventWithDiff(eventClone: CalendarEvent, originalEvent: CalendarEvent, mouseDiff: number) {
	eventClone.startTime = new Date(originalEvent.startTime.getTime() + mouseDiff)
	eventClone.endTime = new Date(originalEvent.endTime.getTime() + mouseDiff)
}
