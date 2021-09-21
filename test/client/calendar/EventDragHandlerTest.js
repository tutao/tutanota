// @flow

import o from "ospec"
import {EventDragHandler} from "../../../src/calendar/view/EventDragHandler"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {defer, downcast} from "../../../src/api/common/utils/Utils"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {assertThrows} from "../../api/TestUtils"
import {addDaysForEvent} from "../../../src/calendar/date/CalendarUtils"

const INIT_MOUSE_POS = {x: 0, y: 0}
const NOT_DRAG_MOUSE_POS = {x: 0, y: 0}
const DRAG_MOUSE_POS = {x: 100, y: 0}

const entityClient: EntityClient = downcast({
	load: o.spy(async () => createCalendarEvent())
})

function id(element) {
	return ["list", element]
}

function makeEvent(_id, startTime, endTime, uid = null) {
	return createCalendarEvent({_id: id(_id), startTime, endTime, uid})
}

o.spec("Event Drag Handler", function () {

	o.spec("Dragging", function () {

		o("Noop move drag", function () {
			const handler = new EventDragHandler(entityClient)

			handler.handleDrag(new Date(2021, 8, 22), {x: 0, y: 0})
			o(handler.isDragging).equals(false)
			o(handler.temporaryEvent).equals(null)
			o(handler.transientEvents).deepEquals([])
		})


		o("Start then drag then change mind is noop", async function () {
			const handler = new EventDragHandler(entityClient)
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))
			const callback = o.spy(() => Promise.resolve(true))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)

			// Dragged a bit
			handler.handleDrag(new Date(2021, 8, 21), DRAG_MOUSE_POS)

			// Went back to original date
			await handler.endDrag(new Date(2021, 8, 22), callback)

			o(callback.callCount).equals(0)
			o(handler.isDragging).equals(false)
			o(handler.temporaryEvent).equals(null)
			o(handler.transientEvents).deepEquals([])
		})

		o("Not moving mouse past 10px threshhold is noop", async function () {
			const handler = new EventDragHandler(entityClient)
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))
			const callback = o.spy(() => Promise.resolve(true))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)

			// Dragged a bit
			handler.handleDrag(new Date(2021, 8, 21), NOT_DRAG_MOUSE_POS)

			o(handler.isDragging).equals(false)
			o(handler.temporaryEvent).equals(null)

			// Drop but didn't move any more
			await handler.endDrag(new Date(2021, 8, 21), callback)

			o(callback.callCount).equals(0)
			o(handler.isDragging).equals(false)
			o(handler.temporaryEvent).equals(null)
			o(handler.transientEvents).deepEquals([])
		})

		o("A good drag and drop run", async function () {
			const handler = new EventDragHandler(entityClient)
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)

			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)

			o(handler.isDragging).equals(true)
			o(handler.temporaryEvent?.startTime.toISOString()).equals(new Date(2021, 8, 24).toISOString())
			o(handler.temporaryEvent?.endTime.toISOString()).equals(new Date(2021, 8, 25).toISOString())

			const deferredCallbackComplete = defer()
			const callback = o.spy(() => deferredCallbackComplete.promise)

			const temporaryEvent = handler.temporaryEvent

			const endDragPromise = handler.endDrag(new Date(2021, 8, 25), callback)

			o(callback.callCount).equals(1)
			o(callback.args[0]).equals(event)
			o(callback.args[1].toISOString()).equals(new Date(2021, 8, 25).toISOString())
			o(handler.isDragging).equals(false)
			o(handler.temporaryEvent).equals(null)
			o(handler.transientEvents).deepEquals([temporaryEvent])

			deferredCallbackComplete.resolve(true)
			await endDragPromise

			// Don't reset yourself if there is no problems
			o(callback.callCount).equals(1)
			o(callback.args[0]).equals(event)
			o(callback.args[1].toISOString()).equals(new Date(2021, 8, 25).toISOString())
			o(handler.isDragging).equals(false)
			o(handler.temporaryEvent).equals(null)
			o(handler.transientEvents).deepEquals([temporaryEvent])

		})

		o("Complete drag and drop and callback returns false", async function () {
			const handler = new EventDragHandler(entityClient)
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)

			const deferredCallbackComplete = defer()
			const callback = o.spy(() => deferredCallbackComplete.promise)
			const endDragPromise = handler.endDrag(new Date(2021, 8, 25), callback)

			deferredCallbackComplete.resolve(false)
			await endDragPromise

			// The callback returned false, so we remove our event from transient events
			o(handler.isDragging).equals(false)
			o(handler.temporaryEvent).equals(null)
			o(handler.transientEvents).deepEquals([])
		})

		o("Complete drag and drop and callback does an error", async function () {
			const handler = new EventDragHandler(entityClient)
			const event = makeEvent("event", new Date(2021, 8, 22), new Date(2021, 8, 23))

			handler.prepareDrag(event, new Date(2021, 8, 22), INIT_MOUSE_POS)

			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)

			const deferredCallbackComplete = defer()
			const callback = o.spy(() => deferredCallbackComplete.promise)
			const endDragPromise = handler.endDrag(new Date(2021, 8, 25), callback)

			deferredCallbackComplete.reject(new Error("whoopsie"))
			await assertThrows(Error, () => endDragPromise)

			// The callback threw, so we remove our event from transient events
			o(handler.isDragging).equals(false)
			o(handler.temporaryEvent).equals(null)
			o(handler.transientEvents).deepEquals([])
		})


		o("Drag while having temporary events should still work", async function () {
			const handler = new EventDragHandler(entityClient)
			const event1 = makeEvent("event1", new Date(2021, 8, 22), new Date(2021, 8, 23))
			const event2 = makeEvent("event2", new Date(2021, 8, 22), new Date(2021, 8, 23))

			handler.prepareDrag(event1, new Date(2021, 8, 22), INIT_MOUSE_POS)
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)
			const deferredCallbackComplete1 = defer()
			const callback1 = o.spy(() => deferredCallbackComplete1.promise)
			const temporaryEvent1 = handler.temporaryEvent
			const endDragPromise1 = handler.endDrag(new Date(2021, 8, 25), callback1)

			deferredCallbackComplete1.resolve(true)
			await endDragPromise1

			handler.prepareDrag(event2, new Date(2021, 8, 22), INIT_MOUSE_POS)
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)

			o(handler.isDragging).equals(true)
			o(handler.originalEvent).equals(event2)
			o(handler.transientEvents).deepEquals([temporaryEvent1])

			const deferredCallbackComplete2 = defer()
			const callback2 = o.spy(() => deferredCallbackComplete2.promise)
			const temporaryEvent2 = handler.temporaryEvent
			const endDragPromise2 = handler.endDrag(new Date(2021, 8, 25), callback2)

			// Now we have two temporary events and we are not dragging anymore
			o(handler.isDragging).equals(false)
			o(handler.originalEvent).equals(null)
			o(handler.transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])

			deferredCallbackComplete2.resolve(true)
			await endDragPromise2


			// the callback was successful so we keep it in temporary events
			o(handler.isDragging).equals(false)
			o(handler.originalEvent).equals(null)
			o(handler.transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])
		})

		o("Drag while having temporary events but the second update failed", async function () {
			const handler = new EventDragHandler(entityClient)
			const event1 = makeEvent("event1", new Date(2021, 8, 22), new Date(2021, 8, 23))
			const event2 = makeEvent("event2", new Date(2021, 8, 22), new Date(2021, 8, 23))

			handler.prepareDrag(event1, new Date(2021, 8, 22), INIT_MOUSE_POS)
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)
			const deferredCallbackComplete1 = defer()
			const callback1 = o.spy(() => deferredCallbackComplete1.promise)
			const temporaryEvent1 = handler.temporaryEvent
			const endDragPromise1 = handler.endDrag(new Date(2021, 8, 25), callback1)
			deferredCallbackComplete1.resolve(true)
			await endDragPromise1

			handler.prepareDrag(event2, new Date(2021, 8, 22), INIT_MOUSE_POS)
			handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)

			o(handler.isDragging).equals(true)
			o(handler.originalEvent).equals(event2)
			o(handler.transientEvents).deepEquals([temporaryEvent1])

			const deferredCallbackComplete2 = defer()
			const callback2 = o.spy(() => deferredCallbackComplete2.promise)
			const temporaryEvent2 = handler.temporaryEvent
			const endDragPromise2 = handler.endDrag(new Date(2021, 8, 25), callback2)

			// Now we have two temporary events and we are not dragging anymore
			o(handler.isDragging).equals(false)
			o(handler.originalEvent).equals(null)
			o(handler.transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])

			deferredCallbackComplete2.resolve(false)
			await endDragPromise2

			// the callback failed so we remove it from our temporary events
			o(handler.isDragging).equals(false)
			o(handler.originalEvent).equals(null)
			o(handler.transientEvents).deepEquals([temporaryEvent1])
		})
	})

	o("Drag while having temporary events and then the first update fails", async function () {
		const handler = new EventDragHandler(entityClient)
		const event1 = makeEvent("event1", new Date(2021, 8, 22), new Date(2021, 8, 23))
		const event2 = makeEvent("event2", new Date(2021, 8, 22), new Date(2021, 8, 23))

		handler.prepareDrag(event1, new Date(2021, 8, 22), INIT_MOUSE_POS)
		handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)
		const deferredCallbackComplete1 = defer()
		const callback1 = o.spy(() => deferredCallbackComplete1.promise)
		const temporaryEvent1 = handler.temporaryEvent
		const endDragPromise1 = handler.endDrag(new Date(2021, 8, 25), callback1)

		handler.prepareDrag(event2, new Date(2021, 8, 22), INIT_MOUSE_POS)
		handler.handleDrag(new Date(2021, 8, 24), DRAG_MOUSE_POS)

		o(handler.isDragging).equals(true)
		o(handler.originalEvent).equals(event2)
		o(handler.transientEvents).deepEquals([temporaryEvent1])

		const deferredCallbackComplete2 = defer()
		const callback2 = o.spy(() => deferredCallbackComplete2.promise)
		const temporaryEvent2 = handler.temporaryEvent
		const endDragPromise2 = handler.endDrag(new Date(2021, 8, 25), callback2)

		// Now we have two temporary events and we are not dragging anymore
		o(handler.isDragging).equals(false)
		o(handler.originalEvent).equals(null)
		o(handler.transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])

		deferredCallbackComplete1.resolve(false)
		await endDragPromise1
		deferredCallbackComplete2.resolve(true)
		await endDragPromise2

		// the callback failed so we remove it from our temporary events
		o(handler.isDragging).equals(false)
		o(handler.originalEvent).equals(null)
		o(handler.transientEvents).deepEquals([temporaryEvent2])
	})
})

