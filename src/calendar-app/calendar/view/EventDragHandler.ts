import type { CalendarEvent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import m from "mithril"
import { getAllDayDateUTC, isAllDayEvent } from "../../../common/api/common/utils/CommonCalendarUtils"
import { Time } from "../../../common/calendar/date/Time.js"
import { showDropdownAtPosition } from "../../../common/gui/base/Dropdown.js"
import { CalendarOperation } from "../gui/eventeditor-model/CalendarEventModel.js"

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
	readonly onDragEnd: (timeToMoveBy: number, mode: CalendarOperation | null) => Promise<void>
	readonly onDragCancel: () => void
}

/**
 * Handles logic for dragging events in the calendar child views.
 */
export class EventDragHandler {
	private data: DragData | null = null
	private dragging: boolean = false
	private lastDiffBetweenDates: number | null = null
	private hasChanged: boolean = false

	constructor(private readonly draggingArea: HTMLBodyElement, private readonly eventDragCallbacks: EventDragHandlerCallbacks) {}

	get isDragging(): boolean {
		return this.dragging
	}

	get originalEvent(): CalendarEvent | null {
		return this.data?.originalEvent ?? null
	}

	/**
	 * Check if the handler has changed since the last time you called this function
	 */
	queryHasChanged(): boolean {
		const isChanged = this.hasChanged
		this.hasChanged = false
		return isChanged
	}

	/**
	 * Call on mouse down, to initialize an upcoming drag event.
	 * Doesn't start the drag yet, because we want to wait until the mouse has moved beyond some threshhold
	 * @param calendarEvent The calendar event for which a drag operation is prepared.
	 * @param dateUnderMouse The original date under mouse when preparing the drag.
	 * @param mousePos The current position of the mouse.
	 * @param keepTime Indicates whether the time on the original event should be kept or modified. In case this is set to true the drag
	 * operation just shifts event start by whole days otherwise the time from dateUnderMouse should be used as new time for the event.
	 */
	prepareDrag(calendarEvent: CalendarEvent, dateUnderMouse: Date, mousePos: MousePos, keepTime: boolean) {
		this.draggingArea.classList.add("cursor-grabbing")

		this.data = {
			originalEvent: calendarEvent,
			// We always differentiate between eventStart and originalDateUnderMouse to be able to shift it relative to the mouse position
			// and not the start date. This is important for larger events in day/week view
			originalDateUnderMouse: this.adjustDateUnderMouse(calendarEvent.startTime, dateUnderMouse, keepTime),
			originalMousePos: mousePos,
			keepTime: keepTime,
		}
		this.hasChanged = false
		this.dragging = false
	}

	/**
	 * Call on mouse move.
	 * Will be a no-op if the prepareDrag hasn't been called or if cancelDrag has been called since the last prepareDrag call
	 * The dragging doesn't actually begin until the distance between the mouse and its original location is greater than some threshold
	 * @param dateUnderMouse The current date under the mouse courser, may include a time.
	 * @param mousePos the position of the mouse when the drag ended.
	 */
	handleDrag(dateUnderMouse: Date, mousePos: MousePos) {
		if (this.data) {
			const dragData = this.data
			const adjustedDateUnderMouse = this.adjustDateUnderMouse(dragData.originalEvent.startTime, dateUnderMouse, dragData.keepTime)
			// Calculate the distance from the original mouse location to the current mouse location
			// We don't want to actually start the drag until the mouse has moved by some distance
			// So as to avoid accidentally dragging when you meant to click but moved the mouse a little
			const distanceX = dragData.originalMousePos.x - mousePos.x
			const distanceY = dragData.originalMousePos.y - mousePos.y
			const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

			if (this.dragging) {
				const diffBetweenDates = this.getDayUnderMouseDiff(dragData, adjustedDateUnderMouse)

				// We don't want to trigger a redraw everytime the drag call is triggered, only when necessary
				if (diffBetweenDates !== this.lastDiffBetweenDates) {
					this.lastDiffBetweenDates = diffBetweenDates

					this.eventDragCallbacks.onDragUpdate(diffBetweenDates)

					this.hasChanged = true
					m.redraw()
				}
			} else if (distance > DRAG_THRESHOLD) {
				this.dragging = true
				this.lastDiffBetweenDates = this.getDayUnderMouseDiff(dragData, adjustedDateUnderMouse)

				this.eventDragCallbacks.onDragStart(dragData.originalEvent, this.lastDiffBetweenDates)

				this.hasChanged = true
				m.redraw()
			}
		}
	}

	/**
	 * Call on mouseup or mouseleave. Ends a drag event if one has been started, and hasn't been cancelled.
	 *
	 * This function will only trigger when prepareDrag has been called
	 */
	async endDrag(dateUnderMouse: Date, pos: MousePos): Promise<void> {
		this.draggingArea.classList.remove("cursor-grabbing")

		if (this.dragging && this.data) {
			const dragData = this.data
			const adjustedDateUnderMouse = this.adjustDateUnderMouse(dragData.originalEvent.startTime, dateUnderMouse, dragData.keepTime)
			// We update our state first because the updateCallback might take some time, and
			// we want the UI to be able to react to the drop having happened before we get the result
			this.dragging = false
			this.data = null
			const diffBetweenDates = this.getDayUnderMouseDiff(dragData, adjustedDateUnderMouse)

			// technically, we should check that this event is EventType OWN or SHARED_RW, but we'll assume that we're
			// not allowed to drag events where that's not the case.
			// note that we're not allowing changing the whole series from dragging an altered instance.
			const { repeatRule, recurrenceId } = dragData.originalEvent
			// prettier-ignore
			const mode = repeatRule != null
				? await showModeSelectionDropdown(pos)
				: recurrenceId != null
					? CalendarOperation.EditThis
					: CalendarOperation.EditAll

			// If the date hasn't changed we still have to do the callback so the view model can cancel the drag
			try {
				await this.eventDragCallbacks.onDragEnd(diffBetweenDates, mode)
			} finally {
				this.hasChanged = true
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
		this.draggingArea.classList.remove("cursor-grabbing")
		this.eventDragCallbacks.onDragCancel()

		this.data = null
		this.dragging = false
		this.hasChanged = true
		this.lastDiffBetweenDates = null

		m.redraw()
	}
}

async function showModeSelectionDropdown(pos: MousePos): Promise<CalendarOperation | null> {
	return new Promise((resolve) => {
		showDropdownAtPosition(
			[
				{ label: "updateOneCalendarEvent_action", click: () => resolve(CalendarOperation.EditThis) },
				{ label: "updateAllCalendarEvents_action", click: () => resolve(CalendarOperation.EditAll) },
			],
			pos.x,
			pos.y,
			() => resolve(null),
		)
	})
}
