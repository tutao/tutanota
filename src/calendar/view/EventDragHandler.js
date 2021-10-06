//@flow
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import m from "mithril"
import {clone} from "../../api/common/utils/Utils"
import type {EventDateUpdateHandler} from "./CalendarView"
import type {DraggedEvent} from "./CalendarViewModel"

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


/**
 * Handles logic for dragging events in the calendar child views.
 */
export class EventDragHandler {
	_data: ?DragData = null
	_isDragging: boolean = false
	_lastMouseDiff: ?number = null
	_hasChanged: boolean = false
	_draggingArea: HTMLBodyElement


	constructor(draggingArea: HTMLBodyElement) {
		this._draggingArea = draggingArea
	}

	get isDragging(): boolean {
		return this._isDragging
	}

	get originalEvent(): ?CalendarEvent {
		return this._data?.originalEvent
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
		this._draggingArea.classList.add("cursor-grabbing")
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
	handleDrag(dateUnderMouse: Date, mousePos: MousePos, setDraggedEventCallback: (DraggedEvent, number) => mixed) {
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
				const diffBetweenDates = dateUnderMouse - originalDateUnderMouse

				// We don't want to trigger a redraw everytime the drag call is triggered, only when necessary
				if (diffBetweenDates !== this._lastMouseDiff) {
					this._hasChanged = true
				}

				this._lastMouseDiff = diffBetweenDates
				setDraggedEventCallback({originalEvent: originalEvent, eventClone: eventClone}, diffBetweenDates)
				m.redraw()
			}
		}
	}

	/**
	 * Call on mouseup or mouseleave. Ends a drag event if one has been started, and hasn't been cancelled.
	 *
	 * This function will only trigger when prepareDrag has been called
	 */
	async endDrag(dateUnderMouse: Date, updateEventCallback: EventDateUpdateHandler): Promise<void> {
		this._draggingArea.classList.remove("cursor-grabbing")
		if (this._isDragging && this._data) {
			const {originalDateUnderMouse} = this._data
			// We update our state first because the updateCallback might take some time, and
			// we want the UI to be able to react to the drop having happened before we get the result
			this._hasChanged = true
			this._isDragging = false
			this._data = null
			const mouseDiff = dateUnderMouse - originalDateUnderMouse


			// If the date hasn't changed we still have to do the callback so the view model can cancel the drag
			try {
				await updateEventCallback(mouseDiff)
			} finally {
				this._hasChanged = true
				m.redraw()
			}
		} else {
			this.cancelDrag()
		}
	}


	cancelDrag() {
		this._data = null
		this._isDragging = false
		this._hasChanged = true
		this._lastMouseDiff = null
	}


}