o.spec("Filtering events", function () {

	function init(events) {

		const month = {
			start: new Date(2021, 0, 1),
			end: new Date(2021, 0, 30)
		}

		const eventsForDays = new Map()
		for (let event of events) {
			addDaysForEvent(eventsForDays, event, month)
		}

		return {
			days: [
				new Date(2021, 0, 1),
				new Date(2021, 0, 2),
				new Date(2021, 0, 3),
				new Date(2021, 0, 4),
				new Date(2021, 0, 5),
				new Date(2021, 0, 6),
				new Date(2021, 0, 7)
			],
			eventsForDays,
			month
		}
	}

	o("Before drag, input events are all used", async function () {
		const handler = new EventDragHandler(entityClient)
		const inputEvents = [
			makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
			makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
			makeEvent("event3", new Date(2021, 0, 3, 13, 0), new Date(2021, 0, 3, 14, 30), "uid3")
		]
		const {days, eventsForDays} = init(inputEvents)

		const expected = {
			shortEvents: [
				[], [], [
					inputEvents[2]
				], [], [], [], []
			],
			longEvents: [
				inputEvents[0], inputEvents[1]
			],
		}

		const {shortEvents, longEvents} = handler.getEventsOnDays(days, eventsForDays, new Set())

		o({shortEvents, longEvents: Array.from(longEvents)}).deepEquals(expected)
	})

	o("During drag, temporary event overrides the original version", async function () {
		const handler = new EventDragHandler(entityClient)
		const inputEvents = [
			makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
			makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
			makeEvent("event3", new Date(2021, 0, 3, 13, 0), new Date(2021, 0, 3, 14, 30), "uid3")
		]
		const {days, eventsForDays} = init(inputEvents)


		handler.prepareDrag(inputEvents[2], new Date(2021, 0, 3), INIT_MOUSE_POS)
		handler.handleDrag(new Date(2021, 0, 4), DRAG_MOUSE_POS)

		const expected = {
			shortEvents: [
				[], [], [], [
					handler.temporaryEvent
				], [], [], []
			],
			longEvents: [
				inputEvents[0], inputEvents[1]
			],
		}
		const {shortEvents, longEvents} = handler.getEventsOnDays(days, eventsForDays, new Set())

		o({shortEvents, longEvents: Array.from(longEvents)}).deepEquals(expected)
	})

	o("After drop, before load", async function () {
		const handler = new EventDragHandler(entityClient)
		const inputEvents = [
			makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
			makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
			makeEvent("event3", new Date(2021, 0, 3, 13, 0), new Date(2021, 0, 3, 14, 30), "uid3")
		]
		const {days, eventsForDays, month} = init(inputEvents)


		handler.prepareDrag(inputEvents[2], new Date(2021, 0, 3), INIT_MOUSE_POS)
		handler.handleDrag(new Date(2021, 0, 4), DRAG_MOUSE_POS)

		const expected = {
			shortEvents: [
				[], [], [], [], [
					handler.temporaryEvent
				], [], []
			],
			longEvents: [
				inputEvents[0], inputEvents[1]
			],
		}

		const deferredCallbackComplete = defer()
		const callback = o.spy(() => deferredCallbackComplete.promise)
		const endDragPromise = handler.endDrag(new Date(2021, 0, 5), callback)
		deferredCallbackComplete.resolve(true)
		await endDragPromise

		const {shortEvents, longEvents} = handler.getEventsOnDays(days, eventsForDays, new Set())

		o({shortEvents, longEvents: Array.from(longEvents)}).deepEquals(expected)
	})

	o("After drop, after load", async function () {


		const handler = new EventDragHandler(entityClient)
		const inputEvents = [
			makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
			makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
			makeEvent("event3", new Date(2021, 0, 3, 13, 0), new Date(2021, 0, 3, 14, 30), "uid3")
		]
		const {days, eventsForDays, month} = init(inputEvents)


		handler.prepareDrag(inputEvents[2], new Date(2021, 0, 3), INIT_MOUSE_POS)
		handler.handleDrag(new Date(2021, 0, 4), DRAG_MOUSE_POS)


		const deferredCallbackComplete = defer()
		const callback = o.spy(() => deferredCallbackComplete.promise)
		const endDragPromise = handler.endDrag(new Date(2021, 0, 5), callback)
		deferredCallbackComplete.resolve(true)
		await endDragPromise


		const newEvent = makeEvent("eventNew", new Date(2021, 0, 5, 13, 0), new Date(2021, 0, 5, 14, 30), "uid3")

		// Simulate the new CalendarEvent entity being loaded and daysForEvents has been updated
		inputEvents[2] = newEvent
		const {eventsForDays: newEventsForDays} = init(inputEvents)

		const {shortEvents, longEvents} = handler.getEventsOnDays(days, newEventsForDays, new Set())
		const expected = {
			shortEvents: [
				[], [], [], [], [
					newEvent
				], [], []
			],
			longEvents: [
				inputEvents[0], inputEvents[1]
			],
		}

		o({shortEvents, longEvents: Array.from(longEvents)}).deepEquals(expected)
	})
})


