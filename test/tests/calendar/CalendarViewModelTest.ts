import o from "ospec"
import { accountMailAddress, calendarGroupId, makeCalendarModel, makeEvent, makeUserController } from "./CalendarTestUtils.js"
import type { LoginController } from "../../../src/api/main/LoginController.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { assertNotNull, downcast, getStartOfDay, LazyLoaded, neverNull, noOp } from "@tutao/tutanota-utils"
import type { CalendarEvent } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { createCalendarEvent, createEncryptedMailAddress } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { DateTime } from "luxon"
import { addDaysForEvent, getTimeZone } from "../../../src/calendar/date/CalendarUtils.js"
import type { CalendarInfo, CalendarModel } from "../../../src/calendar/model/CalendarModel.js"
import type { CreateCalendarEventViewModelFunction } from "../../../src/calendar/view/CalendarViewModel.js"
import { CalendarViewModel } from "../../../src/calendar/view/CalendarViewModel.js"
import { CalendarEventViewModel } from "../../../src/calendar/date/CalendarEventViewModel.js"
import { EntityClient } from "../../../src/api/common/EntityClient.js"
import type { EntityUpdateData } from "../../../src/api/main/EventController.js"
import { EventController } from "../../../src/api/main/EventController.js"
import { ProgressTracker } from "../../../src/api/main/ProgressTracker.js"
import { DeviceConfig } from "../../../src/misc/DeviceConfig.js"
import { OperationType } from "../../../src/api/common/TutanotaConstants.js"
import { getElementId, getListId } from "../../../src/api/common/utils/EntityUtils.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import { ReceivedGroupInvitationsModel } from "../../../src/sharing/model/ReceivedGroupInvitationsModel.js"
import { ProgressMonitor } from "../../../src/api/common/utils/ProgressMonitor.js"

