import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import m from "mithril"
import { getAllDayDateUTC, isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils"
import { Time } from "../date/Time.js"

const DRAG_THRESHOLD = 10
export type MousePos = {
	x: number
	y: number
}
// Convenience wrapper for nullability
type DragData = {
	originalEvent: CalendarEvent
	originalDateUnderMouse: Date
	originalMousePos: MousePos
	keepTime: boolean // Indicates whether the time on the original event should be kept or modified. In case this is set to true the drag operation just shifts event start by whole days.
}

export interface EventDragHandlerCallbacks {
	readonly onDragStart: (calendarEvent: CalendarEvent, timeToMoveBy: number) => void
	readonly onDragUpdate: (timeToMoveBy: number) => void
	readonly onDragEnd: (timeToMoveBy: number) => Promise<void>
}

/**
 * Handles logic for dragging events in the calendar child views.
 */
export class EventDragHandler {
	_data: DragData | null = null
	_isDragging: boolean = false
	_lastDiffBetweenDates: number | null = null
	_hasChanged: boolean = false
	_draggingArea: HTMLBodyElement
	_eventDragCallbacks: EventDragHandlerCallbacks

	constructor(draggingArea: HTMLBodyElement, callbacks: EventDragHandlerCallbacks) {
		this._draggingArea = draggingArea
		this._eventDragCallbacks = callbacks
	}

	get isDragging(): boolean {
		return this._isDragging
	}

	get originalEvent(): CalendarEvent | null {
		return this._data?.originalEvent ?? null
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
	 * @param calendarEvent The calendar event for which a drag operation is prepared
	 * @param dateUnderMouse The original date under mouse when preparing the drag.
	 * @param keepTime Indicates whether the time on the original event should be kept or modified. In case this is set to true the drag
	 * operation just shifts event start by whole days otherwise the time from dateUnderMouse should be used as new time for the event.
	 */
	prepareDrag(calendarEvent: CalendarEvent, dateUnderMouse: Date, mousePos: MousePos, keepTime: boolean) {
		this._draggingArea.classList.add("cursor-grabbing")

		this._data = {
			originalEvent: calendarEvent,
			// We always differentiate between eventStart and originalDateUnderMouse to be able to shift it relative to the mouse position
			// and not the start date. This is important for larger events in day/week view
			originalDateUnderMouse: this.adjustDateUnderMouse(calendarEvent.startTime, dateUnderMouse, keepTime),
			originalMousePos: mousePos,
			keepTime: keepTime,
		}
		this._hasChanged = false
		this._isDragging = false
	}

	/**
	 * Call on mouse move.
	 * Will be a no-op if the prepareDrag hasn't been called or if cancelDrag has been called since the last prepareDrag call
	 * The dragging doesn't actually begin until the distance between the mouse and it's original location is greater than some threshold
	 * @param dateUnderMouse The current date under the mouse courser, may include a time.
	 */
	handleDrag(dateUnderMouse: Date, mousePos: MousePos) {
		if (this._data) {
			const dragData = this._data
			const adjustedDateUnderMouse = this.adjustDateUnderMouse(dragData.originalEvent.startTime, dateUnderMouse, dragData.keepTime)
			// Calculate the distance from the original mouse location to the current mouse location
			// We don't want to actually start the drag until the mouse has moved by some distance
			// So as to avoid accidentally dragging when you meant to click but moved the mouse a little
			const distanceX = dragData.originalMousePos.x - mousePos.x
			const distanceY = dragData.originalMousePos.y - mousePos.y
			const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

			if (this._isDragging) {
				const diffBetweenDates = this.getDayUnderMouseDiff(dragData, adjustedDateUnderMouse)

				// We don't want to trigger a redraw everytime the drag call is triggered, only when necessary
				if (diffBetweenDates !== this._lastDiffBetweenDates) {
					this._lastDiffBetweenDates = diffBetweenDates

					this._eventDragCallbacks.onDragUpdate(diffBetweenDates)

					this._hasChanged = true
					m.redraw()
				}
			} else if (distance > DRAG_THRESHOLD) {
				this._isDragging = true
				this._lastDiffBetweenDates = this.getDayUnderMouseDiff(dragData, adjustedDateUnderMouse)

				this._eventDragCallbacks.onDragStart(dragData.originalEvent, this._lastDiffBetweenDates)

				this._hasChanged = true
				m.redraw()
			}
		}
	}

	/**
	 * Call on mouseup or mouseleave. Ends a drag event if one has been started, and hasn't been cancelled.
	 *
	 * This function will only trigger when prepareDrag has been called
	 */
	async endDrag(dateUnderMouse: Date): Promise<void> {
		this._draggingArea.classList.remove("cursor-grabbing")

		if (this._isDragging && this._data) {
			const dragData = this._data
			const adjustedDateUnderMouse = this.adjustDateUnderMouse(dragData.originalEvent.startTime, dateUnderMouse, dragData.keepTime)
			// We update our state first because the updateCallback might take some time, and
			// we want the UI to be able to react to the drop having happened before we get the result
			this._isDragging = false
			this._data = null
			const diffBetweenDates = this.getDayUnderMouseDiff(dragData, adjustedDateUnderMouse)

			// If the date hasn't changed we still have to do the callback so the view model can cancel the drag
			try {
				await this._eventDragCallbacks.onDragEnd(diffBetweenDates)
			} finally {
				this._hasChanged = true
				m.redraw()
			}
		} else {
			this.cancelDrag()
		}
	}

	adjustDateUnderMouse(eventStart: Date, dateUnderMouse: Date, keepTime: boolean): Date {
		if (keepTime) {
			return Time.fromDate(eventStart).toDate(dateUnderMouse)
		} else {
			return dateUnderMouse
		}
	}

	getDayUnderMouseDiff(dragData: DragData, adjustedDateUnderMouse: Date): number {
		const { originalEvent, originalDateUnderMouse } = dragData
		return isAllDayEvent(originalEvent)
			? getAllDayDateUTC(adjustedDateUnderMouse).getTime() - getAllDayDateUTC(originalDateUnderMouse).getTime()
			: adjustedDateUnderMouse.getTime() - originalDateUnderMouse.getTime()
	}

	cancelDrag() {
		this._data = null
		this._isDragging = false
		this._hasChanged = true
		this._lastDiffBetweenDates = null
	}
}
