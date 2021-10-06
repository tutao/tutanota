// @flow

import o from "ospec"
import {EventDragHandler} from "../../../src/calendar/view/EventDragHandler"
import {defer, downcast} from "../../../src/api/common/utils/Utils"
import type {DraggedEvent} from "../../../src/calendar/view/CalendarViewModel"
import {assertThrows} from "../../api/TestUtils"
import {makeEvent} from "./CalendarTestUtils"

const INIT_MOUSE_POS = {x: 0, y: 0}
const NOT_DRAG_MOUSE_POS = {x: 0, y: 0}
const DRAG_MOUSE_POS = {x: 100, y: 0}

o.spec("Event Drag Handler", function () {

	o.spec("Dragging", function () {
		const body: HTMLBodyElement = downcast({
			classList: {
				add: () => {},
				remove: () => {}
			}
		})

		o("Noop move drag", function () {
			const handler = new EventDragHandler(body)
			const callback = o.spy((draggedEvent: DraggedEvent) => Promise.resolve())
			handler.handleDrag(new Date(2021, 8, 22), {x: 0, y: 0}, callback)
			o(handler.isDragging).equals(false)
			o(callback.callCount).equals(0)
		})


		o("Start then drag then change mind is noop", async function () {
			const handler = new EventDragHandler(body)
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))
			const callback = o.spy(() => Promise.resolve(true))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)

			// Dragged a bit
			const handleCallback = o.spy((draggedEvent: DraggedEvent) => Promise.resolve())
			handler.handleDrag(new Date(2021, 8, 21), DRAG_MOUSE_POS, handleCallback)
			o(handleCallback.callCount).equals(1)


			// Went back to original date
			await handler.endDrag(new Date(2021, 8, 22), callback)

			o(callback.callCount).equals(1)
			o(callback.args[0]).equals(0)
			o(handler.isDragging).equals(false)
		})

		o("Not moving mouse past 10px threshhold is noop", async function () {
			const handler = new EventDragHandler(body)
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))
			const callback = o.spy(() => Promise.resolve(true))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)

			// Dragged a bit
			const handleCallback = o.spy((draggedEvent: DraggedEvent) => Promise.resolve())
			handler.handleDrag(new Date(2021, 8, 21), NOT_DRAG_MOUSE_POS, handleCallback)
			o(handleCallback.callCount).equals(0)
			o(handler.isDragging).equals(false)

			// Drop but didn't move any more
			await handler.endDrag(new Date(2021, 8, 21), callback)

			o(callback.callCount).equals(0)
			o(handler.isDragging).equals(false)
		})

		o("A good drag and drop run", async function () {
			const handler = new EventDragHandler(body)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)

			const handleCallback = o.spy((draggedEvent: DraggedEvent) => Promise.resolve())
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS, handleCallback)
			o(handleCallback.callCount).equals(1)

			o(handler.isDragging).equals(true)

			const deferredCallbackComplete = defer()
			const callback = o.spy(() => deferredCallbackComplete.promise)

			let dragDate = new Date(2021, 8, 25)
			const endDragPromise = handler.endDrag(dragDate, callback)

			o(callback.callCount).equals(1)
			o(callback.args[0]).equals(dragDate - originalDate)
			o(handler.isDragging).equals(false)

			deferredCallbackComplete.resolve(true)
			await endDragPromise

			// Don't reset yourself if there is no problems
			o(callback.callCount).equals(1)
			o(callback.args[0]).equals(dragDate - originalDate)
			o(handler.isDragging).equals(false)


		})

		o("Complete drag and drop and callback returns false", async function () {
			const handler = new EventDragHandler(body)
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)
			const handleCallback = o.spy((draggedEvent: DraggedEvent) => Promise.resolve())
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS, handleCallback)
			o(handleCallback.callCount).equals(1)

			const deferredCallbackComplete = defer()
			const callback = o.spy(() => deferredCallbackComplete.promise)
			const endDragPromise = handler.endDrag(new Date(2021, 8, 25), callback)

			deferredCallbackComplete.resolve(false)
			await endDragPromise

			o(handler.isDragging).equals(false)
		})

		o("Complete drag and drop and callback does an error", async function () {
			const handler = new EventDragHandler(body)
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)

			const handleCallback = o.spy((draggedEvent: DraggedEvent) => Promise.resolve())
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS, handleCallback)
			o(handleCallback.callCount).equals(1)

			const deferredCallbackComplete = defer()
			const callback = o.spy(() => deferredCallbackComplete.promise)
			const endDragPromise = handler.endDrag(new Date(2021, 8, 25), callback)

			deferredCallbackComplete.reject(new Error("whoopsie"))
			await assertThrows(Error, async () => await endDragPromise)

			o(handler.isDragging).equals(false)
		})


		o("Drag while having temporary events should still work", async function () {
			const handler = new EventDragHandler(body)
			const event1 = makeEvent("event1", new Date(2021, 8, 22), new Date(2021, 8, 23))
			const event2 = makeEvent("event2", new Date(2021, 8, 22), new Date(2021, 8, 23))

			handler.prepareDrag(event1, new Date(2021, 8, 22), INIT_MOUSE_POS)
			const handleCallback = o.spy((draggedEvent: DraggedEvent) => Promise.resolve())
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS, handleCallback)
			o(handleCallback.callCount).equals(1)

			const deferredCallbackComplete1 = defer()
			const callback1 = o.spy(() => deferredCallbackComplete1.promise)

			const endDragPromise1 = handler.endDrag(new Date(2021, 8, 25), callback1)

			deferredCallbackComplete1.resolve(true)
			await endDragPromise1

			handler.prepareDrag(event2, new Date(2021, 8, 22), INIT_MOUSE_POS)
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS, handleCallback)
			o(handleCallback.callCount).equals(2)

			o(handler.isDragging).equals(true)

			const deferredCallbackComplete2 = defer()
			const callback2 = o.spy(() => deferredCallbackComplete2.promise)
			const endDragPromise2 = handler.endDrag(new Date(2021, 8, 25), callback2)

			// Now we are not dragging anymore
			o(handler.isDragging).equals(false)

			deferredCallbackComplete2.resolve(true)
			await endDragPromise2

			o(handler.isDragging).equals(false)
		})

	})

})


