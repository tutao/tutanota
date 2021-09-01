//@flow
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {CalendarEventTypeRef, createCalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import m from "mithril"
import {EntityClient} from "../../api/common/EntityClient"
import {getDiffInHours, getTimeZone, isEventBetweenDays} from "../date/CalendarUtils"
import {clone, neverNull} from "../../api/common/utils/Utils"
import {remove} from "../../api/common/utils/ArrayUtils"
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

	get transientEvents(): $ReadOnlyArray<CalendarEvent> {
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

	prepareDrag(calendarEvent: CalendarEvent, dateUnderMouse: Date, mousePos: MousePos) {
		console.log("prepare drag")
		this._data = {
			originalEvent: calendarEvent,
			originalDateUnderMouse: dateUnderMouse,
			originalMousePos: mousePos,
			eventClone: clone(calendarEvent)
		}

		this._hasChanged = false
		this._isDragging = false
	}

	handleDrag(dateUnderMouse: Date, mousePos: MousePos) {

		if (this._data) {
			const {originalEvent, originalDateUnderMouse, eventClone} = this._data
			// I dont want to start dragging until the mouse has moved by some amount
			const distanceX = this._data.originalMousePos.x - mousePos.x
			const distanceY = this._data.originalMousePos.y - mousePos.y
			const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)
			if (this._isDragging || distance > DRAG_THRESHOLD) {
				this._isDragging = true
				const mouseDiff = dateUnderMouse - originalDateUnderMouse

				if (mouseDiff !== this._lastMouseDiff) {
					this._hasChanged = true
				}

				// We don't want to trigger a redraw everytime the drag call is triggered, only when necessary
				this._lastMouseDiff = mouseDiff
				eventClone.startTime = new Date(originalEvent.startTime.getTime() + mouseDiff)
				eventClone.endTime = new Date(originalEvent.endTime.getTime() + mouseDiff)
				m.redraw()
			}
		}
	}

	async endDrag(dateUnderMouse: Date, updateEventCallback: (eventId: IdTuple, newDate: Date) => Promise<boolean>): Promise<void> {

		if (this._isDragging && this._data) {
			const {originalEvent, eventClone} = this._data

			this._hasChanged = true
			this._isDragging = false
			this._data = null

			// We want to return immediately with the temporary event, to give it back to the view,
			// and do all the update stuff async
			const diff = eventClone.startTime.getTime() - originalEvent.startTime.getTime()
			if (diff !== 0) {
				this._transientEvents.push(eventClone)
				const updateEvent = async (newStartTime) => {
					try {
						const didUpdate = await updateEventCallback(originalEvent._id, newStartTime)
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
					const startTime = new Date(firstOccurrence.startTime.getTime() + diff)
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

	cancelDrag() {
		this._data = null
		this._isDragging = false
		this._hasChanged = true
		this._lastMouseDiff = null
	}

	isTemporaryEvent(event: CalendarEvent): boolean {
		return event === this._data?.eventClone || this._transientEvents.includes(event)

	}

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

					// If we have some transient events, we want to get rid of them once the concrete event from the server is received
					// we detect this by checking the times, because currently that is the only relevant case for transient events
					// If the time is different, it means it's the new event
					// If the time is the same, it means that we need to keep rendering the transient event until the update is received
					// this could be done better by just looking for the id of the newly created event, but this is a bit trickier to achieve
					// due to some async shenanigans
					// TODO do we need to check individual props here? (year, month, etc)
					if (event.startTime.getTime() === transientEvent.startTime.getTime()
						&& event.endTime.getTime() === transientEvent.endTime.getTime()) {
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