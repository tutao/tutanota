import { $Promisable, assertNotNull, clone, debounce, findAndRemove, getStartOfDay, groupByAndMapUniquely } from "@tutao/tutanota-utils"
import { CalendarEvent, CalendarEventTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { getWeekStart, GroupType, OperationType, WeekStart } from "../../api/common/TutanotaConstants"
import { NotAuthorizedError, NotFoundError } from "../../api/common/error/RestError"
import { getElementId, getListId, isSameId } from "../../api/common/utils/EntityUtils"
import { LoginController } from "../../api/main/LoginController"
import { IProgressMonitor } from "../../api/common/utils/ProgressMonitor"
import type { ReceivedGroupInvitation } from "../../api/entities/sys/TypeRefs.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {
	clipRanges,
	getDayRange,
	getDiffIn60mIntervals,
	getEventEnd,
	getEventStart,
	getMonthRange,
	getStartOfDayWithZone,
	isEventBetweenDays,
	isSameEventInstance,
} from "../date/CalendarUtils"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils"
import { CalendarEventModel, CalendarOperation, EventSaveResult, getNonOrganizerAttendees } from "../date/eventeditor/CalendarEventModel.js"
import { askIfShouldSendCalendarUpdatesToAttendees } from "./CalendarGuiUtils"
import { ReceivedGroupInvitationsModel } from "../../sharing/model/ReceivedGroupInvitationsModel"
import type { CalendarInfo, CalendarModel } from "../model/CalendarModel"
import type { EntityUpdateData } from "../../api/main/EventController"
import { EventController, isUpdateFor, isUpdateForTypeRef } from "../../api/main/EventController"
import { EntityClient } from "../../api/common/EntityClient"
import { ProgressTracker } from "../../api/main/ProgressTracker"
import { DeviceConfig } from "../../misc/DeviceConfig"
import type { EventDragHandlerCallbacks } from "./EventDragHandler"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { CalendarEventPreviewViewModel } from "./eventpopup/CalendarEventPreviewViewModel.js"

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
export type DaysToEvents = ReadonlyMap<number, Array<CalendarEvent>>
export const LIMIT_PAST_EVENTS_YEARS = 100
export type CalendarEventEditModelsFactory = (mode: CalendarOperation, event: CalendarEvent) => Promise<CalendarEventModel | null>
export type CalendarEventPreviewModelFactory = (
	selectedEvent: CalendarEvent,
	calendars: ReadonlyMap<string, CalendarInfo>,
) => Promise<CalendarEventPreviewViewModel>

export class CalendarViewModel implements EventDragHandlerCallbacks {
	// Should not be changed directly but only through the URL
	readonly selectedDate: Stream<Date> = stream(getStartOfDay(new Date()))

	/**
	 * An event currently being displayed (non-modally)
	 * the {@code model} is {@code null} until it is loaded.
	 *
	 * We keep track of event separately to avoid races with selecting multiple events shortly one after another.
	 */
	private previewedEvent: { event: CalendarEvent; model: CalendarEventPreviewViewModel | null } | null = null

	_hiddenCalendars: Set<Id>
	// Events that have been dropped but still need to be rendered as temporary while waiting for entity updates.
	readonly _transientEvents: Array<CalendarEvent>
	_draggedEvent: DraggedEvent | null = null
	private readonly _redrawStream: Stream<void> = stream()
	readonly _deviceConfig: DeviceConfig

	constructor(
		private readonly logins: LoginController,
		private readonly createCalendarEventEditModel: CalendarEventEditModelsFactory,
		private readonly createCalendarEventPreviewModel: CalendarEventPreviewModelFactory,
		private readonly calendarModel: CalendarModel,
		private readonly entityClient: EntityClient,
		eventController: EventController,
		private readonly progressTracker: ProgressTracker,
		private readonly deviceConfig: DeviceConfig,
		private readonly calendarInvitationsModel: ReceivedGroupInvitationsModel<GroupType.Calendar>,
		private readonly timeZone: string,
	) {
		this._transientEvents = []

		const userId = logins.getUserController().user._id

		this._deviceConfig = deviceConfig
		this._hiddenCalendars = new Set(this._deviceConfig.getHiddenCalendars(userId))

		this.selectedDate.map((newDate) =>
			this.preloadMonthsAroundSelectedDate((event) => {
				const { start, end } = getDayRange(newDate, this.timeZone)
				return clipRanges(getEventStart(event, this.timeZone).getTime(), getEventEnd(event, this.timeZone).getTime(), start, end) == null
			}),
		)
		this.calendarModel.getEventsForMonths().map((newEvents) =>
			this.preloadMonthsAroundSelectedDate((event) => {
				const startOfDay = getStartOfDayWithZone(event.startTime, this.timeZone)
				return newEvents.get(startOfDay.getTime())?.find((v) => isSameEventInstance(v, event)) == null
			}),
		)
		this.calendarModel.getCalendarInfosStream().map((newInfos) =>
			this.preloadMonthsAroundSelectedDate((event) => {
				// redraw if we lost access to the events' list
				const groupRoots = Array.from(newInfos.values()).map((i) => i.groupRoot)
				const lists = [...groupRoots.map((g) => g.longEvents), ...groupRoots.map((g) => g.shortEvents)]
				const previewListId = getListId(event)
				return !lists.some((id) => isSameId(previewListId, id))
			}),
		)

		eventController.addEntityListener((updates, eventOwnerGroupId) => this._entityEventReceived(updates, eventOwnerGroupId))

		calendarInvitationsModel.init()
	}