let saveAndSendMock
let rescheduleEventMock
o.spec("CalendarViewModel", async function () {
	let entityClientMock: EntityRestClientMock

	function initCalendarViewModel(makeViewModelCallback: CreateCalendarEventViewModelFunction, eventController?): CalendarViewModel {
		if (eventController == null) {
			eventController = downcast({
				addEntityListener: () => Promise.resolve(),
			})
		}

		const progressTracker: ProgressTracker = {
			registerMonitorSync: () => 1,
			getMonitor: () => {
				return new ProgressMonitor(100, noOp)
			},
		} as Partial<ProgressTracker> as ProgressTracker
		const deviceConfig: DeviceConfig = downcast({
			getHiddenCalendars: (Id) => [],
		})
		const calendarInvitations: ReceivedGroupInvitationsModel = downcast({})
		let calendarModel: CalendarModel = makeCalendarModel()
		const userController = makeUserController()
		const loginController: LoginController = downcast({
			getUserController: () => userController,
			isInternalUserLoggedIn: () => true,
		})
		return new CalendarViewModel(
			loginController,
			makeViewModelCallback,
			calendarModel,
			new EntityClient(entityClientMock),
			eventController,
			progressTracker,
			deviceConfig,
			calendarInvitations,
		)
	}

	function init(events) {
		const month = {
			start: new Date(2021, 0, 1),
			end: new Date(2021, 0, 30),
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
				new Date(2021, 0, 7),
			],
			eventsForDays,
			month,
		}
	}

	o.beforeEach(function () {
		entityClientMock = new EntityRestClientMock()
		saveAndSendMock = o.spy(() => Promise.resolve(true))
		rescheduleEventMock = o.spy(() => Promise.resolve())
	})
	o("Can init view model", function () {
		const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
		// @ts-ignore
		o(viewModel).notEquals(undefined)
		o(viewModel.selectedDate()).deepEquals(getStartOfDay(new Date()))
	})
	o.spec("Dragging Events", function () {
		o("Start then drag then change mind is noop", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let originalEventStartTime = new Date(2021, 8, 22)
			const event = makeEvent("event", originalEventStartTime, new Date(2021, 8, 23))
			// Dragged a bit
			simulateDrag(event, new Date(2021, 8, 21), viewModel)
			// Went back to original date
			await simulateEndDrag(originalEventStartTime, new Date(2021, 8, 22), viewModel)
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([])
		})
		o("A good drag and drop run", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))
			simulateDrag(event, new Date(2021, 8, 24), viewModel)
			o(viewModel._draggedEvent?.eventClone.startTime.toISOString()).equals(new Date(2021, 8, 24).toISOString())
			o(viewModel._draggedEvent?.eventClone.endTime.toISOString()).equals(new Date(2021, 8, 25).toISOString())
			const temporaryEvent = neverNull(viewModel._draggedEvent?.eventClone)
			let diff = new Date(2021, 8, 25).getTime() - originalDate.getTime()
			const endDragPromise = viewModel.onDragEnd(diff)
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent])
			await endDragPromise
			// Don't reset yourself if there is no problems
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent])
		})
		o("Complete drag and drop and saving fails", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModelThatFailsSaving)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))
			simulateDrag(event, new Date(2021, 8, 24), viewModel)
			await simulateEndDrag(originalDate, new Date(2021, 8, 25), viewModel)
			// The callback returned false, so we remove our event from transient events
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([])
		})
		o("Complete drag and drop and saving does an error", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModelThatThrowsOnSaving)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))
			simulateDrag(event, new Date(2021, 8, 24), viewModel)
			let diff = new Date(2021, 8, 25).getTime() - originalDate.getTime()
			const endDragPromise = viewModel.onDragEnd(diff)
			await assertThrows(Error, () => endDragPromise)
			// The callback threw, so we remove our event from transient events
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([])
		})
		o("Drag while having temporary events should still work", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let origStartDate1 = new Date(2021, 8, 22)
			const event1 = makeEvent("event1", origStartDate1, new Date(2021, 8, 23))
			let origStartDate2 = new Date(2021, 8, 22)
			const event2 = makeEvent("event2", origStartDate2, new Date(2021, 8, 23))
			//start first drag
			simulateDrag(event1, new Date(2021, 8, 24), viewModel)
			const temporaryEvent1 = neverNull(viewModel._draggedEvent?.eventClone)
			//star first drop
			let diff = new Date(2021, 8, 25).getTime() - origStartDate1.getTime()
			const endDragPromise1 = viewModel.onDragEnd(diff)
			//start second drag
			simulateDrag(event2, new Date(2021, 8, 24), viewModel)
			const temporaryEvent2 = neverNull(viewModel._draggedEvent?.eventClone)
			//we have a temporary and a transient event
			o(viewModel._draggedEvent?.eventClone).equals(temporaryEvent2)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])
			//start second drop
			diff = new Date(2021, 8, 25).getTime() - origStartDate2.getTime()
			const endDragPromise2 = viewModel.onDragEnd(diff)
			// Now we have two transient events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])
			//end first drop
			await endDragPromise1
			//end second drop
			await endDragPromise2
			// the callback was successful so we keep it in temporary events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])
		})
		o("Drag while having temporary events but the second update failed", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let origStartDate1 = new Date(2021, 8, 22)
			const event1 = makeEvent("event1", origStartDate1, new Date(2021, 8, 23), "uid1")
			let origStartDate2 = new Date(2021, 8, 22)
			const event2 = makeEvent("event2", origStartDate2, new Date(2021, 8, 23), "uid2")
			//start first drag
			simulateDrag(event1, new Date(2021, 8, 24), viewModel)
			const temporaryEvent1 = neverNull(viewModel._draggedEvent?.eventClone)
			//star first drop
			let diff = new Date(2021, 8, 25).getTime() - origStartDate1.getTime()
			const endDragPromise1 = viewModel.onDragEnd(diff)
			//End first drop
			await endDragPromise1
			//start second drag
			simulateDrag(event2, new Date(2021, 8, 24), viewModel)
			const temporaryEvent2 = neverNull(viewModel._draggedEvent?.eventClone)
			o(viewModel._draggedEvent?.originalEvent).equals(event2)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])
			//star second drop
			diff = new Date(2021, 8, 25).getTime() - origStartDate2.getTime()
			//this will fail
			viewModel._createCalendarEventViewModelCallback = makeCalendarEventViewModelThatFailsSaving
			const endDragPromise2 = viewModel.onDragEnd(diff)
			// Now we have two transient events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])
			await endDragPromise2
			// saving failed so we remove it from our temporary events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])
		})
		o("Drag while having temporary events and then the first update fails", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let origStartDate1 = new Date(2021, 8, 22)
			const event1 = makeEvent("event1", origStartDate1, new Date(2021, 8, 23), "uid1")
			let origStartDate2 = new Date(2021, 8, 22)
			const event2 = makeEvent("event2", origStartDate2, new Date(2021, 8, 23), "uid2")
			//start first drag
			simulateDrag(event1, new Date(2021, 8, 24), viewModel)
			const temporaryEvent1 = neverNull(viewModel._draggedEvent?.eventClone)
			//start first drop
			let diff = new Date(2021, 8, 25).getTime() - origStartDate1.getTime()
			//this will fail
			viewModel._createCalendarEventViewModelCallback = makeCalendarEventViewModelThatFailsSaving
			const endDragPromise1 = viewModel.onDragEnd(diff)
			//start second drag
			simulateDrag(event2, new Date(2021, 8, 24), viewModel)
			const temporaryEvent2 = neverNull(viewModel._draggedEvent?.eventClone)
			//now we have a temporary and a transient event
			o(viewModel._draggedEvent?.originalEvent).equals(event2)
			o(viewModel._draggedEvent?.eventClone).equals(temporaryEvent2)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])
			//start second drop
			diff = new Date(2021, 8, 25).getTime() - origStartDate1.getTime()
			//this will not fail
			viewModel._createCalendarEventViewModelCallback = makeCalendarEventViewModel
			const endDragPromise2 = viewModel.onDragEnd(diff)
			// Now we have two temporary events and we are not dragging anymore
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])
			await endDragPromise1
			await endDragPromise2
			// the callback failed so we remove it from our temporary events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent2])
		})
	})
	o.spec("Filtering events", function () {
		o("Before drag, input events are all used", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			const inputEvents = [
				makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
				makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
				makeEvent("event3", new Date(2021, 0, 3, 13, 0), new Date(2021, 0, 3, 14, 30), "uid3"),
			]
			const { days, eventsForDays } = init(inputEvents)
			const expected = {
				shortEvents: [[], [], [inputEvents[2]], [], [], [], []],
				longEvents: [inputEvents[0], inputEvents[1]],
			}

			viewModel._replaceEvents(eventsForDays)

			const { shortEvents, longEvents } = viewModel.getEventsOnDays(days)
			o({
				shortEvents,
				longEvents: Array.from(longEvents),
			}).deepEquals(expected)
		})
		o("During drag, temporary event overrides the original version", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let originalDateForDraggedEvent = new Date(2021, 0, 3, 13, 0)
			const inputEvents = [
				makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
				makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
				makeEvent("event3", originalDateForDraggedEvent, new Date(2021, 0, 3, 14, 30), "uid3"),
			]
			const { days, eventsForDays } = init(inputEvents)

			viewModel._replaceEvents(eventsForDays)

			//drag
			simulateDrag(inputEvents[2], new Date(2021, 0, 4, 13, 0), viewModel)
			const expected = {
				shortEvents: [[], [], [], [viewModel._draggedEvent?.eventClone], [], [], []],
				longEvents: [inputEvents[0], inputEvents[1]],
			} as any
			const { shortEvents, longEvents } = viewModel.getEventsOnDays(days)
			o({
				shortEvents: shortEvents,
				longEvents: Array.from(longEvents),
			}).deepEquals(expected)
		})
		o("After drop, before load", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let originalDateForDraggedEvent = new Date(2021, 0, 3, 13, 0)
			const inputEvents = [
				makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
				makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
				makeEvent("event3", originalDateForDraggedEvent, new Date(2021, 0, 3, 14, 30), "uid3"),
			]
			const { days, eventsForDays, month } = init(inputEvents)

			viewModel._replaceEvents(eventsForDays)

			//drag
			simulateDrag(inputEvents[2], new Date(2021, 0, 4, 13, 0), viewModel)
			//end drag
			await simulateEndDrag(originalDateForDraggedEvent, new Date(2021, 0, 5, 13, 0), viewModel)
			const expected = {
				shortEvents: [[], [], [], [], [viewModel._transientEvents[0]], [], []],
				longEvents: [inputEvents[0], inputEvents[1]],
			}
			const { shortEvents, longEvents } = viewModel.getEventsOnDays(days)
			o({
				shortEvents,
				longEvents: Array.from(longEvents),
			}).deepEquals(expected)
		})
	})
	o.spec("entityEventsReceived", function () {
		o("transient event is removed on update", async function () {
			const entityListeners: any[] = []
			const eventController: EventController = downcast({
				addEntityListener(listener) {
					entityListeners.push(listener)
				},
			})
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel, eventController)
			const originalDateForDraggedEvent = new Date(2021, 0, 3, 13, 0)
			let eventToDrag = makeEvent("event3", originalDateForDraggedEvent, new Date(2021, 0, 3, 14, 30), "uid3")
			const inputEvents = [
				makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
				makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
				eventToDrag,
			]
			const { days, eventsForDays, month } = init(inputEvents)

			viewModel._replaceEvents(eventsForDays)

			//drag
			simulateDrag(inputEvents[2], new Date(2021, 0, 4, 13, 0), viewModel)
			//end drag
			const newData = new Date(2021, 0, 5, 13, 0)
			await simulateEndDrag(originalDateForDraggedEvent, newData, viewModel)
			o(viewModel.temporaryEvents.some((e) => e.uid === eventToDrag.uid)).equals(true)("Has transient event")
			o(entityListeners.length).equals(1)("Listener was added")
			const entityUpdate: EntityUpdateData = {
				application: "tutanota",
				type: "CalendarEvent",
				instanceListId: getListId(eventToDrag),
				instanceId: getElementId(eventToDrag),
				operation: OperationType.CREATE,
			}
			const updatedEventFromServer = makeEvent(getElementId(eventToDrag), newData, new Date(2021, 0, 5, 14, 30), assertNotNull(eventToDrag.uid))
			entityClientMock.addListInstances(updatedEventFromServer)
			await entityListeners[0]([entityUpdate], eventToDrag._ownerGroup)
			o(viewModel.temporaryEvents.some((e) => e.uid === eventToDrag.uid)).equals(false)("Transient event removed")
		})
	})
})

