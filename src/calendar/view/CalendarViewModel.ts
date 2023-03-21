import {
	$Promisable,
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
	noOp,
	ofClass,
	promiseMap,
	symmetricDifference,
} from "@tutao/tutanota-utils"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { CalendarEventTypeRef, UserSettingsGroupRootTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { OperationType, reverse } from "../../api/common/TutanotaConstants"
import { NotAuthorizedError, NotFoundError } from "../../api/common/error/RestError"
import { getListId, isSameId, listIdPart } from "../../api/common/utils/EntityUtils"
import { LoginController } from "../../api/main/LoginController"
import { IProgressMonitor, NoopProgressMonitor } from "../../api/common/utils/ProgressMonitor"
import type { ReceivedGroupInvitation } from "../../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, UserTypeRef } from "../../api/entities/sys/TypeRefs.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { CalendarMonthTimeRange } from "../date/CalendarUtils"
import {
	addDaysForEvent,
	addDaysForLongEvent,
	addDaysForRecurringEvent,
	getDiffInHours,
	getEventStart,
	getMonth,
	getTimeZone,
	isEventBetweenDays,
	isSameEvent,
} from "../date/CalendarUtils"
import { DateTime } from "luxon"
import { geEventElementMaxId, getEventElementMinId, isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils"
import type { EventCreateResult } from "../date/CalendarEventViewModel"
import { CalendarEventViewModel } from "../date/CalendarEventViewModel"
import { askIfShouldSendCalendarUpdatesToAttendees } from "./CalendarGuiUtils"
import { ReceivedGroupInvitationsModel } from "../../sharing/model/ReceivedGroupInvitationsModel"
import type { CalendarInfo, CalendarModel } from "../model/CalendarModel"
import type { EntityUpdateData } from "../../api/main/EventController"
import { EventController, isUpdateForTypeRef } from "../../api/main/EventController"
import { EntityClient } from "../../api/common/EntityClient"
import { ProgressTracker } from "../../api/main/ProgressTracker"
import { DeviceConfig } from "../../misc/DeviceConfig"
import type { EventDragHandlerCallbacks } from "./EventDragHandler"
import { locator } from "../../api/main/MainLocator.js"

export type EventsOnDays = {
	days: Array<Date>
	shortEvents: Array<Array<CalendarEvent>>
	longEvents: Array<CalendarEvent>
}
export type DraggedEvent = {
	originalEvent: CalendarEvent
	eventClone: CalendarEvent
}

export enum CalendarViewType {
	DAY = "day",
	WEEK = "week",
	MONTH = "month",
	AGENDA = "agenda",
}

export const CalendarViewTypeByValue = reverse(CalendarViewType)

export type MouseOrPointerEvent = MouseEvent | PointerEvent
export type CalendarEventBubbleClickHandler = (arg0: CalendarEvent, arg1: MouseOrPointerEvent) => unknown
type EventsForDays = Map<number, Array<CalendarEvent>>
export const LIMIT_PAST_EVENTS_YEARS = 100
export type CreateCalendarEventViewModelFunction = (event: CalendarEvent, calendarInfos: LazyLoaded<Map<Id, CalendarInfo>>) => Promise<CalendarEventViewModel>

export class CalendarViewModel implements EventDragHandlerCallbacks {
	// Should not be changed directly but only through the URL
	readonly selectedDate: Stream<Date>

	/** Mmap from group/groupRoot ID to the calendar info */
	_calendarInfos: LazyLoaded<Map<Id, CalendarInfo>>
	_eventsForDays: EventsForDays
	readonly _loadedMonths: Set<number> // first ms of the month

	_hiddenCalendars: Set<Id>
	readonly _calendarInvitations: ReceivedGroupInvitationsModel
	_createCalendarEventViewModelCallback: (event: CalendarEvent, calendarInfos: LazyLoaded<Map<Id, CalendarInfo>>) => Promise<CalendarEventViewModel>
	readonly _calendarModel: CalendarModel
	readonly _entityClient: EntityClient
	// Events that have been dropped but still need to be rendered as temporary while waiting for entity updates.
	readonly _transientEvents: Array<CalendarEvent>
	_draggedEvent: DraggedEvent | null
	readonly _redrawStream: Stream<void>
	readonly _deviceConfig: DeviceConfig
	readonly _timeZone: string

	constructor(
		loginController: LoginController,
		createCalendarEventViewModelCallback: CreateCalendarEventViewModelFunction,
		calendarModel: CalendarModel,
		entityClient: EntityClient,
		eventController: EventController,
		progressTracker: ProgressTracker,
		deviceConfig: DeviceConfig,
		calendarInvitations: ReceivedGroupInvitationsModel,
	) {
		this._calendarModel = calendarModel
		this._entityClient = entityClient
		this._createCalendarEventViewModelCallback = createCalendarEventViewModelCallback
		this._transientEvents = []

		const userId = loginController.getUserController().user._id

		this._loadedMonths = new Set()
		this._eventsForDays = freezeMap(new Map())
		this._deviceConfig = deviceConfig
		this._hiddenCalendars = new Set(this._deviceConfig.getHiddenCalendars(userId))
		this.selectedDate = stream(getStartOfDay(new Date()))
		this._redrawStream = stream()
		this._draggedEvent = null
		this._timeZone = getTimeZone()
		this._calendarInvitations = calendarInvitations
		// load all calendars. if there is no calendar yet, create one
		// we load three instances per calendar / CalendarGroupRoot / GroupInfo / Group + 3
		// for each calendar we load short events for three months +3
		const workPerCalendar = 3 + 3
		const totalWork = loginController.getUserController().getCalendarMemberships().length * workPerCalendar
		const monitorHandle = progressTracker.registerMonitorSync(totalWork)
		let progressMonitor: IProgressMonitor = neverNull(progressTracker.getMonitor(monitorHandle))
		this._calendarInfos = new LazyLoaded(() =>
			this._calendarModel.loadOrCreateCalendarInfo(progressMonitor).then((it) => {
				this._redraw()

				return it
			}),
		).load()
		this.selectedDate.map((d) => {
			const thisMonthStart = getMonth(d, this._timeZone).start
			const previousMonthDate = new Date(thisMonthStart)
			previousMonthDate.setMonth(thisMonthStart.getMonth() - 1)
			const nextMonthDate = new Date(thisMonthStart)
			nextMonthDate.setMonth(thisMonthStart.getMonth() + 1)

			this._loadMonthIfNeeded(thisMonthStart)
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
	}

	get calendarInvitations(): Stream<Array<ReceivedGroupInvitation>> {
		return this._calendarInvitations.invitations
	}

	get calendarInfos(): LazyLoaded<Map<Id, CalendarInfo>> {
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
	async onDragEnd(timeToMoveBy: number): Promise<void> {
		//if the time of the dragged event is the same as of the original we only cancel the drag
		if (timeToMoveBy !== 0) {
			if (this._draggedEvent) {
				const { originalEvent, eventClone } = this._draggedEvent
				this._draggedEvent = null
				updateTemporaryEventWithDiff(eventClone, originalEvent, timeToMoveBy)

				this._addTransientEvent(eventClone)

				let startTime

				if (originalEvent.repeatRule) {
					// In case we have a repeat rule we want to move all the events relative to the drag operation.
					// Therefore we load the first event and modify the start time of that event.
					const firstOccurrence = await this._entityClient.load(CalendarEventTypeRef, originalEvent._id)
					startTime = new Date(firstOccurrence.startTime.getTime() + timeToMoveBy)
				} else {
					startTime = eventClone.startTime
				}

				try {
					const didUpdate = await this._moveEvent(originalEvent, startTime)

					if (!didUpdate) {
						this._removeTransientEvent(eventClone)
					}
				} catch (e) {
					this._removeTransientEvent(eventClone)

					throw e
				}
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

		this._deviceConfig.setHiddenCalendars(locator.logins.getUserController().user._id, [...newHiddenCalendars])
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
	 * Given a events and days, return the long and short events of that range of days
	 *we detect events that should be removed based on their UID + start and end time
	 *
	 * @param days: The range of days from which events should be returned
	 * @returns    shortEvents: Array<Array<CalendarEvent>>, short events per day.,
	 *             longEvents: Array<CalendarEvent>: long events over the whole range,
	 *             days: Array<Date>: the original days that were passed in
	 */
	getEventsOnDays(days: Array<Date>): EventsOnDays {
		const longEvents: Set<CalendarEvent> = new Set()
		let shortEvents: Array<Array<CalendarEvent>> = []
		// It might be the case that a UID is shared by events across calendars, so we need to differentiate them by list ID aswell
		const transientEventUidsByCalendar = groupByAndMapUniquely(
			this._transientEvents,
			(event) => getListId(event),
			(event) => event.uid,
		)

		for (let day of days) {
			const shortEventsForDay: CalendarEvent[] = []
			const events = this._eventsForDays.get(day.getTime()) || []

			const sortEvent = (event: CalendarEvent) => {
				if (isAllDayEvent(event) || getDiffInHours(event.startTime, event.endTime) >= 24) {
					longEvents.add(event)
				} else {
					shortEventsForDay.push(event)
				}
			}

			for (let event of events) {
				if (transientEventUidsByCalendar.get(getListId(event))?.has(event.uid)) {
					continue
				}

				if (this._draggedEvent?.originalEvent !== event && !this._hiddenCalendars.has(neverNull(event._ownerGroup))) {
					sortEvent(event)
				}
			}

			this._transientEvents.filter((event) => isEventBetweenDays(event, day, day, this._timeZone)).forEach(sortEvent)

			const temporaryEvent = this._draggedEvent?.eventClone

			if (temporaryEvent && isEventBetweenDays(temporaryEvent, day, day, this._timeZone)) {
				sortEvent(temporaryEvent)
			}

			shortEvents.push(shortEventsForDay)
		}

		const longEventsArray = Array.from(longEvents)
		return {
			days,
			longEvents: longEventsArray,
			shortEvents: shortEvents.map((innerShortEvents) => innerShortEvents.filter((event) => !longEvents.has(event))),
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

	async _moveEvent(event: CalendarEvent, newStartDate: Date): Promise<EventCreateResult> {
		const viewModel: CalendarEventViewModel = await this._createCalendarEventViewModelCallback(event, this.calendarInfos)
		viewModel.rescheduleEvent(newStartDate)
		// Errors are handled in the individual views
		return viewModel.saveAndSend({
			askForUpdates: askIfShouldSendCalendarUpdatesToAttendees,
			askInsecurePassword: async () => true,
			showProgress: noOp,
		})
	}

	_addOrUpdateEvent(calendarInfo: CalendarInfo | null, event: CalendarEvent) {
		if (calendarInfo) {
			const eventListId = getListId(event)
			const eventMonth = getMonth(getEventStart(event, this._timeZone), this._timeZone)

			if (isSameId(calendarInfo.groupRoot.shortEvents, eventListId)) {
				// If the month is not loaded, we don't want to put it into events.
				// We will put it there when we load the month
				if (!this._loadedMonths.has(eventMonth.start.getTime())) {
					return
				}

				this._addDaysForEvent(event, eventMonth)
			} else if (isSameId(calendarInfo.groupRoot.longEvents, eventListId)) {
				this._removeExistingEvent(calendarInfo.longEvents.getLoaded(), event)

				calendarInfo.longEvents.getLoaded().push(event)

				this._loadedMonths.forEach((firstDayTimestamp) => {
					const loadedMonth = getMonth(new Date(firstDayTimestamp), this._timeZone)

					if (event.repeatRule) {
						this._addDaysForRecurringEvent(event, loadedMonth)
					} else {
						this._addDaysForLongEvent(event, loadedMonth)
					}
				})
			}
		}
	}

	_entityEventReceived<T>(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		return this._calendarInfos.getAsync().then((calendarEvents) => {
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
					isSameId(eventOwnerGroupId, locator.logins.getUserController().user.userGroup.group)
				) {
					if (update.operation === OperationType.UPDATE) {
						const calendarMemberships = locator.logins.getUserController().getCalendarMemberships()
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
			}).then(() => {
				// handle potential post multiple updates in get multiple requests
				// this is only necessary until post multiple updates are dealt with in EntityRestCache
				const updatesPerList = groupBy(addedOrUpdatedEventsUpdates, (update) => update.instanceListId)
				return promiseMap(updatesPerList, ([instanceListId, updates]) => {
					const ids = updates.map((update) => update.instanceId)
					return this._entityClient
						.loadMultiple(CalendarEventTypeRef, instanceListId, ids)
						.then((events) => {
							events.forEach((event) => {
								this._addOrUpdateEvent(calendarEvents.get(neverNull(event._ownerGroup)) ?? null, event)

								this._removeTransientEvent(event)
							})

							this._redraw()
						})
						.catch(
							ofClass(NotAuthorizedError, (e) => {
								// return updates that are not in cache Range if NotAuthorizedError (for those updates that are in cache range)
								console.log("NotAuthorizedError for event in entityEventsReceived of view", e)
							}),
						)
						.catch(
							ofClass(NotFoundError, (e) => {
								console.log("Not found event in entityEventsReceived of view", e)
							}),
						)
				}).then(noOp)
			})
		})
	}

	async _loadMonthIfNeeded(dayInMonth: Date): Promise<void> {
		const month = getMonth(dayInMonth, this._timeZone)

		if (!this._loadedMonths.has(month.start.getTime())) {
			this._loadedMonths.add(month.start.getTime())

			try {
				await this._loadEvents(month)
			} catch (e) {
				this._loadedMonths.delete(month.start.getTime())

				throw e
			} finally {
				this._redraw()
			}
		}
	}

	_loadEvents(month: CalendarMonthTimeRange): Promise<any> {
		return this._calendarInfos.getAsync().then((calendarInfos) => {
			// Because of the timezones and all day events, we might not load an event which we need to display.
			// So we add a margin on 24 hours to be sure we load everything we need. We will filter matching
			// events anyway.
			const startId = getEventElementMinId(month.start.getTime() - DAY_IN_MILLIS)
			const endId = geEventElementMaxId(month.end.getTime() + DAY_IN_MILLIS)
			// We collect events from all calendars together and then replace map synchronously.
			// This is important to replace the map synchronously to not get race conditions because we load different months in parallel.
			// We could replace map more often instead of aggregating events but this would mean creating even more (cals * months) maps.
			//
			// Note: there may be issues if we get entity update before other calendars finish loading but the chance is low and we do not
			// take care of this now.
			const aggregateShortEvents: CalendarEvent[] = []
			const aggregateLongEvents: CalendarEvent[] = []
			return promiseMap(calendarInfos.values(), (calendarInfo) => {
				const { groupRoot, longEvents } = calendarInfo
				return Promise.all([
					this._entityClient.loadReverseRangeBetween(CalendarEventTypeRef, groupRoot.shortEvents, endId, startId, 200),
					longEvents.getAsync(),
				]).then(([shortEventsResult, longEvents]) => {
					aggregateShortEvents.push(...shortEventsResult.elements)
					aggregateLongEvents.push(...longEvents)
				})
			}).then(() => {
				const newEvents = this._cloneEvents()

				aggregateShortEvents
					.filter((e) => {
						const eventStart = getEventStart(e, this._timeZone).getTime()
						return eventStart >= month.start.getTime() && eventStart < month.end.getTime()
					}) // only events for the loaded month
					.forEach((e) => {
						addDaysForEvent(newEvents, e, month)
					})
				const zone = this._timeZone
				aggregateLongEvents.forEach((e) => {
					if (e.repeatRule) {
						addDaysForRecurringEvent(newEvents, e, month, zone)
					} else {
						// Event through we get the same set of long events for each month we have to invoke this for each month
						// because addDaysForLongEvent adds days only for the specified month.
						addDaysForLongEvent(newEvents, e, month, zone)
					}
				})

				this._replaceEvents(newEvents)
			})
		})
	}

	/**
	 * Removes existing event from {@param events} and also from {@code this._eventsForDays} if end time does not match
	 */
	_removeExistingEvent(events: Array<CalendarEvent>, newEvent: CalendarEvent) {
		const indexOfOldEvent = events.findIndex((el) => isSameEvent(el, newEvent))

		if (indexOfOldEvent !== -1) {
			const oldEvent = events[indexOfOldEvent]

			// If the old and new event end times do not match, we need to remove all occurrences of old event, otherwise iterating
			// occurrences of new event won't replace all occurrences of old event. Changes of start or repeat rule already change
			// ID of the event so it is not a problem.
			if (oldEvent.endTime.getTime() !== newEvent.endTime.getTime()) {
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
	}

	_addDaysForEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		const newMap = this._cloneEvents()

		addDaysForEvent(newMap, event, month)

		this._replaceEvents(newMap)
	}

	_replaceEvents(newMap: EventsForDays) {
		this._eventsForDays = freezeMap(newMap)
	}

	_cloneEvents(): EventsForDays {
		return new Map(this._eventsForDays)
	}

	_addDaysForRecurringEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		if (-DateTime.fromJSDate(event.startTime).diffNow("year").years > LIMIT_PAST_EVENTS_YEARS) {
			console.log("repeating event is too far into the past", event)
			return
		}

		const newMap = this._cloneEvents()

		addDaysForRecurringEvent(newMap, event, month, this._timeZone)

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

	_addDaysForLongEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		const newMap = this._cloneEvents()

		addDaysForLongEvent(newMap, event, month)

		this._replaceEvents(newMap)
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