	/**
	 * react to changes to the calendar data by making sure we have the current month + the two adjacent months
	 * ready to be rendered and the previewed event updated
	 *
	 * there are several reasons why we might no longer want to preview an event and need to redraw without
	 * a previewed event:
	 * * it was deleted
	 * * it was moved away from the day we're looking at (or the day was moved away)
	 * * the calendar was unshared or deleted
	 *
	 * we would want to keep the selection if the event merely shifted its start time but still intersects the viewed day,
	 * but that would require going through the UID index because moving events changes their ID.
	 * because of this and because previewedEvent is the event _before_ we got the update that caused us to reconsider the
	 * selection, with the old times, this function only works if the selected date changed, but not if the event times
	 * changed.
	 *
	 * @param isPreviewedEventObsolete a function that takes the current previewed event and returns a boolean indicating
	 * if it needs to be deselected
	 */
	private preloadMonthsAroundSelectedDate = debounce(200, async (isPreviewedEventObsolete: (event: CalendarEvent) => boolean) => {
		const event = this.previewedEvent?.event ?? null
		if (event != null && isPreviewedEventObsolete(event)) {
			this.previewedEvent = null
			this.doRedraw()
		}
		// load all calendars. if there is no calendar yet, create one
		// for each calendar we load short events for three months +3
		const workPerCalendar = 3
		const totalWork = this.logins.getUserController().getCalendarMemberships().length * workPerCalendar
		const monitorHandle = this.progressTracker.registerMonitorSync(totalWork)
		const progressMonitor: IProgressMonitor = assertNotNull(this.progressTracker.getMonitor(monitorHandle))

		const newSelectedDate = this.selectedDate()
		const thisMonthStart = getMonthRange(newSelectedDate, this.timeZone).start
		const previousMonthDate = new Date(thisMonthStart)
		previousMonthDate.setMonth(new Date(thisMonthStart).getMonth() - 1)
		const nextMonthDate = new Date(thisMonthStart)
		nextMonthDate.setMonth(new Date(thisMonthStart).getMonth() + 1)
		try {
			await this.loadMonthIfNeeded(new Date(thisMonthStart))
			progressMonitor.workDone(1)
			await this.loadMonthIfNeeded(nextMonthDate)
			progressMonitor.workDone(1)
			await this.loadMonthIfNeeded(previousMonthDate)
		} finally {
			progressMonitor.completed()
			this.doRedraw()
		}
	})

	get calendarInvitations(): Stream<Array<ReceivedGroupInvitation>> {
		return this.calendarInvitationsModel.invitations
	}

	get calendarInfos(): ReadonlyMap<Id, CalendarInfo> {
		return this.calendarModel.getCalendarInfosStream()()
	}

	get hiddenCalendars(): ReadonlySet<Id> {
		return this._hiddenCalendars
	}

	get eventsForDays(): DaysToEvents {
		return this.calendarModel.getEventsForMonths()()
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
			const eventsForDay = this.calendarModel.getEventsForMonths()().get(day.getTime()) || []

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
		await this.calendarModel.deleteCalendar(calendar)
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

	get eventPreviewModel(): CalendarEventPreviewViewModel | null {
		return this.previewedEvent?.model ?? null
	}

	async previewEvent(event: CalendarEvent) {
		const previewedEvent = (this.previewedEvent = { event, model: null })
		const calendarInfos = await this.calendarModel.getCalendarInfosCreateIfNeeded()
		const previewModel = await this.createCalendarEventPreviewModel(event, calendarInfos)
		// check that we didn't start previewing another event or changed the date in the meantime
		if (this.previewedEvent === previewedEvent) {
			this.previewedEvent.model = previewModel
			this.doRedraw()
		}
	}

	async _entityEventReceived<T>(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
				const eventId: IdTuple = [update.instanceListId, update.instanceId]
				if (this.previewedEvent != null && isUpdateFor(this.previewedEvent.event, update)) {
					if (update.operation === OperationType.DELETE) {
						this.previewedEvent = null
						this.doRedraw()
					} else {
						try {
							const event = await this.entityClient.load(CalendarEventTypeRef, eventId)
							await this.previewEvent(event)
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
				}
				const transientEvent = this._transientEvents.find((transientEvent) => isSameId(transientEvent._id, eventId))
				if (transientEvent) {
					this._removeTransientEvent(transientEvent)
					this.doRedraw()
				}
			}
		}
	}

	getCalendarInfosCreateIfNeeded(): $Promisable<ReadonlyMap<Id, CalendarInfo>> {
		return this.calendarModel.getCalendarInfosCreateIfNeeded()
	}

	loadMonthIfNeeded(dayInMonth: Date): Promise<void> {
		return this.calendarModel.loadMonthIfNeeded(dayInMonth)
	}

	private doRedraw() {
		// Need to pass some argument to make it a "set" operation
		this._redrawStream(undefined)
	}
}

function updateTemporaryEventWithDiff(eventClone: CalendarEvent, originalEvent: CalendarEvent, mouseDiff: number) {
	eventClone.startTime = new Date(originalEvent.startTime.getTime() + mouseDiff)
	eventClone.endTime = new Date(originalEvent.endTime.getTime() + mouseDiff)
}
