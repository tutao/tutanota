import o from "@tutao/otest"
import { EventDragHandler, EventDragHandlerCallbacks } from "../../../src/calendar-app/calendar/view/EventDragHandler.js"
import { DAY_IN_MILLIS, defer, downcast } from "@tutao/tutanota-utils"
import type { DraggedEvent } from "../../../src/calendar-app/calendar/view/CalendarViewModel.js"
import { makeEvent } from "./CalendarTestUtils.js"
import { isAllDayEvent } from "../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { DateTime } from "luxon"
import { spy } from "@tutao/tutanota-test-utils"
import { getAllDayDateUTCFromZone, getStartOfDayWithZone, getStartOfNextDayWithZone } from "../../../src/common/calendar/date/CalendarUtils.js"

const INIT_MOUSE_POS = {
	x: 0,
	y: 0,
}
const NOT_DRAG_MOUSE_POS = {
	x: 0,
	y: 0,
}
const DRAG_MOUSE_POS = {
	x: 100,
	y: 0,
}
o.spec("Event Drag Handler", function () {
	const zone = "Europe/Berlin"
	o.spec("Dragging", function () {
		const body: HTMLBodyElement = downcast({
			classList: {
				add: () => {},
				remove: () => {},
			},
		})
		let callbackMock: EventDragHandlerCallbacks
		let handler: EventDragHandler
		o.beforeEach(() => {
			callbackMock = downcast({
				onDragStart: spy((draggedEvent: DraggedEvent, diff: number) => {}),
				onDragUpdate: spy((diff: number) => {}),
				onDragEnd: spy((diff: number) => Promise.resolve()),
				onDragCancel: spy(() => {}),
			})
			handler = new EventDragHandler(body, callbackMock)
		})
		o("Noop move drag", function () {
			handler.handleDrag(new Date(2021, 8, 22), {
				x: 0,
				y: 0,
			})
			o(handler.isDragging).equals(false)
			o(callbackMock.onDragStart.callCount).equals(0)
		})
		o("Start then drag then change mind is noop", async function () {
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))
			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS, true)
			// Dragged a bit
			handler.handleDrag(new Date(2021, 8, 21), DRAG_MOUSE_POS)
			o(callbackMock.onDragStart.callCount).equals(1)
			// end drag callback is called with diff set to 0 so no startTime change
			await handler.endDrag(new Date(2021, 8, 22), DRAG_MOUSE_POS)
			o(callbackMock.onDragEnd.callCount).equals(1)
			o(callbackMock.onDragEnd.args[0]).equals(0)
			o(handler.isDragging).equals(false)
		})
		o("Not moving mouse past 10px threshhold is noop", async function () {
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))
			const callback = spy(() => Promise.resolve(true))
			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS, true)
			// Dragged a bit
			handler.handleDrag(new Date(2021, 8, 21), NOT_DRAG_MOUSE_POS)
			o(callbackMock.onDragStart.callCount).equals(0)
			o(handler.isDragging).equals(false)
			// Drop but didn't move any more
			await handler.endDrag(new Date(2021, 8, 21), DRAG_MOUSE_POS)
			o(callbackMock.onDragEnd.callCount).equals(0)
			o(handler.isDragging).equals(false)
		})
		o("Cancel drag", async function () {
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))
			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS, true)
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)
			o(handler.isDragging).equals(true)
			handler.cancelDrag()
			o(callbackMock.onDragEnd.callCount).equals(0)
			o(callbackMock.onDragCancel.callCount).equals(1)
			o(handler.isDragging).equals(false)
		})
		o("A good drag and drop run", async function () {
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))
			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS, true)
			// drag start
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)
			o(callbackMock.onDragStart.callCount).equals(1)
			o(callbackMock.onDragStart.callCount).equals(1)
			const [calendarEvent, timeToMoveBy] = callbackMock.onDragStart.args
			o(timeToMoveBy).equals(2 * DAY_IN_MILLIS)
			o(handler.isDragging).equals(true)
			// drag update
			let dragDate = new Date(2021, 8, 25)
			handler.handleDrag(dragDate, DRAG_MOUSE_POS)
			o(callbackMock.onDragUpdate.callCount).equals(1)
			const [updateTimeToMoveBy] = callbackMock.onDragUpdate.args
			o(updateTimeToMoveBy).equals(3 * DAY_IN_MILLIS)
			// drag end
			const deferredCallbackComplete = defer()
			// @ts-ignore
			callbackMock.onDragEnd = spy(() => deferredCallbackComplete.promise)
			const endDragPromise = handler.endDrag(dragDate, DRAG_MOUSE_POS)
			o(callbackMock.onDragEnd.callCount).equals(1)
			const [endTimeToMoveBy] = callbackMock.onDragEnd.args
			o(endTimeToMoveBy).equals(3 * DAY_IN_MILLIS)
			// check that drag handler state resets itself before onDragEnd callback is complete
			o(handler.isDragging).equals(false)
			deferredCallbackComplete.resolve(true)
			await endDragPromise
		})
		o("A good drag and drop run from summer to winter time", async function () {
			let originalStartDate = DateTime.fromObject(
				{
					year: 2021,
					month: 10,
					day: 30,
					hour: 13,
				},
				{ zone },
			).toJSDate()
			let newStartDate = DateTime.fromObject(
				{
					year: 2021,
					month: 10,
					day: 31,
					hour: 13,
				},
				{ zone },
			).toJSDate()
			const shortEvent = makeEvent("shortEvent", originalStartDate, new Date(2021, 9, 30, 13))
			//short event
			handler.prepareDrag(shortEvent, originalStartDate, INIT_MOUSE_POS, false)
			handler.handleDrag(newStartDate, DRAG_MOUSE_POS)
			o(callbackMock.onDragStart.callCount).equals(1)
			await handler.endDrag(newStartDate, DRAG_MOUSE_POS)
			const oneDayPlusOneHour = 25 * 60 * 60 * 1000
			o(callbackMock.onDragEnd.callCount).equals(1)
			o(callbackMock.onDragEnd.args[0]).equals(oneDayPlusOneHour) //we want the event to start at the exact same time ignoring changing the clocks

			o(handler.isDragging).equals(false)
		})
		o("A good drag and drop run from summer to winter time with all day event", async function () {
			let originalStartDate = DateTime.fromObject(
				{
					year: 2021,
					month: 10,
					day: 30,
					hour: 13,
				},
				{ zone },
			).toJSDate()
			let newStartDate = DateTime.fromObject(
				{
					year: 2021,
					month: 10,
					day: 31,
					hour: 13,
				},
				{ zone },
			).toJSDate()
			originalStartDate = getStartOfDayWithZone(originalStartDate, zone)
			newStartDate = getStartOfDayWithZone(newStartDate, zone)
			const alldayEvent = makeEvent(
				"alldayEvent",
				getAllDayDateUTCFromZone(originalStartDate, zone),
				getAllDayDateUTCFromZone(getStartOfNextDayWithZone(originalStartDate, zone), zone),
			)
			o(isAllDayEvent(alldayEvent)).equals(true)("is all day event")
			//short event
			handler.prepareDrag(alldayEvent, originalStartDate, INIT_MOUSE_POS, true)
			handler.handleDrag(newStartDate, DRAG_MOUSE_POS)
			o(callbackMock.onDragStart.callCount).equals(1)
			await handler.endDrag(newStartDate, DRAG_MOUSE_POS)
			const oneDay = 24 * 60 * 60 * 1000
			o(callbackMock.onDragEnd.callCount).equals(1)
			o(callbackMock.onDragEnd.args[0]).equals(oneDay) //we want the event to start at the beginning of the day taking changing the clocks into account

			o(handler.isDragging).equals(false)
		})
	})
})