function simulateDrag(originalEvent: CalendarEvent, newDate: Date, viewModel: CalendarViewModel) {
	let diff = newDate.getTime() - originalEvent.startTime.getTime()
	viewModel.onDragStart(originalEvent, diff)
	return diff
}

async function simulateEndDrag(originalDate: Date, newDate: Date, viewModel: CalendarViewModel) {
	let diff = newDate.getTime() - originalDate.getTime()
	await viewModel.onDragEnd(diff)
}

function makeTestEvent(): CalendarEvent {
	const zone = getTimeZone()

	const wrapEncIntoMailAddress = (address) =>
		createEncryptedMailAddress({
			address,
		})

	const encMailAddress = wrapEncIntoMailAddress(accountMailAddress)
	return createCalendarEvent({
		summary: "test event",
		startTime: DateTime.fromObject(
			{
				year: 2020,
				month: 5,
				day: 26,
				hour: 12,
			},
			{ zone },
		).toJSDate(),
		endTime: DateTime.fromObject(
			{
				year: 2020,
				month: 5,
				day: 26,
				hour: 13,
			},
			{ zone },
		).toJSDate(),
		description: "note",
		location: "location",
		_ownerGroup: calendarGroupId,
		organizer: encMailAddress,
	})
}

async function makeCalendarEventViewModel(existingEvent: CalendarEvent, calendars: LazyLoaded<Map<Id, CalendarInfo>>): Promise<CalendarEventViewModel> {
	return downcast({
		saveAndSend: saveAndSendMock,
		rescheduleEvent: rescheduleEventMock,
	})
}

async function makeCalendarEventViewModelThatFailsSaving(
	existingEvent: CalendarEvent,
	calendars: LazyLoaded<Map<Id, CalendarInfo>>,
): Promise<CalendarEventViewModel> {
	return downcast({
		saveAndSend: () => Promise.resolve(false),
		rescheduleEvent: () => Promise.resolve(),
	})
}

async function makeCalendarEventViewModelThatThrowsOnSaving(
	existingEvent: CalendarEvent,
	calendars: LazyLoaded<Map<Id, CalendarInfo>>,
): Promise<CalendarEventViewModel> {
	return downcast({
		saveAndSend: () => Promise.reject(new Error("whoopsie")),
		rescheduleEvent: () => Promise.resolve(),
	})
}
