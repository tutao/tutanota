//@flow
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {CalendarEventTypeRef} from "../../api/entities/tutanota/CalendarEvent"
import m from "mithril"
import {EntityClient} from "../../api/common/EntityClient"
import {clone, neverNull} from "../../api/common/utils/Utils"
import {remove} from "../../api/common/utils/ArrayUtils"
import type {EventDateUpdateHandler} from "./CalendarView"
import {getDiffInHours, getTimeZone, isEventBetweenDays} from "../date/CalendarUtils"
import {isAllDayEvent} from "../../api/common/utils/CommonCalendarUtils"

const DRAG_THRESHOLD = 10

export type MousePos = {
	x: number,
	y: number
}

// Convenience wrapper for nullability
type DragData = {
	originalEvent: CalendarEvent,
	originalDateUnderMouse: Date,
	eventClone: CalendarEvent,
	originalMousePos: MousePos
}

export type EventsOnDays = {
	days: Array<Date>,
	shortEvents: Array<Array<CalendarEvent>>,
	longEvents: Array<CalendarEvent>,
}

/**
 * Handles logic for dragging events in the calendar child views.
 * This includes tracking events that have been moved and need to be rendered while still waiting for entity updates.
 */
export class EventDragHandler {

	_data: ?DragData = null
	_entityClient: EntityClient
	_isDragging: boolean = false
	_lastMouseDiff: ?number = null
	_hasChanged: boolean = false

	// Events that have been dropped but still need to be shown
	_transientEvents: Array<CalendarEvent> = []

	constructor(entityClient: EntityClient) {
		this._entityClient = entityClient
	}

	get originalEvent(): ?CalendarEvent {
		if (!this._isDragging) {
			return null
		}
		return this._data?.originalEvent
	}

	get temporaryEvent(): ?CalendarEvent {
		if (!this._isDragging) {
			return null
		}
		return this._data?.eventClone
	}

	get isDragging(): boolean {
		return this._isDragging
	}

	get transientEvents(): Array<CalendarEvent> {
		return this._transientEvents
	}

	/**
	 * Check if the handler has changed since the last time you called this function
	 */
	queryHasChanged(): boolean {
		const isChanged = this._hasChanged
		this._hasChanged = false
		return isChanged
	}

	/**
	 * Call on mouse down, to initialize an upcoming drag event.
	 * Doesn't start the drag yet, because we want to wait until the mouse has moved beyond some threshhold
	 */
	prepareDrag(calendarEvent: CalendarEvent, dateUnderMouse: Date, mousePos: MousePos) {
		this._data = {
			originalEvent: calendarEvent,
			originalDateUnderMouse: dateUnderMouse,
			originalMousePos: mousePos,
			eventClone: clone(calendarEvent)
		}

		this._hasChanged = false
		this._isDragging = false
	}

	/**
	 * Call on mouse move.
	 * Will be a no-op if the prepareDrag hasn't been called or if cancelDrag has been called since the last prepareDrag call
	 * The dragging doesn't actually begin until the distance between the mouse and it's original location is greater than some threshhold
	 */
	handleDrag(dateUnderMouse: Date, mousePos: MousePos) {

		if (this._data) {
			const {originalEvent, originalDateUnderMouse, eventClone} = this._data

			// Calculate the distance from the original mouse location to the current mouse location
			// We don't want to actually start the drag until the mouse has moved by some distance
			// So as to avoid accidentally dragging when you meant to click but moved the mouse a little
			const distanceX = this._data.originalMousePos.x - mousePos.x
			const distanceY = this._data.originalMousePos.y - mousePos.y
			const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)
			if (this._isDragging || distance > DRAG_THRESHOLD) {
				this._isDragging = true
				const mouseDiff = dateUnderMouse - originalDateUnderMouse

				// We don't want to trigger a redraw everytime the drag call is triggered, only when necessary
				if (mouseDiff !== this._lastMouseDiff) {
					this._hasChanged = true
				}

				this._lastMouseDiff = mouseDiff
				this._updateTemporaryEventWithDiff(eventClone, originalEvent, mouseDiff)
				m.redraw()
			}
		}
	}

	/**
	 * Call on mouseup or mouseleave. Ends a drag event if one has been started, and hasn't been cancelled.
	 *
	 * This function will only trigger when prepareDrag has been called, and then handleDrag has also been called with enough mouse movement
	 */
	async endDrag(dateUnderMouse: Date, updateEventCallback: EventDateUpdateHandler): Promise<void> {

		if (this._isDragging && this._data) {
			const {originalEvent, eventClone, originalDateUnderMouse} = this._data

			// We update our state first because the updateCallback might take some time, and
			// we want the UI to be able to react to the drop having happened before we get the result
			this._hasChanged = true
			this._isDragging = false
			this._data = null
			const mouseDiff = dateUnderMouse - originalDateUnderMouse
			this._updateTemporaryEventWithDiff(eventClone, originalEvent, mouseDiff)

			// If the date hasn't changed, then it should be a noop
			if (mouseDiff !== 0) {
				this._transientEvents.push(eventClone)
				const updateEvent = async (newStartTime) => {
					try {
						const didUpdate = await updateEventCallback(originalEvent, newStartTime)
						if (!didUpdate) {
							remove(this._transientEvents, eventClone)
						}
					} catch (e) {
						remove(this._transientEvents, eventClone)
						throw e
					} finally {
						this._hasChanged = true
						m.redraw()
					}
				}

				if (originalEvent.repeatRule) {
					const firstOccurrence = await this._entityClient.load(CalendarEventTypeRef, originalEvent._id)
					const startTime = new Date(firstOccurrence.startTime.getTime() + mouseDiff)
					return updateEvent(startTime)
				} else {
					return updateEvent(eventClone.startTime)
				}
			}

		} else {
			this.cancelDrag()
		}

		m.redraw()
	}

	_updateTemporaryEventWithDiff(eventClone: CalendarEvent, originalEvent: CalendarEvent, mouseDiff: number) {
		eventClone.startTime = new Date(originalEvent.startTime.getTime() + mouseDiff)
		eventClone.endTime = new Date(originalEvent.endTime.getTime() + mouseDiff)
	}

	cancelDrag() {
		this._data = null
		this._isDragging = false
		this._hasChanged = true
		this._lastMouseDiff = null
	}

	isTemporaryEvent(event: CalendarEvent): boolean {
		return event === this._data?.eventClone || this._transientEvents.includes(event)

	}

	/**
	 * Given a events and days, return the long and short events of that range of days
	 * This is handled here because we are tracking temporary events in the EventDragHandler,
	 * And we detect events that should be removed based on their UID + start and end time
	 *
	 * @param days: The range of days from which events should be returned
	 * @param eventsForDays: A map from start-of-day timestamp to a list of events
	 * @param hiddenCalendars: Calendars from which events shouldn't be returned
	 * @returns    shortEvents: Array<Array<CalendarEvent>>, short events per day.,
	 *             longEvents: Array<CalendarEvent>: long events over the whole range,
	 *             days: Array<Date>: the original days that were passed in
	 */
	getEventsOnDays(days: Array<Date>, eventsForDays: Map<number, Array<CalendarEvent>>, hiddenCalendars: Set<Id>): EventsOnDays {
		const longEvents: Set<CalendarEvent> = new Set()
		let shortEvents: Array<Array<CalendarEvent>> = []

		for (let day of days) {
			const shortEventsForDay = []
			const zone = getTimeZone()

			const events = eventsForDays.get(day.getTime()) || []

			const sortEvent = (event) => {
				if (isAllDayEvent(event) || getDiffInHours(event.startTime, event.endTime) >= 24) {
					longEvents.add(event)
				} else {
					shortEventsForDay.push(event)
				}
			}

			for (let event of events) {
				const referencedTransientEventIdx = this._transientEvents.findIndex(ev => event.uid === ev.uid)

				if (referencedTransientEventIdx !== -1) {
					const transientEvent = this._transientEvents[referencedTransientEventIdx]

					// If we have some transient events, we want to get rid of them once the real event from the server is received
					// If the time is different, it means it's the new event
					// If the time is the same, it means it's the original event, so we need to keep rendering the transient event until the update is received
					// This would be better if we could compare _id but the id of the new event is generated fairly deep inside the call
					// to CalendarEventViewModel.saveAndSend and it would be a large change to be able to access it here when we need it
					if (areEventDatesEqual(event.startTime, transientEvent.startTime)
						&& areEventDatesEqual(event.endTime, transientEvent.endTime)) {
						this._transientEvents.splice(referencedTransientEventIdx, 1)
					} else {
						continue
					}
				}

				if (this.originalEvent !== event && !hiddenCalendars.has(neverNull(event._ownerGroup))) {
					sortEvent(event)
				}
			}

			this._transientEvents
			    .filter(event => isEventBetweenDays(event, day, day, zone))
			    .forEach(sortEvent)

			const temporaryEvent = this.temporaryEvent
			if (temporaryEvent && isEventBetweenDays(temporaryEvent, day, day, zone)) {
				sortEvent(temporaryEvent)
			}
			shortEvents.push(shortEventsForDay)
		}

		const longEventsArray = Array.from(longEvents)
		return {
			days,
			longEvents: longEventsArray,
			shortEvents: shortEvents.map(innerShortEvents => innerShortEvents.filter(event => !longEvents.has(event)))
		}
	}
}

/**
 * Compare the dates for two events, ignoring seconds and milliseconds
 */
function areEventDatesEqual(e1: Date, e2: Date): boolean {
	return e1.getUTCMinutes() === e2.getUTCMinutes()
		&& e1.getUTCHours() === e2.getUTCHours()
		&& e1.getUTCDate() === e2.getUTCDate()
		&& e1.getUTCMonth() === e2.getUTCMonth()
		&& e1.getUTCFullYear() === e2.getUTCFullYear()

}